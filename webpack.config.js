const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

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
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader'
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                includePaths: [path.join(__dirname, '/public/src/scss')]
                            }
                        }
                    ]
                })
            },
            {
                test: /$.html/,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            attrs: ['minimize'],
                            removeComments: false,
                            minimize: true
                        }
                    }
                ]
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                use: ['file-loader']
            },
            {
                test: /\.(woff|woff2)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            prefix: 'font/',
                            limit: 5000
                        }
                    }
                ]
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10000,
                            minetype: 'application/octet-stream'
                        }
                    }
                ]
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10000,
                            minetype: 'image/svg+xml'
                        }
                    }
                ]
            }
        ]
    },
    devtool: '#source-map',
    resolve: {
        extensions: ['.js', '.json']
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('common'),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new ExtractTextPlugin('[name].css'),
        function () {
            this.plugin('watch-run', (watching, callback) => {
                console.log('Begin compile at ' + new Date());
                callback();
            });
        }
    ]
};

// production
if (process.env.NODE_ENV === 'production') {
    const uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin();
    webpackConfig.plugins.push(uglifyJsPlugin);
}

module.exports = webpackConfig;
