/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        formats: ["image/avif", "image/webp"],
    },
    // Keep `/api/orders` as a direct POST target without a 308 slash redirect.
    skipTrailingSlashRedirect: true,
    trailingSlash: true,
    reactStrictMode: true,
};

export default nextConfig;
