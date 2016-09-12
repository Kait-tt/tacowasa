'use strict';
const moment = require('moment');

class Activity {
    constructor({sender, content, created_at}) {
        this.created_at = this.time = moment(created_at).format('MM/DD HH:mm:ss');
        this.sender = sender;
        this.content = content;
        this.displayText = `[${this.time}] (${sender}) ${content}`;
    }
}

module.exports = Activity;
