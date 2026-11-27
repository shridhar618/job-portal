/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite (demo mode) loads its Postgres .wasm/.data files from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite", "pglite-prisma-adapter"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@electric-sql/pglite/dist/*.wasm", "./node_modules/@electric-sql/pglite/dist/*.data"],
  },
  experimental: {
    serverActions: {
      // Resumes up to 4 MB are uploaded through a Server Action (default limit is 1 MB).
      // Vercel caps request bodies at 4.5 MB.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
