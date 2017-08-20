'use strict';
const _ = require('lodash');
const ko = require('knockout');
const Highcharts = require('highcharts');
require('highcharts/highcharts-more')(Highcharts);
const Util = require('../../../../public/src/js/modules/util');

const costColors = ['#16a085', '#2980b9', '#c0392b'];

class MembersPredictChartComponent {
    constructor (users, costs, memberStats) {
        this.users = users;
        this.costs = costs;
        this.memberStats = ko.observable(memberStats);
        this.chart = null;
    }

    drawChart () {
        const memberStats = this.memberStats();
        const users = this.users().filter(x => x.isVisible());
        const costs = this.costs().filter(x => x.value() !== 0 && x.value() !== 99);
        if (!memberStats) { return; }

        const costn = costs.length;
        const k = 0.6 / (costn + 1);
        const p0 = -0.3 + k;
        const data = _.reverse(costs.map((cost, ci) => {
            const data = _.compact(users.map(user => {
                const stats = memberStats.find(x => x.userId === user.id() && x.costId === cost.id());
                return stats ? [stats.low, stats.high].map(x => Math.max(0, x)) : null;
            }));
            return { name: cost.name(), data, color: costColors[ci], pointPlacement: p0 + k * ci };
        }));

        this.chart = Highcharts.chart(this.containerId, {
            chart: { type: 'errorbar', inverted: true },
            title: { text: '推定必要作業時間' },
            xAxis: {
                title: { text: 'Developers' },
                categories: users.map(x => x.username())
            },
            yAxis: {
                title: { text: 'Predicted completion time' },
                labels: { formatter: function () { return Util.minutesFormatHM(this.value); } },
                tickInterval: 30,
                min: 0
            },
            tooltip: {
                shared: true,
                crosshairs: true,
                formatter: function () {
                    const username = this.x;
                    const user = users.find(x => x.username() === username);
                    const texts = costs.map((cost, ci) => {
                        const stats = memberStats.find(x => x.userId === user.id() && x.costId === cost.id());
                        if (stats) {
                            const low = Util.minutesFormatHM(Math.max(stats.low, 0));
                            const high = Util.minutesFormatHM(Math.max(stats.high, 0));
                            const color = costColors[ci];
                            return `<span style="color: ${color}">${cost.name()} : <strong>${low} - ${high}</strong></span>`;
                        } else {
                            return `${cost.name()} : none`;
                        }
                    });
                    texts.unshift(`${username}`);
                    return texts.join('<br>');
                }
            },
            series: data
        });
    }

    get componentName () {
        return 'members-predict-chart-container';
    }

    get containerId () {
        return 'members-predict-chart-container';
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

module.exports = MembersPredictChartComponent;
