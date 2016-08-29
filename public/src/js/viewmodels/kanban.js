'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const _ = require('lodash');
const moment = require('moment');
const util = require('../modules/util');
const localStorage = require('../modules/localStorage');
const DraggableTaskList = require('./draggable_task_list');
const global = window;


/**
 * カンバンのViewModel
 *
 * @event overWIPLimitDropped(arg, user, targetSlaveTaskList) WIPリミットを超えてD&Dした (argはknockout-sortable.beforeMoveイベント引数のarg）
 * @event workingTaskDropped(arg, task)
 */
class Kanban extends EventEmitter2 {
    constructor({eventEmitterOptions={}, socket, project}) {
        super(eventEmitterOptions);

        this.socket = socket;
        this.joinedUsers = ko.observableArray();
        this.activitiesTexts = ko.observableArray();

        this.searchQuery = ko.observable();
        this.searchQuery.subscribe(_.debounce(this.searchTasks, 500));

        this.viewMode = ko.observable(localStorage.getItem('viewMode')); // full or compact
        this.viewMode.subscribe(val => localStorage.setItem('viewMode', val));

        this.project = project;
        this.users = project.users;
        this.tasks = project.tasks;
        this.labels = project.labels;
        this.stats = project.stats;
        this.stages = project.stages;

        // TODO: ? this.stages
        // that.stages[name] = 各ステージのTasks
        // this.stages = null;

        // that.draggableList[stage] = DraggableTaskList
        // that.draggableList[stage][userId] = DraggableTaskList
        this.draggableList = null;

        this.loginUser = ko.computed(() => {
            return this.users().find(user => user.username() === global.username);
        });

        this.canAssignUsers = ko.computed(() => {
            return this.users().filter(user => !user.isWipLimited());
        });

        this.initDraggableTaskList();
        this.initSocket();
    }

    // 各ステージ、各ユーザ毎にDraggableTaskListを作る
    // ユーザの追加を監視する
    initDraggableTaskList() {
        this.draggableList = {};
        const _params = {
            masterTasks: this.tasks,
            // onUpdatedStage: this.updateStage,
            // onUpdatedPriority: that.updateIssuePriority
        };

        this.stages().forEach(stage => {
            const params = _.assign(_.clone(_params), {stage: stage, user: null});
             let list;

            if (stage.assigned()) {
                list = {};
                this.users().forEach(user => {
                    list[user.id()] = new DraggableTaskList(_.assign(_.clone(params), {assignee: user.id()}));
                });
                this.users.subscribe(changes => {
                    _.chain(changes)
                        .find({status: 'added'})
                        .map('value')
                        .filter(user =>!list[user.id()])
                        .forEach(user => {
                            list[user.id()] = new DraggableTaskList(_.extend(_.clone(params), {assignee: user.id()}));
                        })
                        .value(); // value method is exec
                }, this, 'arrayChange');
            } else {
                list = new DraggableTaskList(params);
            }

            list.on('updatedStatus', ({task, stage, user}) => {
                // update stage
            });

            list.on('updatedPriority', ({task, afterTask}) => {
                // update task priority
            });

            this.draggableList[stage.name] = list;
        });
    }

    initSocket() {
    }

    onBeforeMoveDrag(arg) {
        const list = arg.targetParent.parent;
        const task = arg.item;

        if (!(list instanceof DraggableTaskList)) { return; }

        // 作業中か
        if (task.isWorking()) {
            arg.cancelDrop = true;
            this.emit('workingTaskDropped', arg, task);
        }

        // WIPLimitに達するか
        if (task.user !== list.user) {
            const user = list.user;
            const cost = task.cost();
            if (user.willBeOverWipLimit(cost.value())) {
                arg.cancelDrop = true;
                this.emit('overWIPLimitDropped', arg, user, list);
            }
        }
    }

