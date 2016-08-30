'use strict';
const _ = require('lodash');

// 背景ドラッグで画面をスクロールするView
class Scroller {
    constructor(opts={}) {
        this.opts = _.defaults(opts, Scroller.defaultOptions);
        this.$contexts = this.opts.selectors.map(selector => $(selector));
        this.$target = $(this.opts.target);

        this.isClicked = false;
        this.beforeX = null;

        // scroll event
        this.opts.selectors.forEach(selector => {
            $('body').delegate(selector, 'mousedown', this.onMousedown.bind(this));
        });

        // cancel
        this.opts.cancelSelectors.forEach(selector => {
            $('body').delegate(selector, 'mousedown', this.cancel.bind(this));
        });

        // move event
        $(window).mousemove(this.onMousemove.bind(this));

        $(window).mouseup(this.cancel.bind(this));
    }

    cancel(e) {
        e.canceled = true;
        this.isClicked = false;
        this.beforeX = null;
    }

    onMousedown(e) {
        if (!e.canceled && e.button === 0) { // 左クリックのみ作動
            this.isClicked = true;
            this.beforeX = e.screenX;
        }
    }

    onMouseup(e) {
        this.cancel(e);
    }

    onMousemove(e) {
        if (that.isClicked) {
            const now = e.screenX;
            const diff = now - this.beforeX;
            this.$target.scrollLeft(this.$target.scrollLeft() - diff * this.opts.step);
            this.beforeX = now;

            return false;
        }
    }

    static get defaultOptions() {
        return {
            selectors: [],
            cancelSelectors: [],
            target: window,
            step: 1
        };
    }
}

module.exports = Scroller;