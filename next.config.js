/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",   // ✅ ADD THIS

  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
        os: false,
      };
    }

    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

module.exports = nextConfig;