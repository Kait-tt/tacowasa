// ref: http://jsfiddle.net/bkzb272j/1/
'use strict';
const ko = require('knockout');

ko.bindingHandlers.selectPicker = {
    init: (element, valueAccessor, allBindingsAccessor) => {
        const $elem = $(element);
        if ($elem.is('select')) {
            if (ko.isObservable(valueAccessor())) {
                if ($elem.prop('multiple') && $.isArray(ko.unwrap(valueAccessor()))) {
                    // in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
                    ko.bindingHandlers.selectedOptions.init(element, valueAccessor, allBindingsAccessor);
                } else {
                    // regular select and observable so call the default value binding
                    ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor);
                }
            }
            $elem.addClass('selectpicker').selectpicker();
        }
    },

    update: (element, valueAccessor, allBindingsAccessor) => {
        const $elem = $(element);
        if ($elem.is('select')) {
            const selectPickerOptions = allBindingsAccessor().selectPickerOptions;
            if (typeof selectPickerOptions !== 'undefined' && selectPickerOptions !== null) {
                const options = selectPickerOptions.optionsArray;
                const isDisabled = selectPickerOptions.disabledCondition || false;
                const resetOnDisabled = selectPickerOptions.resetOnDisabled || false;
                if (ko.unwrap(options).length > 0) {
                    // call the default Knockout options binding
                    ko.bindingHandlers.options.update(element, options, allBindingsAccessor);
                }
                if (isDisabled && resetOnDisabled) {
                    // the dropdown is disabled and we need to reset it to its first option
                    $elem.selectpicker('val', $elem.children('option:first').val());
                }
                $elem.prop('disabled', isDisabled);
            }
            if (ko.isObservable(valueAccessor())) {
                if ($elem.prop('multiple') && $.isArray(ko.unwrap(valueAccessor()))) {
                    // in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
                    ko.bindingHandlers.selectedOptions.update(element, valueAccessor);
                } else {
                    // call the default Knockout value binding
                    ko.bindingHandlers.value.update(element, valueAccessor);
                }
            }

            $elem.selectpicker('refresh');
        }
    }
};
