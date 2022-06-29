const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
        sourceMap: false,
          compress: {
            drop_console: true
          },
        },
      }),
    ],
  },
  plugins: [
    new NodePolyfillPlugin()
    ]
};