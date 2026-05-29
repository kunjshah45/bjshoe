import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InterstitialAdOverlay } from './InterstitialAdOverlay';

interface Props {
  visible: boolean;
  onClaim: () => void;
}

// Two-step flow:
//   1. Out-of-chips modal opens with a single "Get 1,000 free chips" button.
//   2. User clicks it → full-screen interstitial ad overlay (3 AdSense
//      display slots + Close Ad button) takes over the screen.
//   3. User clicks "Close Ad" → chips granted, overlay + modal close.
// Chips are NOT gated on ad viewing — onClaim fires on the close button,
// not after a timer or an ad-fill event. Stays inside AdSense TOS while
// putting ads in front of users at the highest-attention moment.
export function OutOfChipsModal({ visible, onClaim }: Props) {
  const [showAd, setShowAd] = useState(false);

  // Reset to step 1 whenever the modal reopens.
  useEffect(() => {
    if (!visible) setShowAd(false);
  }, [visible]);

  const handleGetChips = () => setShowAd(true);
  const handleCloseAd = () => {
    setShowAd(false);
    onClaim();
  };

  return (
    <>
      <Modal visible={visible && !showAd} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.emoji}>💸</Text>
            <Text style={styles.title}>Out of Chips</Text>
            <Text style={styles.subtitle}>The house always wins eventually. Want to keep playing?</Text>
            <TouchableOpacity style={styles.button} onPress={handleGetChips}>
              <Text style={styles.buttonText}>Get 1,000 free chips</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <InterstitialAdOverlay visible={visible && showAd} onClose={handleCloseAd} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#1e293b', padding: 28, borderRadius: 16, alignItems: 'center', maxWidth: 360, width: '100%', borderWidth: 2, borderColor: '#10b981' },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#10b981', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
  buttonText: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold' },
});
