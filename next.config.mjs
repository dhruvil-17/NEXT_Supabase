/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gicidbtancsucqynxfha.supabase.co",
      },
    ],
  },
};

export default nextConfig;
