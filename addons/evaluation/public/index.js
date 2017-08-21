'use strict';
const ko = require('knockout');
const EvaluationModalButton = require('./evaluation_modal_button');
const EvaluationModal = require('./evaluation_modal');

module.exports = {
    init: (kanban, {alert}) => {
        const socket = kanban.socket;

        // create evaluation modal
        const evaluationModal = new EvaluationModal();
        evaluationModal.register();
        document.body.appendChild(document.createElement(evaluationModal.modalName));

        // create evaluation modal button
        const toolbarButtons = document.getElementById('toolbar-btn-group');
        if (!toolbarButtons) { throw new Error('#toolbar-btn-group was not found'); }

        const evaluationModalButton = new EvaluationModalButton();
        evaluationModalButton.register();
        toolbarButtons.appendChild(document.createElement(evaluationModalButton.componentName));
    }
};



