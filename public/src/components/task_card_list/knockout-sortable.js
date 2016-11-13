// original: knockout-sortable 1.0.0 | (c) 2016 Ryan Niemeyer |  http://www.opensource.org/licenses/mit-license
// edit: snakazawa (2016)
require('jquery-ui/ui/widgets/sortable');
require('jquery-ui/ui/widgets/draggable');
const ko = require('knockout');
const _ = require('lodash');

const ITEMKEY = 'ko_sortItem';
const INDEXKEY = 'ko_sourceIndex';
const LISTKEY = 'ko_sortList';
const PARENTKEY = 'ko_parentList';
const DRAGKEY = 'ko_dragItem';
const unwrap = ko.utils.unwrapObservable;
const dataGet = ko.utils.domData.get;
const dataSet = ko.utils.domData.set;
const version = $.ui && $.ui.version;

// improve performance of jquery sortable
$.ui.sortable.prototype._setHandleClassName = function () {
    const cname = 'ui-sortable-handle';
    _.each(this.element, e1 => {
        if (!e1) { return; }
        _.each(e1.getElementsByClassName(cname), e2 => {
            if (!e2 || !e2.classList) { return; }
            e2.classList.remove(cname);
        });
    });

    _.each(this.items, e1 => {
        if (e1.instance.options.handle) {
            _.each(e1.item.find(e1.instance.options.handle), $e2 => {
                if ($e2.length) {
                    $e2.get(0).classList.add(cname);
                }
            });
        } else {
            if (e1.item.length) {
                e1.item.get(0).classList.add(cname);
            }
        }
    });
};

// 1.8.24 included a fix for how events were triggered in nested sortables. indexOf checks will fail if version starts with that value (0 vs. -1)
const hasNestedSortableFix = version && version.indexOf('1.6.') && version.indexOf('1.7.') && (version.indexOf('1.8.') || version === '1.8.24');

// internal afterRender that adds meta-data to children
function addMetaDataAfterRender (elements, data) {
    _.forEach(elements, element => {
        if (element.nodeType === 1) {
            dataSet(element, ITEMKEY, data);
            dataSet(element, PARENTKEY, dataGet(element.parentNode, LISTKEY));
        }
    });
}

// prepare the proper options for the template binding
function prepareTemplateOptions (valueAccessor, dataName) {
    const result = {};
    const options = unwrap(valueAccessor()) || {};
    let actualAfterRender;

    // build our options to pass to the template engine
    if (options.data) {
        result[dataName] = options.data;
        result.name = options.template;
    } else {
        result[dataName] = valueAccessor();
    }

    ['afterAdd', 'afterRender', 'as', 'beforeRemove', 'includeDestroyed', 'templateEngine', 'templateOptions', 'nodes'].forEach(option => {
        if (options.hasOwnProperty(option)) {
            result[option] = options[option];
        } else if (ko.bindingHandlers.sortable.hasOwnProperty(option)) {
            result[option] = ko.bindingHandlers.sortable[option];
        }
    });

    // use an afterRender function to add meta-data
    if (dataName === 'foreach') {
        if (result.afterRender) {
            // wrap the existing function, if it was passed
            actualAfterRender = result.afterRender;
            result.afterRender = (element, data) => {
                addMetaDataAfterRender.call(data, element, data);
                actualAfterRender.call(data, element, data);
            };
        } else {
            result.afterRender = addMetaDataAfterRender;
        }
    }

    // return options to pass to the template binding
    return result;
}

function updateIndexFromDestroyedItems (index, items) {
    const unwrapped = unwrap(items);

    if (unwrapped) {
        for (let i = 0; i < index; i++) {
            // add one for every destroyed item we find before the targetIndex in the target array
            if (unwrapped[i] && unwrap(unwrapped[i]._destroy)) {
                index++;
            }
        }
    }

    return index;
}

// remove problematic leading/trailing whitespace from templates
function stripTemplateWhitespace (element, name) {
    let templateSource, templateElement;

    // process named templates
    if (name) {
        templateElement = document.getElementById(name);
        if (templateElement) {
            templateSource = new ko.templateSources.domElement(templateElement);
            templateSource.text(templateSource.text().trim());
        }
    } else {
        // remove leading/trailing non-elements from anonymous templates
        const children = Array.prototype.slice.call(element.childNodes);
        children.forEach(ele => {
            if (ele && ele.nodeType !== 1) {
                element.removeChild(ele);
            }
        });
    }
}

