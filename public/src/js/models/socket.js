'use strict';
const EventEmitter2 = require('eventemitter2');
const io = require('socket.io-client');
const _ = require('lodash');

function Socket() {
    var that = io.connect();
    that.eventEmitCallback = new EventEmitter2();

    // ソケットのデバッグ出力を有効にする
    // on/emit時の内容をコンソールに出力する
    that.initSocketDebugMode = () => {
        // debug on event
        Object.keys(that._callbacks)
            .map(x => x.replace(/\$/g, ''))
            .filter(key => !_.includes(['ping', 'pong'], key))
            .forEach(key => {
                that.on(key, res => {
                    console.debug('on: ' + key, res);
                });
            });

        // debug on emit
        that.emit = _.wrap(that.emit.bind(that), (emit, key, req, fn) => {
            'use strict';
            const context = this;
            const enableDebug = !_.includes(['ping', 'pong'], key);
            enableDebug && console.debug('emit: ' + key, req);
            emit(key, req, res =>  {
                enableDebug && console.debug('callback: ' + key, res);
                fn && fn.apply(context, arguments);
            });
        });
    };

    // TODO: 多分動いてない
    // emitのcallbackをイベントで受け取れるようにする
    that.hookEventEmitCallback = () => {
        that.emit = _.wrap(that.emit.bind(that), (emit, key, req, fn) => {
            'use strict';
            const context = this;
            emit(key, req, res => {
                that.eventEmitCallback.emit(key, req, res);
                fn && fn.apply(context, arguments);
            });
        });
    };

    that.hookEventEmitCallback();

    return that;
}

module.exports = Socket;