import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  visible: boolean;
  onClaim: () => void;
}

export function OutOfChipsModal({ visible, onClaim }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>💸</Text>
          <Text style={styles.title}>Out of Chips</Text>
          <Text style={styles.subtitle}>The house always wins eventually. Want to keep playing?</Text>
          <TouchableOpacity style={styles.button} onPress={onClaim}>
            <Text style={styles.buttonText}>Claim 1,000 free chips</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
