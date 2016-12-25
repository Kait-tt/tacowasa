'use strict';
const ko = require('knockout');
const marked = require('marked');

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
});

class TaskBodyPreview {
    constructor (prefix = '') {
        this.prefix = prefix;
    }

    get componentName () {
        return `${this.prefix}task-body-preview`;
    }

    register () {
        ko.components.register(this.componentName, {
            viewModel: function ({body}) {
                this.body = body;
                this.bodyPreview = ko.pureComputed(() => marked(this.body()));
            },
            template: require('html!./task_body_preview.html')
        });
    }
}

module.exports = TaskBodyPreview;
