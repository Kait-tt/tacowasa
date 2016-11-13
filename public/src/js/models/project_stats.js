'use strict';
const ko = require('knockout');
const _ = require('lodash');
const util = require('../modules/util');
const moment = require('moment');

class ProjectStats {
    constructor ({project}) {
        this.project = project;
        this.stages = project.stages;

        // 全作業時間の合計
        this.totalTime = ko.pureComputed(() => {
            const times = this.project.tasks().map(x => x.allWorkTime());
            return _.sum(times);
        });

        this.totalTimeFormat = ko.pureComputed(() => util.dateFormatHM(this.totalTime()));

        // ラベルごとの全作業時間の合計
        this.totalTimeLabels = ko.pureComputed(() => {
            const noneKey = '(none)';
            const res = {};
            res[noneKey] = 0;

            this.project.labels().forEach(label => { res[label.name()] = 0; });

            this.project.tasks().forEach(task => {
                const labels = task.labels();
                const time = task.allWorkTime();
                if (labels.length) {
                    labels.forEach(label => { res[label.name()] += time; });
                } else {
                    res[noneKey] += time;
                }
            });

            return _.map(res, (time, name) => {
                return {name, time, format: util.dateFormatHM(time)};
            });
        }, this);

        // 過去1週間ごと人ごとの作業時間
        // iterationWorkTime()[iteration]
        // iteration = {start, startFormat, end, endFormat, users}
        // users[username] = {minutes, format}
        this.iterationWorkTime = ko.observableArray([]);

        // 過去1週間ごと人ごとの作業時間
        // lastTwoWeekWorkTime()[iteration]
        // iteration = {day, dayFormat, users}
        // users[username] = {minutes, format}
        this.lastTwoWeekWorkTime = ko.observableArray([]);
    }

    // work listを取得する
    get _works () {
        const res = [];

        this.project.tasks().forEach(task => {
            task.works().forEach(work => {
                res.push(work);
            });
        });

        return res;
    }

    // TODO: refactoring
    // 過去1週間ごと人ごとの作業時間の計算
    calcIterationWorkTime () {
        return new Promise(resolve => setTimeout(() => {
            const usernames = this.project.users().map(x => x.username());
            const works = this._works;

            const iterationTimes = 10;
            const beginDate = moment().day(-7 * (iterationTimes - 1));
            const endDate = moment().day(7);
            beginDate.set({'hours': 0, 'minutes': 0, 'seconds': 0});
            endDate.set({'hours': 0, 'minutes': 0, 'seconds': 0});
            const now = moment();

            const maxt = endDate.diff(beginDate, 'minutes');
            const ts = {};
            const n = maxt + 2;
            usernames.forEach(username => { ts[username] = _.fill(Array(n), 0); });

            works.forEach(work => {
                const username = work.username();
                if (username && _.isArray(ts[username])) {
                    const s = Math.max(0, moment(work.startTime()).diff(beginDate, 'minutes'));
                    const t = Math.max(0, moment(work.endTime() || now).diff(beginDate, 'minutes'));
                    ts[username][s]++;
                    ts[username][t]--;
                }
            });

            usernames.forEach(username => {
                _.times(2, () => {
                    let sum = 0;
                    _.times(n, i => {
                        sum += ts[username][i];
                        ts[username][i] = sum;
                    });
                });
            });

            const res = [];
            _.times(iterationTimes, i => {
                const start = moment(beginDate).add(i * 7, 'days');
                const end = moment(start).add(7, 'days').subtract(1, 'minutes');
                const startFormat = start.format('MM/DD(ddd)');
                const endFormat = end.format('MM/DD(ddd)');
                const users = {};
                const s = start.diff(beginDate, 'minutes');
                const t = end.diff(beginDate, 'minutes');
                usernames.forEach(username => {
                    const minutes = ts[username][t] - ts[username][s];
                    users[username] = {minutes, format: util.secondsFormatHM(minutes * 60)};
                });
                res.push({start, end, startFormat, endFormat, users});
            });

            this.iterationWorkTime(res);
            resolve(res);
        }, 0));
    }

    // 過去2週間の人ごとの作業時間の計算
    calcLastTwoWeekWorkTime () {
        return new Promise(resolve => setTimeout(() => {
            const usernames = this.project.users().map(x => x.username());
            const works = this._works;

            const term = 14; // 2 weeks
            const beginDate = moment().subtract(term - 1, 'days');
            const endDate = moment();
            beginDate.set({'hours': 0, 'minutes': 0, 'seconds': 0});
            endDate.set({'hours': 23, 'minutes': 59, 'seconds': 59});
            const now = moment();

            const maxt = endDate.diff(beginDate, 'minutes');
            const ts = {};
            const n = maxt + 2;
            usernames.forEach(username => { ts[username] = _.fill(Array(n), 0); });

            works.forEach(work => {
                const username = work.username();
                if (username && _.isArray(ts[username])) {
                    const s = Math.max(0, moment(work.startTime()).diff(beginDate, 'minutes'));
                    const t = Math.max(0, moment(work.endTime() || now).diff(beginDate, 'minutes'));
                    ts[username][s]++;
                    ts[username][t]--;
                }
            });

            usernames.forEach(username => {
                _.times(2, () => {
                    let sum = 0;
                    _.times(n, i => {
                        sum += ts[username][i];
                        ts[username][i] = sum;
                    });
                });
            });

            const res = [];
            _.times(term, i => {
                const start = moment(beginDate).add(i, 'days');
                const end = moment(start).add(1, 'days').subtract(1, 'minutes');
                const startFormat = start.format('MM/DD(ddd)');
                const users = {};
                const s = start.diff(beginDate, 'minutes');
                const t = end.diff(beginDate, 'minutes');
                usernames.forEach(username => {
                    const minutes = ts[username][t] - ts[username][s];
                    users[username] = {minutes, format: util.secondsFormatHM(minutes * 60)};
                });
                res.push({day: start, dayFormat: startFormat, users});
            });

            this.lastTwoWeekWorkTime(res);
            resolve(res);
        }, 0));
    }
}

module.exports = ProjectStats;
