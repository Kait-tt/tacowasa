'use strict';
const ko = require('knockout');
const _ = require('lodash');

// TODO: component化
class Alert {
    constructor ({maxAlertNum = 5, waitHideTime = 8000} = {}) {
        this.maxAlertNum = maxAlertNum;
        this.waitHideTime = waitHideTime;
        this.alerts = ko.observableArray();
    }

    pushAlert ({title = '', message = '', isSuccess = false}) {
        const content = {title, message, isSuccess};
        this.alerts.unshift(content);

        // maxAlert以上のアラートを削除
        this.alerts.splice(this.maxAlertNum);

        // x秒後に自動的にアラートを削除
        setTimeout(() => {
            this.alerts.remove(content);
        }, this.waitHideTime);

        return this;
    }

    pushSuccessAlert ({title = 'Successful!', message = ''}) {
        this.pushAlert({title, message, isSuccess: true});
    }

    pushErrorAlert ({title = 'Error', message = ''}) {
        this.pushAlert({title, message, isSuccess: false});
    }

    // promiseを返す関数をラップする
    wrapAlert (wrappedFunc, successMessage, errorMessage) {
        if (!_.isFunction(wrappedFunc)) {
            throw new Error(`${wrappedFunc} must be a function`);
        }

        return (...args) => {
            wrappedFunc.apply(this, args)
                .then(() => {
                    if (successMessage) {
                        this.pushSuccessAlert({message: ko.unwrap(successMessage)});
                    }
                }, err => {
                    if (errorMessage) {
                        this.pushErrorAlert({message: ko.unwrap(errorMessage)});
                    }
                    throw new Error(err);
                });
        };
    }

    // 複数の関数をラップする
    wrapsAlert (targetObject, paramsList) {
        paramsList.forEach(({methodName, successMessage = null, errorMessage = null}) => {
            targetObject[methodName] = this.wrapAlert(
                targetObject[methodName].bind(targetObject),
                successMessage,
                errorMessage
            );
        });
    }
}

module.exports = Alert;
