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
    get componentName () {
        return 'task-body-preview';
    }

    register () {
        if (ko.components.isRegistered(this.componentName)) { return; }
        ko.components.register(this.componentName, {
            viewModel: function ({body}) {
                this.body = body;
                this.bodyPreview = ko.pureComputed(() => marked(this.body()));
            },
            template: require('html-loader!./task_body_preview.html')
        });
    }
}

module.exports = TaskBodyPreview;
