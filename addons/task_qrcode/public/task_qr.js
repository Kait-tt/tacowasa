'use strict';
require('jquery.qrcode');
require('./task_qr.scss');
const caches = {};

class TaskQR {
    static createQR (taskId, {width = 88, height = 88, margin = 0} = {}) {
        if (caches[taskId]) { return caches[taskId]; }

        const ele = document.createElement('div');
        ele.classList.add('task-qr');
        const qr = TaskQR._generateQR(taskId, {width, height, margin});
        ele.appendChild(qr);
        caches[taskId] = ele;

        return ele;
    }

    static _generateQR (taskId, {width, height, margin}) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const black = '#000000';
        const white = '#ffffff';
        const gray = '#e2e2e2';
        const borderWidth = 2;
        const padding = 4;
        const n = 4;
        const bw = Math.floor((width - (margin + borderWidth + padding) * 2) / n) - padding;
        const bh = Math.floor((height - (margin + borderWidth + padding) * 2) / n) - padding;
        const w = (borderWidth + padding + margin) * 2 + (bw + padding) * n;
        const h = (borderWidth + padding + margin) * 2 + (bh + padding) * n;

        // draw border
        ctx.fillStyle = gray;
        ctx.fillRect(margin, margin, w - margin * 2, h - margin * 2);
        ctx.fillStyle = white;
        ctx.fillRect(borderWidth + margin, borderWidth + margin,
            w - borderWidth * 2 - margin * 2, h - borderWidth * 2 - margin * 2);

        const offset = borderWidth + padding + margin;

        // draw find pattern
        const fw = Math.floor((bw * 2 + padding * 2) / 7);
        const fh = Math.floor((bh * 2 + padding * 2) / 7);
        ctx.fillStyle = black;
        ctx.fillRect(offset, offset, fw * 7, fh * 7);
        ctx.fillStyle = white;
        ctx.fillRect(offset + fw, offset + fh, fw * 5, fh * 5);
        ctx.fillStyle = black;
        ctx.fillRect(offset + fw * 2, offset + fh * 2, fw * 3, fh * 3);

        // draw each block
        let num = Number(taskId);
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                if (y < 2 && x < 2) { continue; }
                ctx.fillStyle = num & 1 ? black : white;
                num >>= 1;
                ctx.fillRect(
                    offset + (bw + padding) * x + padding / 2,
                    offset + (bh + padding) * y + padding / 2,
                    bw, bh);
            }
        }

        return canvas;
    }
}

module.exports = TaskQR;
