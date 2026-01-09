import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NextConfig } from 'next';

// Backend URL for development rewrites (when not using Kong/ingress)
// In production with Kong, these rewrites are bypassed - Kong routes /api/* to backend
const BACKEND_URL = process.env.SIBYL_BACKEND_URL || 'http://localhost:3334';

// Read version from root VERSION file
function getVersion(): string {
  try {
    const baseVersion = readFileSync(join(__dirname, '../../VERSION'), 'utf8').trim();

    // Check if we're on a release tag
    try {
      const tag = execSync('git describe --tags --exact-match HEAD 2>/dev/null', {
        encoding: 'utf8',
      }).trim();
      if (tag.startsWith('v')) {
        return baseVersion; // Release build
      }
    } catch {
      // Not on a tag - dev build
    }

    // Dev build: append git hash
    try {
      const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      return `${baseVersion}+g${hash}`;
    } catch {
      return baseVersion;
    }
  } catch {
    return '0.0.0';
  }
}

const SIBYL_VERSION = getVersion();

const nextConfig: NextConfig = {
  // Enable React Compiler for automatic memoization
  reactCompiler: true,

  // Standalone output for Docker deployment
  output: 'standalone',

  // Inject version at build time
  env: {
    NEXT_PUBLIC_VERSION: SIBYL_VERSION,
  },

  // Proxy API requests to the Sibyl backend during local development
  // Note: When deployed behind Kong/ingress, routing is handled externally
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/ws',
        destination: `${BACKEND_URL}/api/ws`,
      },
    ];
  },
};

export default nextConfig;
