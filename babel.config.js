module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', "module:metro-react-native-babel-preset"],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from',
      [
        "module-resolver",
        {
          extensions: [".tsx", ".ts", ".js", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
      [
        "babel-plugin-inline-import",
        {
          "extensions": [".svg"]
        }
      ]
    ],
  };
};
