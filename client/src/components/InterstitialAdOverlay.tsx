import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { AdSlot } from './AdSlot';

// Three slot IDs for the interstitial. Replace each with a real AdSense
// ad-unit ID once you create three "Display ad" units in AdSense → Ads →
// By ad unit. Using three distinct units gives you per-slot reporting.
// Until they're real, the placements reserve visual space but won't fill.
const SLOT_A = 'INTERSTITIAL_SLOT_A_PLACEHOLDER';
const SLOT_B = 'INTERSTITIAL_SLOT_B_PLACEHOLDER';
const SLOT_C = 'INTERSTITIAL_SLOT_C_PLACEHOLDER';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Full-screen overlay containing three standard AdSense display ads + a
// dismissable Close Ad button. Same pattern used by every major casual
// game site (247blackjack, casual.com, etc.). AdSense-compliant because
// chips are granted by the *publisher* on Close, not by Google for viewing
// the ads — there's no incentivized click or reward gate.
export function InterstitialAdOverlay({ visible, onClose }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.adRow}>
          <AdSlot slot={SLOT_A} width={300} height={250} />
          <AdSlot slot={SLOT_B} width={300} height={250} />
          <AdSlot slot={SLOT_C} width={300} height={250} />
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
        <Text style={styles.closeText}>Close Ad ▶</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...(Platform.OS === 'web'
      ? { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0 }
      : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }),
    backgroundColor: '#000',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
