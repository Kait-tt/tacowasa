'use strict';
require('block-ui');

module.exports = {
    block: function () {
        $.blockUI({message: '<h4><img src="/images/loader-24.gif"> Connecting...</h4>'});
    },

    unblock: function () {
        $.unblockUI();
    }
};
