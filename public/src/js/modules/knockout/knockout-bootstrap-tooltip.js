// ref: http://stackoverflow.com/questions/16875773/bootstraps-tooltip-not-working-with-knockout-bindings-w-fiddle
'use strict';
const ko = require('knockout');


// Outer HTML
if (!$.fn.outerHtml) {
    $.fn.outerHtml = function () {
        if (this.length === 0) {
            return false;
        }
        var elem = this[0], name = elem.tagName.toLowerCase();
        if (elem.outerHTML) {
            return elem.outerHTML;
        }
        var attrs = $.map(elem.attributes, function (i) {
            return i.name + '="' + i.value + '"';
        });
        return "<" + name + (attrs.length > 0 ? " " + attrs.join(" ") : "") + ">" + elem.innerHTML + "</" + name + ">";
    };
}

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
