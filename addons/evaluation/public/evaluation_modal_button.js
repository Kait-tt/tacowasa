'use strict';
const EventEmitter2 = require('eventemitter2');
const ko = require('knockout');

class EvaluationModalButton extends EventEmitter2 {
    constructor ({eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
    }

    register () {
        ko.components.register(this.componentName, {
            viewModel: () => {
                return this;
            },
            template: this.template
        });
    }


    get template () {
        return `
<button type="button" class="btn btn-default navbar-btn" data-toggle="modal" data-target="#evaluation-modal" data-bind="tooltip: { title: 'プロジェクト評価', placement: 'bottom', viewport: '#toolbar-btn-group' }">
    <span class="glyphicon glyphicon-tower" aria-hidden="true"></span> <span class="sr-only">Evaluation</span>
</button>
`;
    }

    get componentName () {
        return 'evaluation-modal-button';
    }
}

module.exports = EvaluationModalButton;
