import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  outputFileTracingRoot: path.join(currentDir, '../..'),
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      react$: path.join(currentDir, 'node_modules/react'),
      'react/jsx-runtime$': path.join(currentDir, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime$': path.join(currentDir, 'node_modules/react/jsx-dev-runtime.js'),
      'react-dom$': path.join(currentDir, 'node_modules/react-dom'),
      'react-dom/client$': path.join(currentDir, 'node_modules/react-dom/client.js'),
      'react-reconciler$': path.join(currentDir, 'node_modules/react-reconciler'),
    };

    return config;
  },
};

export default nextConfig;
