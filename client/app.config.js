// Replaces app.json so the web base URL can be driven from an env var at
// build time (GitHub Pages serves project sites under /<repo-name>/, so the
// production build needs experiments.baseUrl set; local dev wants it unset).
//
// Set EXPO_BASE_URL=/blackjack at build time for GH Pages.

const baseUrl = process.env.EXPO_BASE_URL;

module.exports = {
  expo: {
    name: 'client',
    slug: 'client',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    experiments: baseUrl
      ? { baseUrl: baseUrl.replace(/\/$/, '') }
      : undefined,
  },
};
