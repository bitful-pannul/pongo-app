const createExpoWebpackConfigAsync = require('@expo/webpack-config');

const target = 'https://fabnev.labwet.art/'
// const target = 'http://localhost:8080/'
// const target = 'http://localhost:8081/'
// const target = 'http://135.181.83.111:8081/'
// const target = 'https://test-moon.labwet.art/'

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  // Customize the config before returning it.

  config.devServer = {
    proxy: {
      '/session.js': {
        target,
        changeOrigin: true
      },
      '/~/': {
        target,
        changeOrigin: true
      },
    },
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    }
  };

  if (config.mode === 'development') {
    config.devServer.compress = false;
  }

  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  });

  config.module.rules.push({
    test: /\.(woff|woff2|eot|ttf|otf)$/i,
    type: 'asset/resource',
    generator: {
      filename: 'static/[hash][ext]', // necessary to glob because uppercase names can't be committed to urbit
    },
  });

  config.module.rules.push({
    test: /\.js$/,
    enforce: 'pre',
    use: [{
      //needed to chain sourcemaps.  see: https://webpack.js.org/loaders/source-map-loader/
      loader: 'source-map-loader',
      options: {
        filterSourceMappingUrl: (url, resourcePath) => {
            //  console.log({ url, resourcePath }) example:
            // {
            //  url: 'index.js.map',
            //  resourcePath: '/repos/xlib-wsl/common/temp/node_modules/.pnpm/https-proxy-agent@5.0.0/node_modules/https-proxy-agent/dist/index.js'
            // }

          if (/.*\/node_modules\/.*/.test(resourcePath)) {
              return false
          }
          return true
        }
      }
    }],
  })

  return config;
};
