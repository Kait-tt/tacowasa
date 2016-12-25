'use strict';
const ko = require('knockout');
const _ = require('lodash');
const util = require('../modules/util');
const moment = require('moment');

class Work {
    constructor (opts) {
        Work.columnKeys.forEach(key => { this[key] = ko.isObservable(opts[key]) ? opts[key] : ko.observable(opts[key]); });

        this.isValidStartTime = ko.pureComputed(() => this.validateStartTime());
        this.isValidEndTime = ko.pureComputed(() => this.validateEndTime());
        this.isValidUser = ko.pureComputed(() => this.validateUser());

        this.startTimeFormat = ko.pureComputed({
            read: () => {
                return util.dateFormatYMDHM(this.startTime());
            },
            write: (value) => {
                // validかどうかに関係なく入れる。validチェックは他で。
                this.startTime(String(moment(value).toDate()));
            },
            owner: this
        });

        this.endTimeFormat = ko.pureComputed({
            read: () => {
                return this.endTime() ? util.dateFormatYMDHM(this.endTime()) : null;
            },
            write: (value) => {
                // validかどうかに関係なく入れる。validチェックは他で。
                // ただし、空白のみの文字列はnullとして入れる
                this.endTime(_.isString(value) && !value.trim() ? null : String(moment(value).toDate()));
            },
            owner: this
        });

        this.duration = ko.pureComputed(() => {
            const duration = this.calcDuration(false);
            return _.isNumber(duration) ? util.dateFormatHM(duration) : null;
        });

        this.username = ko.pureComputed(() => {
            const user = this.user();
            return user && user.username();
        }, this);
    }

    static get columnKeys () {
        return [
            'isEnded',
            'startTime',
            'endTime',
            'user'
        ];
    }

    clone () {
        return new Work({
            isEnded: this.isEnded(),
            startTime: this.startTime(),
            endTime: this.endTime(),
            user: this.user
        });
    }

    // local format -> server format
    deserialize () {
        const user = this.user();
        return {
            isEnded: this.isEnded(),
            startTime: this.startTime(),
            endTime: this.endTime(),
            userId: user ? user.id() : null
        };
    }

    validateStartTime () {
        const start = moment(this.startTime());
        if (!start.isValid()) { return false; }
        if (this.endTime()) { return start.toDate() <= new Date(this.endTime()); }
        return true;
    }

    validateEndTime () {
        if (this.isEnded() && !this.endTime()) { return true; } // be working
        const end = moment(this.endTime());
        if (!end.isValid()) { return false; }
        return end.toDate() >= new Date(this.startTime());
    }

    validateUser () {
        const user = this.user();
        const isEnded = this.isEnded();
        return (user && isEnded) || (!user && !isEnded);
    }

    // 作業時間の計算
    // force = true なら作業が終了していなくても現在時刻から作業時間を計算する
    calcDuration (force = false) {
        if (!force && !this.isEnded()) { return null; }
        let start = new Date(this.startTime());
        let end = this.endTime() || new Date();
        return end - start;
    }
}

module.exports = Work;
