import type { ConfigContext, ExpoConfig } from "expo/config";

// app.json holds the config. This file only adds the web base path: GitHub Pages serves the
// app from /vadfanskavihandla/, while local dev and native builds serve it from /. The Pages
// workflow sets EXPO_BASE_URL; leaving it unset keeps everything else unchanged.
export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.EXPO_BASE_URL;
  return {
    ...config,
    name: config.name ?? "vadfanskavihandla",
    slug: config.slug ?? "vadfanskavihandla",
    experiments: { ...config.experiments, ...(baseUrl ? { baseUrl } : {}) },
  };
};
