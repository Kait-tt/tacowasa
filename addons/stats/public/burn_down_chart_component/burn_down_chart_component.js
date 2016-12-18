'use strict';
const ko = require('knockout');
const Highcharts = require('highcharts');
const moment = require('moment');
const Util = require('../../../../public/src/js/modules/util');
const Util2 = require('../../modules/util');
const colors = ['#2980b9', '#c0392b'];

class BurnDownChartComponent {
    constructor (bdc) {
        this.bdc = ko.observable(bdc);
        this.chart = null;
    }

    drawChart () {
        const data = this.bdc();
        if (!data) { return; }

        const workTimes = data.map(p => p.totalWorkTime);

        this.chart = Highcharts.chart(this.containerId, {
            chart: { type: 'line' },
            title: { text: 'バーンダウン/アップチャート' },
            xAxis: {
                labels: {
                    formatter: function () {
                        const pos = Util2.lowerBound(workTimes, this.value);
                        const p = data[pos];
                        const workTime = Util.minutesFormatHM(this.value);
                        const time = moment(p.time).format('MM/DD');
                        return `${workTime}<br>${time}`;
                    }
                },
                title: { text: '総作業時間 (分) , 日付' }
            },
            yAxis: [{
                labels: {
                    formatter: function () {
                        return this.value + 'pts';
                    }
                },
                title: { text: '完了タスクコスト (pts)' }
            }, {
                labels: {
                    formatter: function () {
                        return this.value + 'pts';
                    }
                },
                title: { text: '残りタスクコスト (pts)' },
                opposite: true
            }],
            tooltip: {
                shared: true,
                crosshairs: true,
                formatter: function () {
                    const pos = Util2.lowerBound(workTimes, this.x);
                    const p = data[pos];
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
