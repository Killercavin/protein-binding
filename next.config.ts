import CopyPlugin from "copy-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config: import('webpack').Configuration, { isServer }: { isServer: boolean }) {
    config.plugins = config.plugins || [];
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "node_modules/@rdkit/rdkit/dist/RDKit_minimal.wasm",
            to: "static/chunks",
          },
        ],
      }),
    );

    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        fs: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;