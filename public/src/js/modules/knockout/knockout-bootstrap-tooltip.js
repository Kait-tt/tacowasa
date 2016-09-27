// ref: http://stackoverflow.com/questions/16875773/bootstraps-tooltip-not-working-with-knockout-bindings-w-fiddle
'use strict';
const ko = require('knockout');

ko.bindingHandlers.tooltip = {
    init: (element, valueAccessor) => {
        const local = ko.utils.unwrapObservable(valueAccessor());
        const options = {};

        ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
        ko.utils.extend(options, local);

        $(element).tooltip(options);

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).tooltip('destroy');
        });
    },

    update: (element, valueAccessor) => {
        const local = ko.utils.unwrapObservable(valueAccessor());
        const options = {};

        ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
        ko.utils.extend(options, local);

        $(element).data('bs.tooltip').options.title = options.title;
    },

    options: {
        placement: 'right',
        trigger: 'hover'
    }
};
