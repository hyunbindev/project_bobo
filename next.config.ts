import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // discord.js는 Node.js Gateway 런타임 패키지이므로 Next 서버 번들에 포함하지 않는다.
  serverExternalPackages: ["discord.js"],
};

export default nextConfig;
