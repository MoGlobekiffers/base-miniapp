/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@react-native-async-storage/async-storage'] = require.resolve('./shims/empty.js');
    config.resolve.alias['pino-pretty'] = require.resolve('./shims/empty.js');
    return config;
  },
};
module.exports = nextConfig;
