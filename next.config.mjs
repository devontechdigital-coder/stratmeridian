/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.0.141'],
  turbopack: {
    root: './',
  },
};

export default nextConfig;
