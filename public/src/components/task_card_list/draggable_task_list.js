'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const _ = require ('lodash');

/**
 * DraggableUI 用の TaskList
 * 指定されたStage, Assigneeに一致するTaskListを生成・管理する
 *
 * 本クラスのインスタンスが持つTaskListをSlave, 全てのTaskが含まれたTaskListをMasterとする
 * When updated related task's stage or assignee, or added in master tasks
 *      Slaveを作り直す（コストは若干かかるが、単純でバグりにくい）
 * When updated slave tasks (Draggableで更新される)
 *      イベントを発火する
 *      add:
 *          -. Taskとslaveのassignee, stage情報が異なる場合、 onUpdatedStage を発火する
 *          -. 挿入後の前後との相対位置がmasterと異なる場合、最小の変更になるよう onUpdatedPriority を発火する
 *              array pattern:   ※ o: target task, [xy_]: other task
 *              1. |o|          no update
 *              2. |ox_*|       if target task is not before x in master, insert to before x
 *              3. |_*xo|       if target task is not after x in master, insert to before x + 1 in master
 *              4. |_*xoy_*|    if target task is not after x and before y, insert to before x + 1 in master
 *      remove: この後必ずどこかのslaveでaddされるので何もしない
 *
 * @param o
 * @param {null|String} o.assignee              UserID or null
 * @param {model.Stage} o.stage   Stage
 * @param {ko.observableArray} o.masterTasks   Master task list
 * @event updatedStatus(task, stage, user)
 * @event updatedPriority(task, afterTask)
 */
class DraggableTaskList extends EventEmitter2 {
    constructor({eventEmitterOptions={}, masterTasks, stage, user}) {
        super(eventEmitterOptions);
        this.masterTasks = masterTasks;
        this.stage = stage;
        this.user = user;
        this.id = _.uniqueId();

        // task の監視プロパティ名と、subscriptionを格納するプロパティ名（重複して監視しないようにするため）
        this.taskSubscriptionParams = [
            {targetProperty: 'stage', subscriptionName: `_draggableTaskList_subscriptionStage_${this.id}`},
            {targetProperty: 'user', subscriptionName: `_draggableTaskList_subscriptionUser_${this.id}`}
        ];

        // slave task list
        // rateLimit設定したいけど、設定するとsortable-uiが綺麗に動かない
        this.tasks = ko.observableArray();
        this.tasks.parent = this;

        // create tasks
        this.allUpdateTasks(this.masterTasks);

        // subscribe
        this.subscribeMasterTasks(this.masterTasks);
        this.masterTasks().forEach(this.subscribeTask.bind(this));
        this.subscribeSlaveTasks(this.tasks);
    }

    // slave task list の変更を監視する
    subscribeSlaveTasks(slaveTasks) {
        slaveTasks.subscribe(changes => {
            // deleted の後に必ず added が来るはずなので、deleted は無視する
            _.find(changes, {status: 'added'}).forEach(change => {
                const task = change.value;

                // stage, user の変更
                if (!this.matchCondition(task)) {
                    this.emit('updatedStage', {task, stage: this.stage, user: this.user});
                }

                // priority の変更
                if (!this.needUpdatePriority(task, this.masterTasks, this.tasks)) {
                    const afterTask = this.getTaskInsertBeforeOf(task, this.masterTasks, this.tasks);
                    if (afterTask) {
                        this.emit('updatedPriority', {task, afterTask});
                    }
                }
            }, this);

        }, this, 'arrayChange');
    }

    // master task list の変更を監視する
    subscribeMasterTasks(masterTasks) {
        masterTasks.subscribe(changes => {
            // deleted は後で必ず added が行われるので無視する
            const tasks = _.chain(changes).filter({status: 'added'}).map('value').value();

            // 新しいTaskを監視する
            tasks.forEach(this.subscribeTask.bind(this));

            // 関連するTaskが変更されていたら、slave task list を作り直す
            if (_.some(tasks, this.isRelatedTask.bind(this))) {
                this.allUpdateTasks(masterTasks);
            }
        }, this, 'arrayChange');
    };

    // taskの変更を監視する
    subscribeTask(task) {
        // 監視プロパティが更新されたら、slave task list を作り直す
        this.taskSubscriptionParams.forEach(sub => {
            if (!task[sub.subscriptionName]) {  // 重複subscribe防止
                task[sub.subscriptionName] = task[sub.targetProperty].subscribe(() => {
                    if (this.isRelatedTask(task)) {
                        this.allUpdateTasks(this.masterTasks);
                    }
                });
            }
        });
    };

    // 関わりあるTaskか
    // slave task list で監視している task が存在する または
    // stage, assignee が match する task が存在する
    isRelatedTask(task) {
        return this.existsId(task.id()) || this.matchCondition(task);
    };

    // slave task list を作り直す
    // ただし、observableArrayは別で利用されている場合があるので、arrayの中身だけ入れ替える
    allUpdateTasks(masterTasks) {
        const match = this.matchCondition.bind(this);
        const nextTasks = masterTasks().filter(match);

        // pushやremoveを使うとうまい具合に通知してくれない
        const args = nextTasks;
        args.unshift(this.tasks().length);
        args.unshift(0);
        this.tasks.splice.apply(this.tasks, args);
    };

    // master task list と slave task list を比較して、priority に変更が必要かチェックする
    // 条件はクラスのコメント参照
    needUpdatePriority(targetTask, masterTasks, slaveTasks) {
        const slave = slaveTasks();
        const master = masterTasks();

        const slaveIdx = slave.indexOf(targetTask);
        const masterIdx = master.indexOf(targetTask);
        if (slaveIdx === -1) { throw new Error('added task not found'); }
        // 1
        if (slave.length === 1) { return false; }
        // 2
        if (slaveIdx === 0) { return masterIdx < master.indexOf(slave[1]); }
        // 3
        if (slaveIdx === slave.length - 1) { return masterIdx > master.indexOf(slave[slaveIdx - 1]); }
        // 4
        return masterIdx > master.indexOf(slave[slaveIdx - 1]) &&
            masterIdx < master.indexOf(slave[slaveIdx + 1]);
    };

    // target task を master task の配置すべき一の後ろのTaskを返す
    getTaskInsertBeforeOf(targetTask, masterTasks, slaveTasks) {
        const slave = slaveTasks();
        const master = masterTasks();

        const slaveIdx = slave.indexOf(targetTask);
        if (slaveIdx === -1) { throw new Error('added task not found'); }
        // 1
        if (slave.length === 1) { return false; }
        // 2
        if (slaveIdx === 0) { return slave[1]; }
        // 3 and 4
        const beforeIdx = master.indexOf(slave[slaveIdx - 1]);
        return beforeIdx + 1 < master.length ? master[beforeIdx + 1] : null;
    };

    // taskが指定されたフィルター条件に合うか
    matchCondition(task) {
        return task.stage() === this.stage && task.user() === this.user;
    };

    // IDが一致するtaskが存在するか
    existsId(needleTaskId) {
        return !!_.find(this.tasks(), task => task.id() === needleTaskId);
    }

}


module.exports = DraggableTaskList;