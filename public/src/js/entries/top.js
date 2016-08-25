'use strict';
require('../../scss/top.scss');
const $ = require('jquery');
require('bootstrap');

const topOffset = 60;

$('.outline a').each(() => {
    'use strict';
    const $that = $(this);
    const href = $that.attr('href');
    $that.click(e => {
        e.preventDefault();
        const target = $(href).offset().top - topOffset; // 描画の関係でtarget先はクリック時に計算したほうが良い
        $('html,body').animate({scrollTop: target}, 500);
    });
});
