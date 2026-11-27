/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Resumes up to 4 MB are uploaded through a Server Action (default limit is 1 MB).
      // Vercel caps request bodies at 4.5 MB.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
