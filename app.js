const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('config');
const sessionMiddleware = require('./lib/modules/sessionMiddleware');

const app = express();

// Passport session setup.
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Use the GitHubStrategy within Passport.
passport.use(new GitHubStrategy({
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackURL,
    scope: ['user', 'repo']
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => {
        profile.token = accessToken;
        return done(null, profile);
    });
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(__dirname + '/public/favicon.ico'));
if (process.env.NODE_ENV !== 'test') {
    app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/dist')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// routing
const Router = require('./router');
const router = new Router(passport);
app.use('/', router);


module.exports = app;
