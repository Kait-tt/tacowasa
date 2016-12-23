'use strict';
const _ = require('lodash');
const ko = require('knockout');
const Highcharts = require('highcharts');
const moment = require('moment');
const Util = require('../../../../public/src/js/modules/util');
const Util2 = require('../../modules/util');
const colors = ['#2980b9', '#c0392b'];
const bandColors = _.shuffle(['#faebd9', '#f9fad9', '#e9fad9', '#d9f9fa', '#dad9fa', '#fad9e9']);

class BurnDownChartComponent {
    constructor (bdc, iterations, workTimes) {
        this.bdc = bdc;
        this.iterations = iterations;
        this.memberWorkTimes = workTimes;
        this.chart = null;
    }

    drawChart () {
        const data = this.bdc();
        if (!data) { return; }

        const iterations = _.chain(this.iterations())
            .map(x => ({id: x.id(), startTime: new Date(x.startTime()), endTime: new Date(x.endTime())}))
            .sortBy('startTime')
            .value();
        const memberWorkTimes = this.memberWorkTimes();
        const totalWorkTimes = data.map(p => p.totalWorkTime);

        const remainIterations = this.calcRemainIterations(iterations, memberWorkTimes);

        const lastData = data[data.length - 1];
        const promisedData = data.slice();
        let _totalWorkTime = lastData.totalWorkTime;
        remainIterations.forEach(it => {
            if (it.startTime > new Date(lastData.startTime)) {
                promisedData.push(Object.assign({}, lastData, {time: it.startTime, totalWorkTime: _totalWorkTime}));
            }
            _totalWorkTime += it.remainPromisedMinutes;
            promisedData.push(Object.assign({}, lastData, {time: it.endTime, totalWorkTime: _totalWorkTime}));
        });
        const promisedWorkTimes = promisedData.map(x => x.totalWorkTime);

        this.chart = Highcharts.chart(this.containerId, {
            chart: { type: 'line' },
            title: { text: 'バーンダウン/アップチャート' },
            xAxis: {
                labels: {
                    formatter: function () {
                        const pos1 = Util2.lowerBound(promisedWorkTimes, this.value);
                        if (pos1 === promisedWorkTimes.length) { return; }
                        const p1 = promisedData[pos1];
                        let time;
                        if (p1 && p1.totalWorkTime === this.value) {
                            time = p1.time;
                        } else {
                            let pos2 = pos1 - 1;
                            if (pos2 < 0) { return; }
                            const p2 = promisedData[pos2];
                            const r = (this.value - p2.totalWorkTime) / (p1.totalWorkTime - p2.totalWorkTime);
                            const low = Number(new Date(p2.time));
                            const high = Number(new Date(p1.time));
                            time = new Date(Math.floor(high + (high - low) * r));
                        }
                        const timeStr = moment(time).format('MM/DD');
                        const workTime = Util.minutesFormatHM(this.value);
                        return `${workTime}<br>${timeStr}`;
                    }
                },
                plotBands: _.chain(iterations)
                    .map((it, idx) => {
                        const ps = promisedData.map(p => Number(new Date(p.time)));
                        const pos1 = Util2.lowerBound(ps, Number(it.startTime));
                        const pos2 = Util2.lowerBound(ps, Number(it.endTime));
                        if (_.isNil(pos1) || _.isNil(pos2)) { return; }
                        return {it, idx, from: promisedData[pos1].totalWorkTime, to: promisedData[pos2].totalWorkTime};
                    })
                    .compact()
                    .values()
                    .map((it, idx) => ({
                        label: {
                            text: it.idx + 1,
                            align: 'center'
                        },
                        color: bandColors[idx % bandColors.length],
                        from: it.from,
                        to: it.to
                    }))
                    .value(),
                title: { text: '総作業時間 (分) , 日付' },
                max: _.max(totalWorkTimes) + _.sum(remainIterations.map(x => x.remainPromisedMinutes))
            },
            yAxis: [{
                labels: {
                    formatter: function () {
                        return this.value + 'pts';
                    }
                },
                title: { text: '完了タスクコスト (pts)' },
                max: 1.1 * _.max(data.map(p => p.completedTaskNum))
            }, {
                labels: {
                    formatter: function () {
                        return this.value + 'pts';
                    }
                },
                title: { text: '残りタスクコスト (pts)' },
                opposite: true,
                max: 1.1 * _.max(data.map(p => p.taskNum - p.completedTaskNum))
            }],
            tooltip: {
                shared: true,
                crosshairs: true,
                formatter: function () {
                    const pos = Util2.lowerBound(totalWorkTimes, this.x);
                    const p = data[pos];
                    if (!p) { return; }
                    const workTime = Util.minutesFormatHM(this.x);
                    const time = moment(p.time).format('MM/DD');
                    const completed = p.completedTaskNum;
                    const remain = p.taskNum - p.completedTaskNum;
                    return [`${workTime} (${time})`,
                        `<span style="color: ${colors[0]}">完了タスクコスト : <strong>${completed} pts</strong></span>`,
                        `<span style="color: ${colors[1]}">残りタスクコスト : <strong>${remain} pts</strong></span>`]
                        .join('<br>');
                }
            },
            series: [{
                name: '完了タスクコスト',
                data: data.map(p => [p.totalWorkTime, p.completedTaskNum]),
                yAxis: 0,
                color: colors[0]
            }, {
                name: '残りタスクコスト',
                data: data.map(p => [p.totalWorkTime, p.taskNum - p.completedTaskNum]),
                yAxis: 1,
                color: colors[1]
            }]
        });
    }

    calcRemainIterations (iterations, memberWorkTimes) {
        const now = Date.now();

        return iterations
            .filter(it => it.endTime >= now)
            .map(it => {
                const remainPromisedMinutes = _.chain(memberWorkTimes)
                    .filter(m => m.iterationId === it.id)
                    .map(m => m.promisedMinutes - m.actualMinutes)
                    .sum()
                    .value();
                return Object.assign({remainPromisedMinutes}, it);
            });
    }

    get componentName () {
        return 'burn_down_chart_component';
    }

    get containerId () {
        return 'burn-down-chart-container';
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                return that;
            },
            template: `<div id="${this.containerId}" style="width: 100%; height: 400px;"></div>`
        });
    }
}

module.exports = BurnDownChartComponent;
