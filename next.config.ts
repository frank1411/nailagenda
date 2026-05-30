import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,

  // Exclude unnecessary files from standalone output to reduce package size
  outputFileTracingExcludes: {
    '*': [
      // Project files not needed in production
      'skills/**/*',
      'examples/**/*',
      'agent-ctx/**/*',
      'download/**/*',
      'src/**/*',
      '.zscripts/**/*',
      'mini-services/**/*',
      'presentations/**/*',
      'Dockerfile',
      'docker-compose.yml',
      'vercel.json',
      'eslint.config.mjs',
      'tailwind.config.ts',
      'tsconfig.json',
      'components.json',
      'postcss.config.mjs',
      'package-lock.json',
      'bun.lock',
      'worklog.md',
      'start-server.sh',
      'next.config.ts',
      'dev.log',
      'server.log',
      'package.json',
      '.env',
      '.env.example',
      '.gitignore',
      '.git/**/*',
      // Heavy dev-only modules
      'node_modules/typescript/**/*',
      'node_modules/eslint/**/*',
      'node_modules/@tailwindcss/**/*',
      'node_modules/sharp/**/*',
      'node_modules/@img/**/*',
      'node_modules/pptxgenjs/**/*',
      'node_modules/react-icons/**/*',
      'node_modules/react-syntax-highlighter/**/*',
      'node_modules/@mdxeditor/**/*',
      'node_modules/z-ai-web-dev-sdk/**/*',
      // Presentation files
      'GlamCRM-Presentacion.*',
      'MayeNailsArt-Presentacion.*',
      '*.pptx',
      '*.pdf',
    ],
  },

  // Use unoptimized images since we removed sharp
  images: {
    unoptimized: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
