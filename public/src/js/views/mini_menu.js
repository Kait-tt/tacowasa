'use strict';
const _ = require('lodash');

class MiniMenu {
    constructor(dom, opts={}) {
        this.opts = _.defaults(opts, MiniMenu.defaultOptions);

        this.$dom = $(dom);
        if (this.$dom.length === 0) { return; }
        this.$defaultButton = this.$dom.children('.mini-menu-default');
        this.$ul = this.$dom.children('ul.mini-menu-list');
        this.$li = this.$ul.children('li');
        this.iconSize = this.$dom.children('.mini-menu-default').height();

        // add mouse event
        this.$dom
            .mouseenter(() => this.show())
            .mouseleave(() => this.hide());

        // to initialize position and hidden
        this.initializeMenu();
        this.$ul.show();
        this.$li.each(() => $(this).hide());

        this.opts.onInitialized(this.$dom, this.$ul, this.$li, this);
    }

    static get defaultOptions() {
        return {
            r: 90,
            duration: 200,
            easing: 'easeOutCubic',
            margin: 0,
            hideEventDebounceTime: 500, // (ms)
            onInitialized: function ($dom, $ul, $li, context) {}
        };
    }

    static get defaultSelector() {
        return '.mini-menu';
    }

    static init(selector, opts) {
        return $(selector || MiniMenu.defaultSelector).map(() => {
            return new MiniMenu(this, opts);
        });
    };

    // to knockout
    static applyBindings(global, oopts) {
        if (!global.view) { global.view = {}; }

        if (!global.view.MiniMenu) {
            global.view.MiniMenu = {
                init: (doms) => {
                    doms.forEach((dom) => {
                        new MiniMenu($(dom).find(MiniMenu.defaultSelector), opts);
                    });
                }
            };
        }
    };

    initializeMenu() {
        this.$ul
            .stop(true, false)
            .css({
                width: 0,
                height: 0,
                top: this.$dom.position().top + this.iconSize / 2,
                left: this.$dom.position().left + this.iconSize / 2
            });

        const halfIconSize = this.iconSize / 2;
        this.$li.each(() => {
            'use strict';
            $(this)
                .stop(true, false)
                .css({
                    top : -halfIconSize,
                    left: -halfIconSize
                })
                .hide();
        });
    }

    show() {
        this.$li = this.$ul.children('li'); // 変更されているかもしれないので取得しなおす

        const len = this.$li.length;
        const duration = this.opts.duration;
        const easing = this.opts.easing;
        const margin = this.opts.margin;
        const r = this.opts.r;
        const halfIconSize = this.iconSize / 2;

        this.initializeMenu();

        this.$ul
            .stop(true, false)
            .show()
            .animate({
                width: r,
                height: r,
                borderRadius:r,
                top : this.$dom.position().top + r / -2 + this.iconSize / 2,
                left: this.$dom.position().left + r / -2 + this.iconSize / 2
            }, duration, easing);

        this.$li.each(i => {
            'use strict';
            const rate = i / len;
            const alpha = Math.PI * 2 * rate - Math.PI / 2;
            const halfR = r / 2;

            $(this)
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
        const halfIconSize = this.iconSize / 2;

        this.$ul
            .stop(true, false)
            .animate({
                width: 0,
                height: 0,
                borderRadius:0,
                top : this.$dom.position().top + this.iconSize / 2,
                left: this.$dom.position().left + this.iconSize / 2
            }, duration, easing, () => { 'use strict'; $(this).hide(); });

        this.$li.each(() => {
            'use strict';
            $(this)
                .stop(true, false)
                .animate({
                    top : -halfIconSize,
                    left: -halfIconSize
                }, duration, easing, () => { 'use strict'; $(this).hide(); });
        });
    }
}

module.exports = MiniMenu;