const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);
const rorkConfig = withRorkMetro(config);

// Keep Rork resolver/polyfill behavior, but use Expo's default transformer.
// This avoids automatic wrapper injection in app/_layout that can cause
// device-only runtime validation errors in Expo Go.
rorkConfig.transformer = {
  ...rorkConfig.transformer,
  babelTransformerPath: require.resolve("@expo/metro-config/babel-transformer"),
};

module.exports = rorkConfig;
