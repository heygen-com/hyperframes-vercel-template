/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/render": ["./public/compositions/**/*"],
    "/api/preview": ["./public/compositions/**/*"],
    "/api/preview/[...path]": ["./public/compositions/**/*"],
    "/api/preview/comp/[...path]": ["./public/compositions/**/*"],
  },
};

export default nextConfig;
