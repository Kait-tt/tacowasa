'use strict';
const _ = require('lodash');

class TaskCardMiniMenuView {
    constructor(dom, opts={}) {
        this.opts = _.defaults(opts, TaskCardMiniMenuView.defaultOptions);

        this.$dom = $(dom);
        if (this.$dom.length === 0) { return; }

        this.iconSize = this.defaultItemElement.height();
        this.halfIconSize = this.iconSize / 2;

        // add mouse event
        this.$dom
            .mouseenter(() => this.show())
            .mouseleave(() => this.hide());

        // to initialize position and hidden
        this.initializeMenu();
        this.itemListElement.show();
        this.itemElements.hide();
    }

    get defaultItemElement() {
        return this.$dom.find('.mini-menu-default');
    }

    get itemListElement() {
        return this.$dom.find('ul.mini-menu-list');
    }

    get itemElements() {
        // taskの状態によってitem数が変わるので毎回取得する
        return this.itemListElement.find('li');
    }

    static get defaultOptions() {
        return {
            r: 90,
            duration: 200,
            easing: 'easeOutCubic',
            margin: 0,
            hideEventDebounceTime: 500 // (ms)
        };
    }

    initializeMenu() {
        const halfIconSize = this.halfIconSize;

        this.itemListElement
            .stop(true, false)
            .css({
                width: 0,
                height: 0,
                top: this.$dom.position().top + halfIconSize,
                left: this.$dom.position().left + halfIconSize
            });

        this.itemElements
            .stop(true,false)
            .css({
                top : -halfIconSize,
                left: -halfIconSize
            })
            .hide();
    }

    show() {
        const items = this.itemElements;
        const len = items.length;
        const duration = this.opts.duration;
        const easing = this.opts.easing;
        const margin = this.opts.margin;
        const r = this.opts.r;
        const halfIconSize = this.halfIconSize;
        const rootPosition = this.$dom.position();

        this.initializeMenu();

        this.itemListElement
            .stop(true, false)
            .show()
            .animate({
                width: r,
                height: r,
                borderRadius:r,
                top : rootPosition.top + r / -2 + halfIconSize,
                left: rootPosition.left + r / -2 + halfIconSize
            }, duration, easing);

        _.each(items, (item, i) => {
            const rate = i / len;
            const alpha = Math.PI * 2 * rate - Math.PI / 2;
            const halfR = r / 2;

            $(item)
                .stop(true, false)
                .show()
                .animate({
                    top : -halfIconSize + halfR + Math.sin(alpha) * (halfR - halfIconSize - margin),
                    left: -halfIconSize + halfR + Math.cos(alpha) * (halfR - halfIconSize - margin)
                }, duration, easing);
        });
    }

    hide() {
        const duration = this.opts.duration;
        const easing = this.opts.easing;
        const halfIconSize = this.halfIconSize;
        const rootPosition = this.$dom.position();

        this.itemListElement
            .stop(true, false)
            .animate({
                width: 0,
                height: 0,
                borderRadius:0,
                top : rootPosition.top + halfIconSize,
                left: rootPosition.left + halfIconSize
            }, duration, easing, () => { 'use strict'; $(this).hide(); });

        _.each(this.itemElements, item => {
            $(item)
                .stop(true, false)
                .animate({
                    top : -halfIconSize,
                    left: -halfIconSize
                }, duration, easing, () => { $(item).hide(); });
        });
    }
}

module.exports = TaskCardMiniMenuView;