/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Resumes up to 5 MB are uploaded through a Server Action (default limit is 1 MB)
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
