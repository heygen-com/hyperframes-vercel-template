/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/render": ["./public/compositions/**/*"],
    "/api/runtime.js": ["./node_modules/@hyperframes/core/dist/hyperframe.runtime.iife.js"],
    "/api/preview": [
      "./public/compositions/**/*",
      "./scripts/bundle-preview.ts",
      "./node_modules/@hyperframes/core/dist/**/*",
      "./node_modules/esbuild/**/*",
      "./node_modules/linkedom/**/*",
      "./node_modules/tsx/**/*",
    ],
    "/api/preview/[...path]": ["./public/compositions/**/*"],
    "/api/preview/comp/[...path]": ["./public/compositions/**/*"],
  },
};

export default nextConfig;
