const fs = require('node:fs');
const path = require('node:path');

module.exports = function (api) {
  const usageGuideMtime = fs.statSync(path.join(__dirname, 'USAGE.md')).mtimeMs;
  api.cache.using(() => usageGuideMtime);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.md'] }]],
  };
};
