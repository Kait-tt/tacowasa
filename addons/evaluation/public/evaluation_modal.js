'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../../../public/src/components/modals/abstract_modal_component');

class EvaluationModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
    }

    get template () {
        return `
<div class="modal fade" id="evaluation-modal" tabindex="-1" role="dialog" aria-labelledby="evaluation-modal-label" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" id="create-task-modal-label">Evaluation</h4>
      </div>
      <div class="modal-body">
      </div>
    </div>
  </div>
</div>
`;
    }

    get modalName () {
        return 'evaluation-modal';
    }
}

module.exports = EvaluationModal;
