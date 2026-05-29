import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { AdSlot } from './AdSlot';

// Three sidebar ad slots, top/middle/bottom. These reuse the three Display
// ad units (ad1/ad2/ad3) — same units are shared with the interstitial since
// the two never render on the same page at once.
const SLOT_TOP = '7717467825';
const SLOT_MID = '9467183671';
const SLOT_BOT = '6453477290';

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
