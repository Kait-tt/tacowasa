const _ = require('lodash');
const webpack = require('webpack');
const ENV = process.env.NODE_ENV;

// development
const webpackConfig = {
    entry: {
        top: __dirname + '/public/src/js/entries/top.js'
    },
    output: {
        path: __dirname + '/public/dist',
        filename: '[name].js'
    },
    module: {
        loaders: [
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
                loader: "file"
            },
            {
                test: /\.(woff|woff2)$/,
                loader:"url?prefix=font/&limit=5000"
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/octet-stream"
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=image/svg+xml"
            }
        ],
    },
    sassLoader: {
        includePaths: [__dirname + '/public/src/scss']
    },
    devtool: '#source-map',
    resolve: {
        extensions: ['', '.js', '.json']
    },
    plugins: _.compact([
        new webpack.optimize.CommonsChunkPlugin('common.js')
    ])
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