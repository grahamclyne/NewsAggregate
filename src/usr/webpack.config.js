var webpack = require('webpack');
var path = require('path');
module.exports = {
      mode: 'development',
  entry: './Posts.js',
  output: { path: __dirname, filename: 'bundle.js' },
  module: {
    rules: [
      {
        test: /.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
            presets: ['@babel/react', '@babel/env'],
            plugins: ['@babel/proposal-class-properties']
          }
      },
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }]
    }}