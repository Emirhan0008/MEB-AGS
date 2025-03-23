// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Reduce the maximum number of workers to avoid memory issues
config.maxWorkers = 2;

// Increase the Metro server's heap size
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase memory limit for the bundler
      if (global.gc) {
        global.gc();
      }
      return middleware(req, res, next);
    };
  },
};

// Optimize the resolver
config.resolver = {
  ...config.resolver,
  useWatchman: false, // Disable Watchman to reduce memory usage
};

module.exports = config;