const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const paths = {};
paths.root = path.resolve(__dirname, '../../../');
paths.dist = path.resolve(paths.root, 'dist/src/ui/editor');
paths.static = path.resolve(paths.root, 'static/editor');
paths.globalStyles = path.resolve(paths.static, 'style.scss');

module.exports = {
  context: __dirname,
  mode: 'development',
  entry: {
    polyfills: path.resolve(__dirname, 'polyfills.ts'),
    main: path.resolve(__dirname, 'editor.module.ts'),
  },
  output: {
    path: paths.dist,
    filename: '[name].bundle.js',
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'angular2-template-loader',
          },
          {
            loader: 'awesome-typescript-loader',
            query: {
              tsconfig: path.join(paths.root, 'tsconfig.json'),
              declaration: false,
            },
          },
        ],
      },
      {
        exclude: paths.globalStyles,
        test: /\.scss$/,
        use: ['raw-loader', 'sass-loader'],
      },
      {
        include: paths.globalStyles,
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
          },
          'sass-loader',
        ],
      },
      {
        test: /.(png|woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/,
        use: 'url-loader?limit=100000',
      },

      {
        test: /\.html$/,
        use: ['raw-loader'],
      },
    ],
  },
  plugins: [
    // Fix for critical dependency warning due to System.import in angular.
    // See https://github.com/angular/angular/issues/11580
    new webpack.ContextReplacementPlugin(/angular(\\|\/)core(\\|\/)@angular/, __dirname),
    new HtmlWebpackPlugin({
      title: 'miix',
      hash: true,
      chunksSortMode: a => a.names[0].includes('polyfill') ? -1 : 1,
      template: path.join(__dirname, 'index.html'),
    }),
  ],
};
