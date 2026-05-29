import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { AdSlot } from './AdSlot';

// Three sidebar ad slots, top/middle/bottom. Replace placeholders with
// real AdSense Display ad-unit IDs (one per slot for granular reporting).
const SLOT_TOP = 'SIDEBAR_SLOT_TOP_PLACEHOLDER';
const SLOT_MID = 'SIDEBAR_SLOT_MID_PLACEHOLDER';
const SLOT_BOT = 'SIDEBAR_SLOT_BOT_PLACEHOLDER';

// Web-only, desktop-only persistent right-sidebar with 3 standard AdSense
// 300x250 display ads. Same layout pattern 247blackjack / casual.com use.
// On mobile / tablet (width < SIDEBAR_MIN_WIDTH) it renders nothing — those
// viewports rely on Auto Ads + the in-article placements on content pages.
const SIDEBAR_MIN_WIDTH = 1280;

export function SidebarAds() {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return null;
  if (width < SIDEBAR_MIN_WIDTH) return null;

  return (
    <View style={styles.sidebar} pointerEvents="box-none">
      <AdSlot slot={SLOT_TOP} width={300} height={250} />
      <AdSlot slot={SLOT_MID} width={300} height={250} />
      <AdSlot slot={SLOT_BOT} width={300} height={250} />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    ...(Platform.OS === 'web'
      ? { position: 'fixed' as any, right: 16, top: 80 }
      : { position: 'absolute', right: 16, top: 80 }),
    width: 320,
    alignItems: 'center',
    gap: 12,
    zIndex: 5, // below modals (1000) and the top bar (30), above the table
  },
});
