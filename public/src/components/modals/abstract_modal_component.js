'use strict';
const EventEmitter2 = require('eventemitter2');
const ko = require('knockout');

class AbstractModalComponent extends EventEmitter2 {
    constructor ({eventEmitterOptions = {}}) {
        super(eventEmitterOptions);
    }

    onLoad () {
        this.emit('load', this);
    }

    showModal () {
        $('#' + this.modalName).modal('show');
    }

    hideModal () {
        $('#' + this.modalName).modal('hide');
    }

    register () {
        ko.components.register(this.modalName, {
            viewModel: () => {
                this.onLoad();
                return this;
            },
            template: this.template
        });
    }

    get template () { }

    get modalName () { }
}

module.exports = AbstractModalComponent;
