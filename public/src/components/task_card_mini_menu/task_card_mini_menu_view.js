'use strict';
const _ = require('lodash');
const util = require('../../js/modules/util');

class TaskCardMiniMenuView {
    constructor (dom) {
        this.opts = TaskCardMiniMenuView.defaultOptions;
        this.dom = dom;

        this.iconSize = this.opts.iconSize;
        this.halfIconSize = this.iconSize / 2;

        dom.addEventListener('mouseenter', () => this.show(), false);
        dom.addEventListener('mouseleave', () => this.hide(), false);

        this.opened = false;
    }

    get itemListElement () {
        return this.dom.getElementsByClassName('mini-menu-list')[0];
    }

    get itemElements () {
        // taskの状態によってitem数が変わるので毎回取得する
        return this.dom.getElementsByClassName('mini-menu-item');
    }

    static get defaultOptions () {
        return {
            r: 90,
            margin: 0,
            iconSize: 24,
            miniMenuSize: 70
        };
    }

    show () {
        this.opened = true;
        const margin = this.opts.margin;
        const r = this.opts.r;
        const iconSize = this.iconSize;
        const halfIconSize = this.halfIconSize;
        const rootPosition = util.position(this.dom);

        this.itemListElement.classList.remove('animation');
        this.itemListElement.style.top = rootPosition.top + halfIconSize + 'px';
        this.itemListElement.style.left = rootPosition.left + halfIconSize + 'px';

        setTimeout(() => {
            if (!this.opened) { return; }
            this.itemListElement.classList.add('animation');
            this.itemListElement.style.width = r + 'px';
            this.itemListElement.style.height = r + 'px';
            this.itemListElement.style.borderRadius = r + 'px';
            this.itemListElement.style.top = rootPosition.top + r / -2 + halfIconSize + 'px';
            this.itemListElement.style.left = rootPosition.left + r / -2 + halfIconSize + 'px';

            const items = this.itemElements;
            const len = items.length;

            _.each(items, (item, i) => {
                const rate = i / len;
                const alpha = Math.PI * 2 * rate - Math.PI / 2;
                const halfR = r / 2;

                item.style.top = -halfIconSize + halfR + Math.sin(alpha) * (halfR - halfIconSize - margin) + 'px';
                item.style.left = -halfIconSize + halfR + Math.cos(alpha) * (halfR - halfIconSize - margin) + 'px';
                item.style.height = iconSize + 'px';
                item.style.width = iconSize + 'px';
            });
        }, 10);
    }

    hide () {
        this.opened = false;
        const halfIconSize = this.halfIconSize;
        const rootPosition = util.position(this.dom);

        this.itemListElement.style.width = 0;
        this.itemListElement.style.height = 0;
        this.itemListElement.style.borderRadius = 0;
        this.itemListElement.style.top = rootPosition.top + halfIconSize + 'px';
        this.itemListElement.style.left = rootPosition.left + halfIconSize + 'px';

        _.each(this.itemElements, item => {
            item.style.top = -halfIconSize + 'px';
            item.style.left = -halfIconSize + 'px';
            item.style.height = 0;
            item.style.width = 0;
        });
    }
}

module.exports = TaskCardMiniMenuView;