// connect items with observableArrays
ko.bindingHandlers.sortable = {
    init: (element, valueAccessor, allBindingsAccessor, data, context) => {
        const $element = $(element);
        const templateOptions = prepareTemplateOptions(valueAccessor, 'foreach');
        const sortable = {};
        let value = unwrap(valueAccessor()) || {};
        let startActual, updateActual;

        stripTemplateWhitespace(element, templateOptions.name);

        // build a new object that has the global options with overrides from the binding
        $.extend(true, sortable, ko.bindingHandlers.sortable);
        if (value.options && sortable.options) {
            ko.utils.extend(sortable.options, value.options);
            delete value.options;
        }
        ko.utils.extend(sortable, value);

        // if allowDrop is an observable or a function, then execute it in a computed observable
        if (sortable.connectClass && (ko.isObservable(sortable.allowDrop) || typeof sortable.allowDrop == 'function')) {
            ko.computed({
                read: function () {
                    const value = unwrap(sortable.allowDrop);
                    const shouldAdd = typeof value == 'function' ? value.call(this, templateOptions.foreach) : value;
                    ko.utils.toggleDomNodeCssClass(element, sortable.connectClass, shouldAdd);
                },
                disposeWhenNodeIsRemoved: element
            }, this);
        } else {
            ko.utils.toggleDomNodeCssClass(element, sortable.connectClass, sortable.allowDrop);
        }

        // wrap the template binding
        ko.bindingHandlers.template.init(element, () => templateOptions, allBindingsAccessor, data, context);

        // keep a reference to start/update functions that might have been passed in
        startActual = sortable.options.start;
        updateActual = sortable.options.update;


        // initialize sortable binding after template binding has rendered in update function
        let createTimeout = setTimeout(function () {
            const originalReceive = sortable.options.receive;
            let dragItem;

            $element.sortable(ko.utils.extend(sortable.options, {
                start: function (event, ui) {
                    // track original index
                    let el = ui.item[0];
                    dataSet(el, INDEXKEY, ko.utils.arrayIndexOf(ui.item.parent().children(), el));

                    // make sure that fields have a chance to update model
                    ui.item.find('input:focus').change();
                    if (startActual) {
                        startActual.apply(this, arguments);
                    }
                },
                receive: function (event, ui) {
                    // optionally apply an existing receive handler
                    if (typeof originalReceive === 'function') {
                        originalReceive.call(this, event, ui);
                    }

                    dragItem = dataGet(ui.item[0], DRAGKEY);
                    if (dragItem) {
                        // copy the model item, if a clone option is provided
                        if (dragItem.clone) {
                            dragItem = dragItem.clone();
                        }

                        // configure a handler to potentially manipulate item before drop
                        if (sortable.dragged) {
                            dragItem = sortable.dragged.call(this, dragItem, event, ui) || dragItem;
                        }
                    }
                },
                update: function (event, ui) {
                    let sourceParent, targetParent, sourceIndex, targetIndex, arg;
                    const el = ui.item[0];
                    const parentEl = ui.item.parent()[0];
                    const item = dataGet(el, ITEMKEY) || dragItem;

                    if (!item) {
                        $(el).remove();
                    }
                    dragItem = null;

                    // make sure that moves only run once, as update fires on multiple containers
                    if (item && (this === parentEl) || (!hasNestedSortableFix && $.contains(this, parentEl))) {
                        // identify parents
                        sourceParent = dataGet(el, PARENTKEY);
                        sourceIndex = dataGet(el, INDEXKEY);
                        targetParent = dataGet(el.parentNode, LISTKEY);
                        targetIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), el);

                        // take destroyed items into consideration
                        if (!templateOptions.includeDestroyed) {
                            sourceIndex = updateIndexFromDestroyedItems(sourceIndex, sourceParent);
                            targetIndex = updateIndexFromDestroyedItems(targetIndex, targetParent);
                        }

                        // build up args for the callbacks
                        if (sortable.beforeMove || sortable.afterMove) {
                            const sourceParentNode = sourceParent && ui.sender || el.parentNode;
                            const cancelDrop = false;
                            arg = {item, sourceParent, sourceParentNode, sourceIndex, targetParent, targetIndex, cancelDrop};

                            // execute the configured callback prior to actually moving items
                            if (sortable.beforeMove) {
                                sortable.beforeMove.call(this, arg, event, ui);
                            }
                        }

                        // call cancel on the correct list, so KO can take care of DOM manipulation
                        if (sourceParent) {
                            $(sourceParent === targetParent ? this : ui.sender || this).sortable('cancel');
                        }
                        // for a draggable item just remove the element
                        else {
                            $(el).remove();
                        }

                        // if beforeMove told us to cancel, then we are done
                        if (arg && arg.cancelDrop) {
                            return;
                        }

                        // if the strategy option is unset or false, employ the order strategy involving removal and insertion of items
                        if (!sortable.hasOwnProperty('strategyMove') || sortable.strategyMove === false) {
                            // do the actual move
                            if (targetIndex >= 0) {
                                if (sourceParent) {
                                    sourceParent.splice(sourceIndex, 1);

                                    // if using deferred updates plugin, force updates
                                    if (ko.processAllDeferredBindingUpdates) {
                                        ko.processAllDeferredBindingUpdates();
                                    }

                                    // if using deferred updates on knockout 3.4, force updates
                                    if (ko.options && ko.options.deferUpdates) {
                                        ko.tasks.runEarly();
                                    }
                                }

                                targetParent.splice(targetIndex, 0, item);
                            }

                            // rendering is handled by manipulating the observableArray; ignore dropped element
                            dataSet(el, ITEMKEY, null);
                        } else { // employ the strategy of moving items
                            if (targetIndex >= 0) {
                                if (sourceParent) {
                                    if (sourceParent !== targetParent) {
                                        // moving from one list to another

                                        sourceParent.splice(sourceIndex, 1);
                                        targetParent.splice(targetIndex, 0, item);

                                        // rendering is handled by manipulating the observableArray; ignore dropped element
                                        dataSet(el, ITEMKEY, null);
                                        ui.item.remove();
                                    } else {
                                        // moving within same list
                                        const underlyingList = unwrap(sourceParent);

                                        // notify 'beforeChange' subscribers
                                        if (sourceParent.valueWillMutate) {
                                            sourceParent.valueWillMutate();
                                        }

                                        // move from source index ...
                                        underlyingList.splice(sourceIndex, 1);
                                        // ... to target index
                                        underlyingList.splice(targetIndex, 0, item);

                                        // notify subscribers
                                        if (sourceParent.valueHasMutated) {
                                            sourceParent.valueHasMutated();
                                        }
                                    }
                                } else {
                                    // drop new element from outside
                                    targetParent.splice(targetIndex, 0, item);

                                    // rendering is handled by manipulating the observableArray; ignore dropped element
                                    dataSet(el, ITEMKEY, null);
                                    ui.item.remove();
                                }
                            }
                        }

                        // if using deferred updates plugin, force updates
                        if (ko.processAllDeferredBindingUpdates) {
                            ko.processAllDeferredBindingUpdates();
                        }

                        // allow binding to accept a function to execute after moving the item
                        if (sortable.afterMove) {
                            sortable.afterMove.call(this, arg, event, ui);
                        }
                    }

                    if (updateActual) {
                        updateActual.apply(this, arguments);
                    }
                },
                connectWith: sortable.connectClass ? '.' + sortable.connectClass : false
            }));

            // handle enabling/disabling sorting
            if (sortable.isEnabled !== undefined) {
                ko.computed({
                    read: () => {
                        $element.sortable(unwrap(sortable.isEnabled) ? 'enable' : 'disable');
                    },
                    disposeWhenNodeIsRemoved: element
                });
            }
        }, 0);

        // handle disposal
        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            // only call destroy if sortable has been created
            if ($element.data('ui-sortable') || $element.data('sortable')) {
                $element.sortable('destroy');
            }

            ko.utils.toggleDomNodeCssClass(element, sortable.connectClass, false);

            // do not create the sortable if the element has been removed from DOM
            clearTimeout(createTimeout);
        });

        return {controlsDescendantBindings: true};
    },
    update: (element, valueAccessor, allBindingsAccessor, data, context) => {
        const templateOptions = prepareTemplateOptions(valueAccessor, 'foreach');

        // attach meta-data
        dataSet(element, LISTKEY, templateOptions.foreach);

        // call template binding's update with correct options
        ko.bindingHandlers.template.update(element, () => templateOptions, allBindingsAccessor, data, context);
    },
    connectClass: 'ko_container',
    allowDrop: true,
    afterMove: null,
    beforeMove: null,
    options: {}
};

