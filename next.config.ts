import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/unidades_escolares",
        destination: "/school_units",
      },
    ];
  },
};

export default nextConfig;
