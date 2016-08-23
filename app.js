const koa = require('koa');
const app = koa();
const router = require('koa-router')();
const port = parseInt(process.env.PORT, 10) || 3000;
const render = require('koa-ejs');

// logger
app.use(function *(next){
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s - %s', this.method, this.url, ms);
});

// error handler
app.use(function *(next) {
    try {
        yield next;
    } catch (err) {
        console.error(err);
        this.status = err.status || 500;
        this.app.emit('error', err, this);
        this.render('error', {
            message: err.message,
            error: err
        });
    }
});

// router
render(app, {
    root: `${__dirname}/views`,
    layout: false,
    viewExt: 'ejs',
    cache: false,
    debug: process.env.NODE_ENV !== 'production'
});

const routes = {
    index: require('./routes/index')
};

app
    .use(routes.index.routes())
    .use(routes.index.allowedMethods());

// start
if (!module.parent) {
    app.listen(port);
    console.log(`Listening on port ${port}`);
}

module.exports = app;
