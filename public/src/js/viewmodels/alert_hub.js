'use strict';

class AlertHub {
    constructor ({alert, kanban, socket}) {
        this.alert = alert;
        this.kanban = kanban;
        this.socket = socket;
        this.initKanbanAlert();
        this.initSocketAlert();
    }

    initKanbanAlert () {
        this.kanban.on('overWIPLimitDropped', () => {
            this.alert.pushAlert({
                title: 'WIPLimitを超えてタスクをアサインできません。',
                message: 'タスクを調整するか、ユーザ設定からWIPLimitの上限を変更してください。',
                isSuccess: false
            });
        });

        this.kanban.on('workingTaskDropped', () => {
            this.alert.pushAlert({
                title: '作業中タスクのステージや担当者は変更できません。',
                message: '作業状態を「待機中」に変更してから操作しなおしてください。',
                isSuccess: false
            });
        });
    }

    initSocketAlert () {
        this.socket.on('error', () => {
            this.alert.pushAlert({
                title: 'ソケットが接続できませんでした。',
                isSuccess: false
            });
        });

        this.socket.on('reconnect', () => {
            this.alert.pushAlert({
                title: 'ソケットを再接続しました。',
                isSuccess: true
            });
        });

        this.socket.on('disconnect', () => {
            this.alert.pushAlert({
                title: 'ソケットが切断されました。',
                isSuccess: false
            });
        });

        this.socket.on('reconnect_error', () => {
            this.alert.pushAlert({
                title: 'ソケットを再接続しています。',
                message: 'しばらくお待ちください。このメッセージが何度も表示される場合は、' +
                'ページの更新やネットワークの見直しを行ってください。それでも改善されない場合は、' +
                'お手数ですが管理者へお問い合わせください。',
                isSuccess: false
            });
        });

        this.socket.on('operationError', res => {
            this.alert.pushAlert({
                title: '操作エラー',
                message: res.message,
                isSuccess: false
            });
        });
    }
}

module.exports = AlertHub;
