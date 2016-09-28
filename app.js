const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('config');
const sessionMiddleware = require('./lib/modules/sessionMiddleware');
const addon = require('./addons');

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
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/dist')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// routing
const routes = {
    index: require('./routes/index'),
    auth: require('./routes/auth')(passport),
    user: require('./routes/user'),
    project: require('./routes/project'),
    api: require('./routes/api')
};

app.use('/', routes.index);
app.use('/auth', routes.auth);
app.use('/users', routes.auth.ensureAuthenticated, routes.user);
app.use('/users', routes.auth.ensureAuthenticated, routes.project);
app.use('/api', routes.auth.ensureAuthenticatedApi, routes.api);
app.use('/api', (req, res) => {
    res.status(404).json({message: 'Not found'});
});

addon.callAddons('Router', 'setRouter', {app}, {sync: true});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
        if (err && err.status % 100 === 5) {
            console.error(err);
        }
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
    if (err && err.status % 100 === 5) {
        console.error(err);
    }
});


module.exports = app;
