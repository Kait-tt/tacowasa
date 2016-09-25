'use strict';
const _ = require('lodash');

// 背景ドラッグで画面をスクロールするView
class Scroller {
    constructor (opts = {}) {
        this.opts = _.defaults(opts, Scroller.defaultOptions);
        this.$target = $(this.opts.target);

        this.isClicked = false;
        this.beforeX = null;

        // scroll event
        $('html,body')
            .on('mousedown', this.opts.selector, this.onMousedown.bind(this))
            .on('mousedown', this.opts.cancelSelector, this.cancel.bind(this));

        // move event
        $(window).mousemove(this.onMousemove.bind(this));
        $(window).mouseup(this.onMouseup.bind(this));
    }

    cancel (e) {
        e.canceled = true;
        this.isClicked = false;
        this.beforeX = null;
    }

    onMousedown (e) {
        if (!e.canceled && e.button === 0) { // 左クリックのみ作動
            this.isClicked = true;
            this.beforeX = e.screenX;
        }
    }

    onMouseup (e) {
        this.cancel(e);
    }

    onMousemove (e) {
        if (this.isClicked) {
            const now = e.screenX;
            const diff = now - this.beforeX;
            this.$target.scrollLeft(this.$target.scrollLeft() - diff * this.opts.step);
            this.beforeX = now;

            return false;
        }
    }

    static get defaultOptions () {
        return {
            selector: '',
            cancelSelector: '',
            target: window,
            step: 1
        };
    }
}

module.exports = Scroller;
