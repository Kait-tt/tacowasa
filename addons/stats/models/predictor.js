'use strict';
const spawn = require('child_process').spawn;
const _ = require('lodash');
const db = require('../schemas');
const Util = require('../modules/util');

class Predictor {
    static calcAll (projectId, {transaction} = {}) {
    }

    static _execChild (tasks, userIds, costs) {
        const src = JSON.stringify({tasks, userIds, costs});

        return Promise((resolve, reject) => {
            let res = '';
            const child = spawn('python', [Predictor._execPath]);
            child.stdout.on('data', data => { res += data; });
            child.stderr.on('data', data => { res += data; });
            child.on('close', code => {
                if (code) {
                    reject(res, code);
                } else {
                    resolve(res);
                }
            });

            child.stdin.setEncoding('utf-8');
            child.stdin.write(src + '\n');
        });
    }

    static get _execPath () {
        return `${__dirname}/../scripts/interval_predict.py`;
    }
}

module.exports = Predictor;
