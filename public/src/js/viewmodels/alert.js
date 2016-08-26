'use strict';
const ko = require('knockout');
const _ = require('lodash');

class Alert {
    constructor({maxAlertNum=5, waitHideTime=8000}={}) {
        this.maxAlertNum = maxAlertNum;
        this.waitHideTime = waitHideTime;
        this.alerts = ko.observableArray();
    }

    pushAlert({title='', message='', isSuccess=false}) {
        this.alerts.unshift({title, message, isSuccess});

        // maxAlert以上のアラートを削除
        this.alerts.splice(this.maxAlertNum);

        // x秒後に自動的にアラートを削除
        setTimeout(() => {
            this.alerts.remove(alertContent);
        }, this.waitHideTime);

        return this;
    }

    // promiseを返す関数をラップする
    wrapAlert(wrappedFunc, successMessage, errorMessage) {
        if (!_.isFunction(wrappedFunc)) {
            throw new Error('${wrappedFunc} must be a function');
        }

        return (...args) => {
            wrappedFunc.apply(this, args)
                .then(() => {
                    if (successMessage) {
                        this.pushAlert({
                            title: 'Successful!',
                            message: ko.unwrapObservable(successMessage),
                            isSuccess: true
                        })
                    }
                }, err => {
                    if (errorMessage) {
                        this.pushAlert({
                            title: 'Error',
                            message: ko.unwrapObservable(errorMessage),
                            isSuccess: false
                        });
                    }
                    throw new Error(err);
                });
        }
    }

    // 複数の関数をラップする
    wrapsAlert(targetObject, paramsList) {
        paramsList.forEach(({methodName, successMessage=null, errorMessage=null}) => {
            targetObject[methodName] = this.wrapAlert(
                targetObject[methodName].bind(targetObject),
                successMessage,
                errorMessage
            );
        });
    }
}

module.exports = Alert;
