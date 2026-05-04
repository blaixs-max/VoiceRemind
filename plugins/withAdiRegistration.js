const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAdiRegistration = (config, { token } = {}) => {
  if (!token) {
    throw new Error('withAdiRegistration: missing required `token` option');
  }
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const assetsDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets'
      );
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(
        path.join(assetsDir, 'adi-registration.properties'),
        token
      );
      return cfg;
    },
  ]);
};

module.exports = withAdiRegistration;
