const { getDefaultConfig } = require('expo/metro-config');
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');
config.transformer.babelTransformerPath = require.resolve('./metro/babel-transformer');
module.exports = config;
