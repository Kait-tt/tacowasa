'use strict';
const EventEmitter2 = require('eventemitter2');
const ko = require('knockout');

class ToggleQRButton extends EventEmitter2 {
    constructor ({eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.enabledQR = ko.observable(false);
    }

    toggle () {
        this.enabledQR(!this.enabledQR());
        this.emit('toggle', {enabledQR: this.enabledQR()});
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
<button type="button" class="btn btn-default navbar-btn" data-bind="
  click: toggle,
  tooltip: { title: 'toggle QR', placement: 'bottom' }">
    <span class="glyphicon glyphicon-qrcode"></span>
    <span class="sr-only">Toggle QR</span>
</button>
`;
    }

    get componentName () {
        return 'toggle-qr-button';
    }
}

module.exports = ToggleQRButton;
