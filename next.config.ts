import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads font .afm files from disk at runtime — exclude it from
  // webpack bundling so Node can resolve the paths correctly.
  serverExternalPackages: ["pdfkit"],
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: { icon: true },
          },
        ],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
    const fileLoaderRule = (config.module.rules as any[]).find(
      (rule) => rule.test?.test?.(".svg")
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: { and: [/\.(js|ts)x?$/] },
      use: [
        {
          loader: "@svgr/webpack",
          options: { icon: true },
        },
      ],
    });
    return config;
  },
};


export default nextConfig;
