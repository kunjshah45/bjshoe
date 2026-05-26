// Single source of truth for build-time feature flags.
// Flip these to enable / disable surfaces of the app for a particular deploy.

export const FEATURES = {
  // Multiplayer is implemented but paused for the initial solo-only deploy.
  // Re-enable once the server is hosted and reachable from the deployed client.
  multiplayer: false,
};
