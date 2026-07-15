/** @type {import('next').NextConfig} */

const nextConfig = {
   reactStrictMode: false,

  // Keep heavy server-only packages out of the webpack bundle.
  // googleapis is 97MB — bundling it causes OOM crashes in dev.
  serverExternalPackages: ["googleapis", "google-auth-library"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Also ensure these are treated as externals by webpack directly
      // (for Next 13 pages router compatibility)
      const originalExternals = config.externals || [];
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        "googleapis",
        "google-auth-library",
      ];
    }
    return config;
  },

  images: {
    remotePatterns: [
      { hostname: "via.placeholder.com" },
      { hostname: "s3-alpha-sig.figma.com" },
      { hostname: "res.cloudinary.com" },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      { hostname: "miro.medium.com" },
      { hostname: "images.ctfassets.net" },
      // {
      //   protocol: "https",
      //   hostname: "**",
      //   pathname: "**",
      // },
    ],
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
