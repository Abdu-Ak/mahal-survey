import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  experimental: {
    cpus: 1,
    useTypeScriptCli: false,
  },
};

export default nextConfig;
