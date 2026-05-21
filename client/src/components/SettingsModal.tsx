import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSettingsStore, AppSettings } from '../store/settingsStore';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isHost?: boolean; // Only host can change game rules
}

const DECK_OPTIONS: Array<2 | 4 | 6 | 8 | 10> = [2, 4, 6, 8, 10];
const ANIMATION_SPEEDS: Array<AppSettings['animationSpeed']> = ['normal', 'fast', 'instant'];

export function SettingsModal({ visible, onClose, isHost = false }: SettingsModalProps) {
  const settings = useSettingsStore();

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderToggle = (
    label: string,
    value: boolean,
    onChange: (value: boolean) => void,
    disabled = false
  ) => (
    <View style={styles.row}>
      <Text style={[styles.label, disabled && styles.disabled]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#334155', true: '#10b981' }}
        thumbColor={value ? '#f8fafc' : '#94a3b8'}
      />
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Game Rules Section - Only host can change */}
            {renderSection(
              '🎮 Game Rules' + (isHost ? '' : ' (Host Only)'),
              <>
                <View style={styles.row}>
                  <Text style={[styles.label, !isHost && styles.disabled]}>Number of Decks</Text>
                  <View style={styles.deckOptions}>
                    {DECK_OPTIONS.map((count) => (
                      <TouchableOpacity
                        key={count}
                        style={[
                          styles.deckButton,
                          settings.deckCount === count && styles.deckButtonActive,
                          !isHost && styles.deckButtonDisabled,
                        ]}
                        onPress={() => isHost && settings.setDeckCount(count)}
                        disabled={!isHost}
                      >
                        <Text
                          style={[
                            styles.deckButtonText,
                            settings.deckCount === count && styles.deckButtonTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {renderToggle(
                  'Dealer Hits on Soft 17',
                  settings.dealerHitsSoft17,
                  settings.setDealerHitsSoft17,
                  !isHost
                )}

                {renderToggle(
                  'Ask Insurance',
                  settings.askInsurance,
                  settings.setAskInsurance,
                  !isHost
                )}

                {renderToggle(
                  'Auto Last Bet',
                  settings.autoLastBet,
                  settings.setAutoLastBet,
                  !isHost
                )}
              </>
            )}

            {/* Audio Section */}
            {renderSection(
              '🔊 Audio',
              <>
                {renderToggle('Sound Effects', settings.soundEffects, settings.setSoundEffects)}
                {renderToggle('Background Music', settings.backgroundMusic, settings.setBackgroundMusic)}

                <View style={styles.volumeContainer}>
                  <Text style={styles.label}>Music Volume: {settings.musicVolume}%</Text>
                  <View style={styles.volumeButtons}>
                    {[0, 25, 50, 75, 100].map((vol) => (
                      <TouchableOpacity
                        key={vol}
                        style={[
                          styles.volumeButton,
                          settings.musicVolume === vol && styles.volumeButtonActive,
                        ]}
                        onPress={() => settings.setMusicVolume(vol)}
                      >
                        <Text
                          style={[
                            styles.volumeButtonText,
                            settings.musicVolume === vol && styles.volumeButtonTextActive,
                          ]}
                        >
                          {vol}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Animation Section */}
            {renderSection(
              '✨ Animation',
              <View style={styles.row}>
                <Text style={styles.label}>Animation Speed</Text>
                <View style={styles.speedOptions}>
                  {ANIMATION_SPEEDS.map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.speedButton,
                        settings.animationSpeed === speed && styles.speedButtonActive,
                      ]}
                      onPress={() => settings.setAnimationSpeed(speed)}
                    >
                      <Text
                        style={[
                          styles.speedButtonText,
                          settings.animationSpeed === speed && styles.speedButtonTextActive,
                        ]}
                      >
                        {speed.charAt(0).toUpperCase() + speed.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Reset Button */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={settings.resetToDefaults}
            >
              <Text style={styles.resetButtonText}>↺ Reset to Defaults</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#f8fafc',
    fontSize: 14,
  },
  disabled: {
    color: '#64748b',
  },
  deckOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  deckButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  deckButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  deckButtonDisabled: {
    opacity: 0.5,
  },
  deckButtonText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  deckButtonTextActive: {
    color: '#fff',
  },
  volumeValue: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  volumeContainer: {
    marginBottom: 12,
  },
  volumeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  volumeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  volumeButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  volumeButtonText: {
    color: '#f8fafc',
    fontSize: 12,
  },
  volumeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  speedOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  speedButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  speedButtonText: {
    color: '#f8fafc',
    fontSize: 12,
  },
  speedButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#f8fafc',
    fontSize: 14,
  },
});
