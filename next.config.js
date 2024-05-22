/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "via.placeholder.com" },
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
      // {
      //   protocol: "https",
      //   hostname: "**",
      //   pathname: "**",
      // },
    ],
  },
};

module.exports = nextConfig;
