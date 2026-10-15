const path = require('path')

const upstreamPath = require.resolve('@expo/metro-config/build/babel-transformer', {
  paths: [path.dirname(require.resolve('expo/metro-config'))],
})
const upstream = require(upstreamPath)

module.exports.transform = function transform(args) {
  if (args.filename.endsWith('.sql')) {
    return upstream.transform({
      ...args,
      src: `export default ${JSON.stringify(args.src)};\n`,
    })
  }
  return upstream.transform(args)
}
