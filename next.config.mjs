/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: "export",  // DISABLED: We need a Node.js server for API routes and Supabase RPC
    images: {
        unoptimized: true,
    },
    // Keep `/api/orders` as a direct POST target without a 308 slash redirect.
    skipTrailingSlashRedirect: true,
    trailingSlash: true,
    reactStrictMode: true,
};

export default nextConfig;