// create a draggable that is appropriate for dropping into a sortable
ko.bindingHandlers.draggable = {
    init: (element, valueAccessor, allBindingsAccessor, data, context) => {
        let value = unwrap(valueAccessor()) || {};
        const options = value.options || {};
        const draggableOptions = ko.utils.extend({}, ko.bindingHandlers.draggable.options);
        const templateOptions = prepareTemplateOptions(valueAccessor, 'data');
        const connectClass = value.connectClass || ko.bindingHandlers.draggable.connectClass;
        const isEnabled = value.isEnabled !== undefined ? value.isEnabled : ko.bindingHandlers.draggable.isEnabled;

        value = 'data' in value ? value.data : value;

        // set meta-data
        dataSet(element, DRAGKEY, value);

        // override global options with override options passed in
        ko.utils.extend(draggableOptions, options);

        // setup connection to a sortable
        draggableOptions.connectToSortable = connectClass ? '.' + connectClass : false;

        // initialize draggable
        $(element).draggable(draggableOptions);

        // handle enabling/disabling sorting
        if (isEnabled !== undefined) {
            ko.computed({
                read: function () {
                    $(element).draggable(unwrap(isEnabled) ? 'enable' : 'disable');
                },
                disposeWhenNodeIsRemoved: element
            });
        }

        // handle disposal
        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).draggable('destroy');
        });

        return ko.bindingHandlers.template.init(element, () => templateOptions, allBindingsAccessor, data, context);
    },

    update: (element, valueAccessor, allBindingsAccessor, data, context) => {
        const templateOptions = prepareTemplateOptions(valueAccessor, 'data');
        return ko.bindingHandlers.template.update(element, templateOptions, allBindingsAccessor, data, context);
    },

    connectClass: ko.bindingHandlers.sortable.connectClass,

    options: {
        helper: 'clone'
    }
};
