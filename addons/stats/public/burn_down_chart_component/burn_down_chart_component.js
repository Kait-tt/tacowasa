'use strict';
const ko = require('knockout');
const Highcharts = require('highcharts');

class BurnDownChartComponent {
    constructor (bdc) {
        this.bdc = ko.observable(bdc);
        this.chart = null;
    }

    drawChart () {
        const data = this.bdc();
        if (!data) { return; }

        this.chart = Highcharts.chart(this.containerId, {
            chart: { type: 'line' },
            title: { text: 'Burn up and down chart' },
            xAxis: {
                labels: {
                    formatter: function () {
                        const v = this.value;
                        const h = Math.floor(v / 60);
                        const m = v % 60;
                        return h ? `${h}時間${m}分` : `${m}分`;
                    }
                },
                title: { text: '総作業時間 (分)' }
            },
            yAxis: {
                labels: { formatter: function () { return this.value + 'pts'; } },
                title: { text: 'タスクコスト (pts)' }
            },
            tooltip: {
                shared: true,
                crosshairs: true
            },
            series: [{
                name: '全タスクコスト',
                data: data.map(p => [p.totalWorkTime, p.taskNum])
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
