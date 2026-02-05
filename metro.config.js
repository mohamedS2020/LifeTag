const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  
  // Add 'cjs' to source extensions
  config.resolver.sourceExts.push('cjs');
  
  // Disable package exports if needed
  config.resolver.unstable_enablePackageExports = false;
  
  // Ensure font files are treated as assets
  config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');
  
  return config;
})();