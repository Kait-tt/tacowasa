const router = require('koa-router')();

router.get('/', function* () {
    yield this.render('index', {
        title: 'Tacowasa',
        displayTitle: 'Tacowasa',
        logined: false,
        mustLogin: false,
        userName: null
    });
});

module.exports = router;