    searchTasks(searchQuery='') {
        searchQuery = searchQuery.trim();

        if (searchQuery) { // search
            const queries = util.splitSearchQuery(searchQuery);
            this.tasks().forEach(task => {
                const text = task.textForSearch();
                task.isVisible(queries.every(q  => _.includes(text, q)));
            });

        } else { // all visible
            this.tasks().forEach(task => {
                task.isVisible(true);
            });
        }
    }

    /*** user ***/

    updateUserOrder(user, beforeUser) {
        const beforeUsername = beforeUser && beforeUser.username();
        this.socket.emit('updateUserOrder', {username: user.username(), beforeUsername});
    }



    /*** task ***/
}


        // // 追加するユーザの名前
        // that.addMemberUserName = ko.observable();
        //
        // // 追加するIssueのタイトル
        // that.addIssueTitle = ko.observable();
        //
        // // 追加するIssueの説明
        // that.addIssueBody = ko.observable();
        //
        // // 追加するIssueのステージ
        // that.addIssueStage = ko.observable('issue');
        //
        // // 追加するIssueのコスト
        // that.addIssueCost = ko.observable();
        //
        // // 追加するIssueのLabels
        // that.addIssueLabels = ko.observableArray();
        //
        // // アサイン先のユーザ名
        // that.assignUserName = ko.observable();
        //
        // // 選択しているIssue
        // that.selectedIssue = ko.observable();
        //
        // // Issueの更新後のタイトル
        // that.updateIssueDetailTitle = ko.observable();
        //
        // // Issueの更新後のBody
        // that.updateIssueDetailBody = ko.observable();
        //
        // // Issueの更新後のLabels
        // that.updateIssueDetailLabels = ko.observableArray();
        //
        // // Issueの更新後のCost
        // that.updateIssueDetailCost = ko.observable();
        //
        // // Issueの更新後の作業状態(isWorking)
        // that.updateIssueDetailIsWorking = ko.observable(false);
        //
        // // IssueDetail WorkingHistoryの表示mode ('edit' or 'view')
        // that.issueDetailWorkHistoryMode = ko.observable('view');
        //
        // // Issueの更新後のWorkHistory
        // that.updateIssueDetailWorkHistory = ko.observableArray();
        //
        // that.selectedIssue.subscribe(function (issue) {
        //     that.updateIssueDetailTitle(issue ? issue.title() : null);
        //     that.updateIssueDetailBody(issue ? issue.body() : null);
        //     that.updateIssueDetailLabels(issue ? _.clone(issue.labels()) : []);
        //     var cost = issue ? issue.cost() : 0;
        //     that.updateIssueDetailCost(String(cost ? cost : 0));
        //     that.updateIssueDetailIsWorking(issue ? issue.isWorking() : false);
        //     that.issueDetailWorkHistoryMode('view');
        //     that.updateIssueDetailWorkHistory.removeAll();
        // });
        //
        // // 選択しているメンバー
        // that.selectedMember = ko.observable();
        //
        // // 編集用の仮のWIP制限
        // that.settingsWipLimit = ko.observable();
        //
        // that.selectedMember.subscribe(function (member) {
        //     if (member) {
        //         that.settingsWipLimit(member.wipLimit());
        //     }
        // });
        //
        //
        // // メンバーを追加する
        // that.addMember = function () {
        //     that.socket.emit('add-member', {userName: that.addMemberUserName()}, function (res) {
        //         if (res.status === 'success') {
        //             // reset form
        //             that.addMemberUserName(null);
        //         }
        //     });
        // };
        //
        // // メンバーを削除する
        // that.removeMember = function () {
        //     var member = that.selectedMember();
        //     if (!member) {
        //         console.error('unselected member');
        //         return;
        //     }
        //
        //     that.socket.emit('remove-member', {userName: member.userName()}, function (res) {
        //         if (res.status === 'success') {
        //             // モーダルを閉じる
        //             $('.modal').modal('hide');
        //         }
        //     });
        // };
        //
        // // メンバー設定を更新する
        // that.updateMemberWipLimit = function () {
        //     var member = that.selectedMember();
        //     if (!member) { return console.error('unselected member'); }
        //
        //     that.socket.emit('update-member', {userName: member.userName(), wipLimit: that.settingsWipLimit()});
        // };
        //
        // that.updateMemberOrderUp = function (member) {
        //     var members = that.members();
        //     var idx = members.indexOf(member);
        //     if (idx === 0) { return console.log(member.userName() + ' is already top'); }
        //     that.updateMemberOrder(member, members[idx - 1]);
        // };
        //
        // that.updateMemberOrderDown = function (member) {
        //     var members = that.members();
        //     var idx = members.indexOf(member);
        //     if (idx === members.length - 1) { return console.log(member.userName() + ' is already bottom'); }
        //     that.updateMemberOrder(member, (idx + 2) === members.length ? null : members[idx + 2]);
        // };
        //
        // // タスクの優先順位を変更する
        // that.updateMemberOrder = function (member, insertBeforeOfMember) {
        //     var insertBeforeOfUserName =  insertBeforeOfMember ? insertBeforeOfMember.userName() : null;
        //     that.socket.emit('update-member-order', {userName: member.userName(), insertBeforeOfUserName: insertBeforeOfUserName});
        // };
        //
        // // Issueと追加する
        // that.addIssue = function () {
        //     var title = that.addIssueTitle(),
        //         body = that.addIssueBody(),
        //         stage = that.addIssueStage(),
        //         cost = that.addIssueCost(),
        //         labels = that.addIssueLabels().map(function (x) { return x.name(); });
        //
        //     that.socket.emit('add-issue', {title: title, body: body,
        //         stage: stage, cost: cost, labels: labels});
        // };
        //
        // // Issueを削除する (archive)
        // that.removeIssue = function (issue) {
        //     that.socket.emit('remove-issue', {issueId: issue._id()}, _.noop);
        // };
        //
        // // Issueを削除する (archive)
        // that.removeIssueWithSelected = function () {
        //     console.log(that.selectedIssue());
        //     that.removeIssue(that.selectedIssue());
        // };

        // タスクをアサインする
        // ユーザが指定されていない場合はアンアサインする
        that.assignIssue = function () {
            var issue = that.selectedIssue(),
                user = that.project.getMemberByName(that.assignUserName());

            if (!issue) { throw new Error('issue is not selected.'); }

            that.socket.emit('update-stage', {
                issueId: issue._id(),
                userId: user ? user._id() : null,
                toStage: user ? stages.todo.name : stages.backlog.name
            }, function () {
                // reset form
                that.selectedIssue(null);
                that.assignUserName(null);
            });
        };

        // タスクのステージを一つ次へ移動する
        that.nextStage = function (issue) {
            that.stepStage(issue, 1);
        };

        // タスクのステージを一つ前へ移動する
        that.prevStage = function (issue) {
            that.stepStage(issue, -1);
        };

        // タスクのステージをstep分移動する
        that.stepStage = function (issue, step) {
            var currentStage = issue.stage(),
                toIndex = stageTypeKeys.indexOf(currentStage) + step,
                toStage;

            if (!_.inRange(toIndex, 0, stageTypeKeys.length)) {
                throw new Error('cannot change stage: ' +  toIndex);
            }

            toStage = stageTypeKeys[toIndex];

            // check assign
            // 担当者が必要なステージから必要ないステージへ移行した際には
            // 担当者を外す
            var currentStageDetail = stages[currentStage];
            var toStageDetail = stages[toStage];
            var assign = undefined;
            if (currentStageDetail.assigned && !toStageDetail.assigned) {
                assign = null; // unassign
            }

            that.updateStage(issue, toStage, assign);
        };

        // タスクのステージを変更する
        that.updateStage = function (issue, toStage, /* option */userId) {
            that.socket.emit('update-stage', {issueId: issue._id(), toStage: toStage, userId: userId !== undefined ? userId : issue.assignee()});
        };

        // タスクのタイトル/説明/ラベルリストを更新する
        that.updateIssueDetail = function () {
            var issue = that.selectedIssue();
            if (!issue) { throw new Error('issue is not selected'); }

            that.updateIssueLabels();
            that.updateIssueIsWorking();

            that.socket.emit('update-issue-detail', {
                issueId: issue._id(),
                title: that.updateIssueDetailTitle(),
                body: that.updateIssueDetailBody(),
                cost: Number(that.updateIssueDetailCost())
            }, function (res) {
                if (res.status === 'success') {
                    // reset form
                    that.selectedIssue(null);
                }
            });
        };

        that.canUpdateIssueDetail = function () {
            return !that.updateIssueWillBeOverWipLimit();
        };

        that.updateIssueWillBeOverWipLimit = function () {
            var issue = that.selectedIssue();
            if (!issue) { return false; }
            var toMember = issue.assigneeMember();
            if (!toMember) { return false; }
            var curCost = Number(issue.cost());
            var newCost = Number(that.updateIssueDetailCost());
            var curCost2 = curCost ? curCost : defaultCost;
            var newCost2 = newCost ? newCost : defaultCost;
            return toMember.willBeOverWipLimit(newCost2 - curCost2);
        };

        that.updateIssueIsWorking = function () {
            var issue = that.selectedIssue();
            var curIsWorking = issue.isWorking();
            var newIsWorking = that.updateIssueDetailIsWorking();

            if (curIsWorking !== newIsWorking) {
                that.socket.emit('update-issue-working-state', {
                    issueId: issue._id(),
                    isWorking: newIsWorking
                }, _.noop());
            }
        };

        that.updateIssueLabels = function () {
            var issue = that.selectedIssue();
            var curLabels = issue.labels();
            var newLabels = that.updateIssueDetailLabels();
            var adds = newLabels.filter(function (x) { return !_.includes(curLabels, x); });
            var removes = curLabels.filter(function (x) { return !_.includes(newLabels, x); });

            if (that.issueDetailWorkHistoryMode() === 'edit') {
                that.onClickWorkHistorySave();
            }

            adds.forEach(function (label) {
                that.socket.emit('attach-label', {
                    issueId: issue._id(),
                    labelName: label.name()
                }, _.noop);
            });

            removes.forEach(function (label) {
                that.socket.emit('detach-label', {
                    issueId: issue._id(),
                    labelName: label.name()
                }, _.noop);
            });
        };

        // タスクの優先順位を変更する
        that.updateIssuePriority = function (issue, insertBeforeOfIssue) {
            var insertBeforeOfIssueId =  insertBeforeOfIssue ? insertBeforeOfIssue._id() : null;
            that.socket.emit('update-issue-priority', {issueId: issue._id(), insertBeforeOfIssueId: insertBeforeOfIssueId});
        };

        // events
        that.onClickIssueDetail = function (issue, e) {
            that.selectedIssue(issue);
            var $ele = $(e.target.parentElement);
            if ($ele.attr('data-toggle') !== 'modal') {
                $ele = $ele.parents('li[data-toggle=modal]');
            }
            $($ele.attr('data-target')).modal('show');
            return util.cancelBubble(e);
        };

        that.onClickIssueNextStage = function (issue, e) {
            that.nextStage(issue);
            return util.cancelBubble(e);
        };

        that.onClickIssuePrevStage = function (issue, e) {
            that.prevStage(issue);
            return util.cancelBubble(e);
        };

        that.onClickIssueArchive = function (issue, e) {
            that.selectedIssue(issue);
            var $ele = $(e.target.parentElement);
            if ($ele.attr('data-toggle') !== 'modal') {
                $ele = $ele.parents('li[data-toggle=modal]');
            }
            $($ele.attr('data-target')).modal('show');
            return util.cancelBubble(e);
        };

        that.onClickIssueAssign = function (issue, e) {
            that.selectedIssue(issue);
            var $ele = $(e.target.parentElement);
            if ($ele.attr('data-toggle') !== 'modal') {
                $ele = $ele.parents('li[data-toggle=modal]');
            }
            $($ele.attr('data-target')).modal('show');
            return util.cancelBubble(e);
        };

        that.onClickDeleteMember = function () {
            $('*').modal('hide');
            return true;
        };

        that.onClickStartToWork = function (issue) {
            that.socket.emit('update-issue-working-state', {
                issueId: issue._id(),
                isWorking: true
            }, _.noop());
        };

        that.onClickStopToWork = function (issue) {
            that.socket.emit('update-issue-working-state', {
                issueId: issue._id(),
                isWorking: false
            }, _.noop());
        };

        that.onClickToggleWorkOnCard = function (issue, e) {
            that.socket.emit('update-issue-working-state', {
                issueId: issue._id(),
                isWorking: !issue.isWorking()
            }, _.noop());
            util.cancelBubble(e);
            return false;
        };

        that.onClickMemberVisibleCheckBox = function (member) {
            that.socket.emit('update-member', {userName: member.userName(), visible: member.visible()});
            return true;
        };
        
        that.archiveAllIssues = function () {
            that.draggableList.done.issues().forEach(function (issue) {
                that.removeIssue(issue);
            });
        };

        that.addChatText = function (chat) {
            var time = moment(chat.created_at).format('MM/DD HH:mm:ss');
            that.chatTexts.push('[' + time + '] (' + chat.sender + ') ' + chat.content);
        };
        
        that.onClickWorkHistoryEditMode = function () {
            that.updateIssueDetailWorkHistory(that.selectedIssue().workHistory().map(model.Work.clone));
            that.issueDetailWorkHistoryMode('edit');
        };
        
        that.onClickWorkHistorySave = function () {
            var issue = that.selectedIssue();
            if (!issue) { return console.error('issue is not selected.'); }

            if (!that.canClickWorkHistorySave()) { return console.error('invalid work history.'); }

            var workHistory = that.updateIssueDetailWorkHistory().map(function (x) { return x.toMinimumObject(); });
            issue.updateWorkHistory(workHistory);

            that.socket.emit('update-issue-work-history', {issueId: issue._id(), workHistory: workHistory});
            
            that.issueDetailWorkHistoryMode('view');
        };

        that.canClickWorkHistorySave = ko.computed(function () {
            return that.updateIssueDetailWorkHistory().every(function (work) {
               return work.isValidStartTime() && work.isValidEndTime() && work.isValidUserId();
            });
        });

        that.onClickWorkHistoryCancel = function () {
            that.updateIssueDetailWorkHistory.removeAll();
            that.issueDetailWorkHistoryMode('view');
        };

        that.onClickAddWork = function (issue) {
            console.log(issue.assigneeMember());
            that.updateIssueDetailWorkHistory.push(new model.Work({
                members: that.members,
                startTime: new Date(),
                endTime: new Date(),
                userId: issue.assigneeMember() ? issue.assigneeMember()._id() : null,
                isEnded: true
            }));
        };

        that.onClickRemoveWork = function (work) {
            that.updateIssueDetailWorkHistory.remove(work);
        };
        
        // ソケット通信のイベント設定、デバッグ設定を初期化する
        function initSocket (socket) {
            socket.on('connect', function (req) {
                socket.emit('joinProjectRoom', {projectId: that.project.id()});
            });
            
            socket.initSocketDebugMode();

            if (socket.connected) {
                socket.emit('joinProjectRoom', {projectId: that.project.id()});
            }
        }
    }

    util.inherits(Kanban, EventEmitter);

}(EventEmitter2, ko, io, _, window.nakazawa.util, window));