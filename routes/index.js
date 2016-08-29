const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
    const mustLogin = req.params.mustLogin === '1';
    const logined = req.isAuthenticated && req.isAuthenticated();
    const userName = req.user ? req.user.username : null;

    res.render('index', {
        title: 'Tacowasa',
        displayTitle: 'Tacowasa',
        logined: logined,
        mustLogin: mustLogin,
        userName: userName
    });
});

module.exports = router;