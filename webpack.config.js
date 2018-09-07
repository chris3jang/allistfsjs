
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './app/index.js',
  output: {
    path: path.join(__dirname, './dist/'),
    filename: 'bundle.js',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        include: path.join(__dirname, 'app'),
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react', 'env', 'stage-0']
        }
      },
      {
        test: /\.css$/, 
        loader: 'style-loader'  
      },
      {
        test: /\.css$/,
        loader: 'css-loader',
        query: {
          modules: true, 
          localIdentName: '[name]__[local]___[hash:base64:5]'
        }
      },
      {
        test: /\.(pdf|jpg|jpeg|png|gif|svg|ico)$/,
        loader: 'url-loader'
      }/*,
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'css-loader',
        options: { name: '[name].[ext]', outputPath: 'fonts/'}
      }
      */
    ]
  },
};


/*

path: path.resolve('./assets/bundles/'),
filename: "[name]-[hash].js",

path: __dirname,
filename: 'bundle.js',
publicPath: './app/assets/'

path : path.join(__dirname, './'),
filename : 'index.js'


*/