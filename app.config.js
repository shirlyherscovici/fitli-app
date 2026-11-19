// Extends app.json. EXPO_BASE_URL is only set by the GitHub Pages build
// (the site lives under /<repo-name>/), so local dev stays at the root.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}) },
});
