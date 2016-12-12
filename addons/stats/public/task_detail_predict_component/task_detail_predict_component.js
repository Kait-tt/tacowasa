'use strict';
const ko = require('knockout');
const Util = require('../../../../public/src/js/modules/util');

class TaskDetailPredictComponent {
    constructor () {
        this.task = ko.observable();
        this.memberStats = ko.observable([]);
    }

    get componentName () {
        return 'task-detail-predict-component';
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                this.predict = ko.pureComputed(() => {
                    const memberStats = that.memberStats();
                    const task = that.task();
                    if (!task) { return null; }

                    const user = task.user();
                    const cost = task.cost();
                    if (!user || !cost) { return null; }

                    return memberStats.find(x => x.userId === user.id() && x.costId === cost.id());
                });

                this.predictTimeFormat = ko.pureComputed(() => {
                    const predict = this.predict();
                    if (!predict) { return null; }
                    if (!predict.low) { return '?～?'; }
                    return [predict.low, predict.high]
                        .map(Util.minutesFormatHM)
                        .join('～');
                });

                this.isStagnant = ko.pureComputed(() => that.task() && that.task().isStagnant());
            },
            template: require('html!./task_detail_predict_component.html')
        });
    }


}

module.exports = TaskDetailPredictComponent;
