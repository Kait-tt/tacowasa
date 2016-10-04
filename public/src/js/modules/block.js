'use strict';
require('block-ui');
$.blockUI.defaults.baseZ = 2000; // over dialogs

module.exports = {
    block: function (message = 'processing...') {
        $.blockUI({message: `<h4><img src="/images/loader-24.gif">${message}</h4>`});
    },

    unblock: function () {
        $.unblockUI();
    }
};
