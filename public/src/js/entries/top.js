'use strict';
require('../../scss/top.scss');
require('bootstrap');
const ko = require('knockout');
const Project = require('../models/project');

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

const projects = ko.observableArray();
const logined = window.logined;

const vm = {projects};
ko.applyBindings(vm);

if (logined) {
    Project.fetchAll()
        .then(_projects => {
            _projects.forEach(x => projects.push(x));
        })
        .catch(err => console.error(err));
}
