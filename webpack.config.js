var webpack = require('webpack');

module.exports = (env) => {
  return {
    mode: 'development',
    entry: './src/usr/Posts.js',
    output: { path: __dirname + '/src/usr/', filename: 'bundle.js' },
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
    }
  }
}