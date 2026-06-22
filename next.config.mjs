/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Project cover images can be any pasted URL (Blob uploads or external
    // links), so allow any https host rather than maintaining an allowlist.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
