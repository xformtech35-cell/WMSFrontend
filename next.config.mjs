import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ==========================================
// 🌐 CONFIGURATION FOR LOCAL VS LIVE API
// Uncomment the line for the environment you want to use:

// 💻 LOCAL Setup:
// const BACKEND_RAW = "http://localhost:8081/xformwms";

// 🌍 LIVE/PRODUCTION Setup:
const BACKEND_RAW = "https://api-test.richgoldshine.com/xformwms";
// ==========================================

const BACKEND_BASE = BACKEND_RAW ? (BACKEND_RAW.endsWith('/api') ? BACKEND_RAW.replace(/\/api$/, '') : BACKEND_RAW) : null;
const API_ROOT = BACKEND_RAW ? (BACKEND_RAW.endsWith('/api') ? BACKEND_RAW : `${BACKEND_RAW}/api`) : null;
const parsedBackendUrl = BACKEND_BASE ? new URL(BACKEND_BASE) : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  env: {
    // This injects BACKEND_RAW as process.env.NEXT_PUBLIC_API_URL in browser files
    NEXT_PUBLIC_API_URL: BACKEND_RAW,
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    if (!API_ROOT) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${API_ROOT}/:path*`,
      },
      {
        source: '/xformwms/api/:path*',
        destination: `${API_ROOT}/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: parsedBackendUrl
      ? [
          {
            protocol: parsedBackendUrl.protocol.replace(':', ''),
            hostname: parsedBackendUrl.hostname,
            port: parsedBackendUrl.port || '',
          },
        ]
      : [],
  },
};

export default nextConfig;
