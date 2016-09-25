'use strict';

const effects = {
    fadeIn: elm => {
        $(elm).hide().fadeIn('slow');
    },

    fadeOut: elm => {
        $(elm).fadeOut('slow', () => $(elm).remove());
    },

    slideDown: elm => {
        $(elm).hide().slideDown();
    },

    slideUp: elm => {
        const $elm = $(elm);
        $elm.slideUp(() => elm.remove());
    },

    scrollDown: (elm, idx, item) => {
        if (elm.nodeType !== 1) { return; }
        const $elm = $(elm).eq(0);
        const $wrap = $elm.parents('.scroll-wrap').eq(0);
        $wrap.scrollTop(($elm.height() + 10) * (idx + 1));
    },

    applyBindings: global => {
        'use strict';
        if (!global.view) {
            global.view = {};
        }
        global.view.effects = effects;
    }
};

module.exports = effects;
