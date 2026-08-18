import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ==========================================
// 🌐 CONFIGURATION FOR LOCAL VS LIVE API
// Uncomment the line for the environment you want to use:

// 💻 LOCAL Setup:
const BACKEND_RAW = "http://localhost:8081/xformwms";
// const BACKEND_RAW = "http://192.168.1.107:8081/xformwms";

// 🌍 LIVE/PRODUCTION Setup:
// const BACKEND_RAW = "https://api-test.richgoldshine.com/xformwms";
// ==========================================

const BACKEND_BASE = BACKEND_RAW ? (BACKEND_RAW.endsWith('/api') ? BACKEND_RAW.replace(/\/api$/, '') : BACKEND_RAW) : null;
const API_ROOT = BACKEND_RAW ? (BACKEND_RAW.endsWith('/api') ? BACKEND_RAW : `${BACKEND_RAW}/api`) : null;
const parsedBackendUrl = BACKEND_BASE ? new URL(BACKEND_BASE) : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: BACKEND_RAW,
  },
  turbopack: {
    root: __dirname,
  },
  devIndicators: false ,
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
  webpack: (config, { isServer }) => {
    // Handle problematic packages
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'jspdf': 'jspdf/dist/jspdf.umd.min.js',
        'html2canvas': 'html2canvas/dist/html2canvas.min.js',
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        url: false,
        util: false,
        assert: false,
        buffer: false,
        process: false,
        child_process: false,
        worker_threads: false,
        fflate: false,
      };
    }
    return config;
  },
};

export default nextConfig;