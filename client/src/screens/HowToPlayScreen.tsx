import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

interface HowToPlayScreenProps {
  onBack: () => void;
}

export function HowToPlayScreen({ onBack }: HowToPlayScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📖 How to Play</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 The Goal</Text>
          <Text style={styles.text}>
            Get your hand as close to <Text style={styles.bold}>21</Text> as possible without going over. Beat the dealer's hand to win!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🃏 Card Values</Text>
          <Text style={styles.text}>
            • Number cards (2-10): Face value{'\n'}
            • Face cards (J, Q, K): 10{'\n'}
            • Ace: 11 or 1 (whichever helps you most)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Your Actions</Text>
          <View style={styles.actionItem}>
            <Text style={styles.actionName}>Hit</Text>
            <Text style={styles.actionDesc}>Take another card</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionName}>Stand</Text>
            <Text style={styles.actionDesc}>Keep your current hand</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionName}>Double</Text>
            <Text style={styles.actionDesc}>Double your bet, take one more card</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionName}>Split</Text>
            <Text style={styles.actionDesc}>Split a pair into two hands</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionName}>Surrender</Text>
            <Text style={styles.actionDesc}>Give up half your bet, end the hand</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Insurance</Text>
          <Text style={styles.text}>
            When the dealer shows an Ace, you can take insurance (up to half your bet). If the dealer has Blackjack, insurance pays 2:1.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Winning & Payouts</Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>Blackjack</Text> (Ace + 10-value): Pays 3:2{'\n'}
            • <Text style={styles.bold}>Win</Text>: Pays 1:1 (even money){'\n'}
            • <Text style={styles.bold}>Push</Text> (tie): Bet returned{'\n'}
            • <Text style={styles.bold}>Loss</Text>: Lose your bet
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Tips</Text>
          <Text style={styles.text}>
            • Always stand on 17 or higher{'\n'}
            • Hit on 11 or lower{'\n'}
            • Double down on 10 or 11 when dealer shows weak card{'\n'}
            • Never split 5s or 10s{'\n'}
            • Always split Aces and 8s
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Multiplayer</Text>
          <Text style={styles.text}>
            Create a room and share the code with friends (up to 7 players). The host starts each round. If you run out of chips, you can spectate or claim free chips in solo mode.
          </Text>
        </View>

        <TouchableOpacity style={styles.backButtonBottom} onPress={onBack}>
          <Text style={styles.backButtonBottomText}>Got it! Let's Play →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fcd34d',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  actionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    flex: 1,
  },
  actionDesc: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 2,
    textAlign: 'right',
  },
  backButtonBottom: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonBottomText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
