'use strict';
const ko = require('knockout');
const _ = require('lodash');
const util = require('../modules/util');
const moment = require('moment');

class Work {
    constructor(opts) {
        Work.columnKeys.forEach(key => this[key] = ko.isObservable(opts[key]) ? opts[key] : ko.observable(opts[key]));

        // isEndedの修正... // TODO: databaseを直す
        if (!opts.isEnded && opts.userId && opts.endTime) {
            opts.isEnded(true);
        }

        this.isValidStartTime = ko.computed(() => this.validateStartTime());
        this.isValidEndTime = ko.computed(() => this.validateEndTime());
        this.isValidUser = ko.computed(() => this.validateUser());

        this.startTimeFormat = ko.computed({
            read: () => {
                return util.dateFormatYMDHM(this.startTime());
            },
            write: (value) => {
                // validかどうかに関係なく入れる。validチェックは他で。
                this.startTime(String(moment(value).toDate()));
            },
            owner: this
        });

        this.endTimeFormat = ko.computed({
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

        this.duration = ko.computed(() => {
            const duration = this.calcDuration(false);
            return _.isNumber(duration) ? util.dateFormatHM(duration) : null;
        });

        this.username = ko.computed(() => {
            const user = this.user();
            return user && user.username();
        }, this);
    }

    static get columnKeys() {
        return [
            'isEnded',
            'startTime',
            'endTime',
            'user'
        ];
    }

    clone() {
        return new Work({
            isEnded: this.isEnded(),
            startTime: this.startTime(),
            endTime: this.endTime(),
            user: this.user
        });
    }

    // local format -> server format
    deserialize() {
        const user = this.user();
        return {
            isEnded: this.isEnded(),
            startTime: this.startTime(),
            endTime: this.endTime(),
            userId: user ? user.id() : null
        };
    }

    validateStartTime() {
        const start = moment(this.startTime());
        if (!start.isValid()) { return false; }
        if (this.endTime()) { return start.toDate() <= new Date(this.endTime()); }
        return true;
    }

    validateEndTime() {
        if (this.isEnded() && !this.endTime()) { return true; } // be working
        const end = moment(this.endTime());
        if (!end.isValid()) { return false; }
        return end.toDate() >= new Date(this.startTime());
    }

    validateUser() {
        const user = this.user();
        const isEnded = this.isEnded();
        return (user && isEnded) || (!user && !isEnded);
    }

    // 作業時間の計算
    // force = true なら作業が終了していなくても現在時刻から作業時間を計算する
    calcDuration(force=false) {
        let start = new Date(this.startTime());
        let end;
        // TODO: ここでisEndedのバグの修正はしなくてよい（上でする or databaseでする）
        // isEndedは正しくないときがあるので、endTimeがあるかで終了してるかを判断する
        if (this.endTime()) {
            end = new Date(this.endTime());
        } else if (force) {
            end = new Date();
        } else {
            return null;
        }

        // Dateはマイナスにしてはいけないので気を付けて計算する
        if (start < end) { return end - start; }
        else if (start > end) { return -(start - end); } // TODO: start > end ってなんだ...？
        else { return 0; }
    }
}

module.exports = Work;