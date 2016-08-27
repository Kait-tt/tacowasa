// ref: https://jsfiddle.net/meno/MBLP9/
'use strict';
const ko = require('knockout');

ko.bindingHandlers.bootstrapSwitchOn = {
    init: (element, valueAccessor, allBindingsAccessor, viewModel) => {
        const $elem = $(element);
        $elem.bootstrapSwitch();
        $elem.bootstrapSwitch('state', ko.unwrap(valueAccessor()));
        $elem.on('switchChange.bootstrapSwitch', (e, state) => valueAccessor()(state));
    },

    update: (element, valueAccessor, allBindingsAccessor, viewModel) => {
        const $elem = $(element);
        const vStatus = $elem.bootstrapSwitch('state');
        const vmStatus = ko.unwrap(valueAccessor());
        if (vStatus !== vmStatus) {
            $elem.bootstrapSwitch('state', vmStatus);
        }
    }
};
