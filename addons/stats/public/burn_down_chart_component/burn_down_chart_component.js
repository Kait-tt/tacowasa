'use strict';
const ko = require('knockout');
const Highcharts = require('highcharts');
const moment = require('moment');
const Util = require('../../../../public/src/js/modules/util');
const Util2 = require('../../modules/util');

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
            title: { text: 'Burn up and down chart' },
            xAxis: {
                labels: {
                    formatter: function () {
                        const pos = Util2.lowerBound(workTimes, this.value);
                        const p = data[pos];
                        const workTime = Util.minutesFormatHM(this.value);
                        const time = moment(p.time).format('YYYY/MM/DD');
                        return `${workTime}<br>${time}`;
                    }
                },
                title: { text: '総作業時間 (分)' }
            },
            yAxis: {
                labels: {
                    formatter: function () {
                        return this.value + 'pts';
                    }
                },
                title: { text: 'タスクコスト (pts)' }
            },
            tooltip: {
                shared: true,
                crosshairs: true
            },
            series: [{
                name: '完了タスクコスト',
                data: data.map(p => [p.totalWorkTime, p.completedTaskNum])
            }, {
                name: '残りタスクコスト',
                data: data.map(p => [p.totalWorkTime, p.taskNum - p.completedTaskNum])
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
