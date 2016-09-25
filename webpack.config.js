const path = require('path');
const webpack = require('webpack');
const ENV = process.env.NODE_ENV;

// development
const webpackConfig = {
    entry: {
        top: path.join(__dirname, '/public/src/js/entries/top.js'),
        user: path.join(__dirname, '/public/src/js/entries/user.js'),
        kanban: path.join(__dirname, '/public/src/js/entries/kanban.js')
    },
    output: {
        publicPath: '/',
        path: path.join(__dirname, '/public/dist'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            // html loaderの設定をここに定義するとscssの読込がバグるのでやらないこと
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel'
            },
            {
                test: /\.scss$/,
                loader: 'style!css!sass'
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file'
            },
            {
                test: /\.(woff|woff2)$/,
                loader: 'url?prefix=font/&limit=5000'
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=10000&mimetype=application/octet-stream'
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=10000&mimetype=image/svg+xml'
            }
        ]
    },
    htmlLoader: {
        attrs: ['minimize']
    },
    sassLoader: {
        includePaths: [path.join(__dirname, '/public/src/scss')]
    },
    devtool: '#source-map',
    resolve: {
        extensions: ['', '.js', '.json']
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('common.js'),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        function () {
            this.plugin('watch-run', (watching, callback) => {
                console.log('Begin compile at ' + new Date());
                callback();
            });
        }
    ]
};

// production
if (ENV === 'production') {
    const uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        },
        test: /\.(js|json)$/
    });
    webpackConfig.plugins.push(uglifyJsPlugin);
}

module.exports = webpackConfig;
