
const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  devtool: 'source-map',

  entry: [
    './app/index.js'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  plugins: [
    new UglifyJsPlugin()
  ],
  module: {
    rules: [{
      test: /.jsx?$/,
      loader: 'babel-loader',
      include: path.join(__dirname, 'app'),
      exclude: /node_modules/,
      query: {
        presets: ['es2015', 'react', 'env']
      }
    }]
  },
};