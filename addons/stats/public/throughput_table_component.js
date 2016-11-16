'use strict';
const _ = require('lodash');
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ThroughputTableComponent extends EventEmitter2 {
    constructor (users, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.throughputs = {};
        this.users = users;

        this.users().forEach(user => {
            this.throughputs[user.id()] = ko.observable();
        });

        this.users.subscribe(changes => {
            _.chain(changes)
                .filter({status: 'added'})
                .map('value')
                .filter(user => !this.throughputs[user.id()])
                .forEach(user => { this.throughputs[user.id()] = ko.observable(); })
                .value();
        }, this, 'arrayChange');
    }

    updateThroughputs (memberStats) {
        memberStats
            .filter(x => this.throughputs[x.userId])
            .forEach(x => { this.throughputs[x.userId](x.throughput); });
    }

    get componentName () {
        return 'throughput-table-component';
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                this.throughputs = that.throughputs;
                this.users = that.users;
            },
            template: this.template
        });
    }
    get template () {
        return `
<div class="member-throughputs">
  <h3>メンバーごとのスループット(1時間あたりにこなすタスクのコスト)</h3>
  <div class="table-responsive">
    <table class="table">
      <thead>
        <tr>
          <th>username</th>
          <th>throughput = costs / hours</th>
        </tr>
      </thead>
      <tbody>
        <!-- ko foreach: {data: users, as: 'user'} -->
        <!-- ko if: isVisible -->
        <tr>
          <td data-bind="text: user.username"></td>
          <td data-bind="text: $component.throughputs[user.id()]"></td>
        </tr>
        <!-- /ko -->
        <!-- /ko -->
      </tbody>
    </table>
  </div>
</div>
`;
    }
}

module.exports = ThroughputTableComponent;
