const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: join(__dirname, '../../dist/apps/client'),
          to: join(__dirname, '../../dist/apps/api/client'),
          noErrorOnMissing: true,
        },
      ],
    }),
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
  ],
};
