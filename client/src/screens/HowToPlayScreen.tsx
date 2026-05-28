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
          <Text style={styles.sectionTitle}>🤚 Hard vs Soft Hands</Text>
          <Text style={styles.text}>
            A <Text style={styles.bold}>soft hand</Text> contains an Ace counted as 11 (e.g. A+6 = soft 17). You can't bust on your next hit — the Ace just becomes 1.{'\n\n'}
            A <Text style={styles.bold}>hard hand</Text> has no Ace, or an Ace forced to count as 1 (e.g. A+6+10 = hard 17). Hitting a hard 12+ risks busting.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Basic Strategy (Cheat Sheet)</Text>
          <Text style={styles.text}>
            The mathematically optimal play depends only on your hand vs. the dealer's up-card. Memorize these:{'\n\n'}
            <Text style={styles.bold}>Always:</Text>{'\n'}
            • Split Aces and 8s{'\n'}
            • Stand on hard 17+{'\n'}
            • Hit on 8 or less{'\n\n'}
            <Text style={styles.bold}>Never:</Text>{'\n'}
            • Split 5s or 10s{'\n'}
            • Take insurance (long-term loser){'\n\n'}
            <Text style={styles.bold}>Dealer up-card matters:</Text>{'\n'}
            • Dealer shows 2-6 (weak): stand more, double more{'\n'}
            • Dealer shows 7-A (strong): hit until you have 17+{'\n'}
            • Hard 12 vs dealer 4-6: stand. Otherwise hit.{'\n'}
            • Soft 18 vs dealer 9, 10, or A: hit
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎲 Rule Variations</Text>
          <Text style={styles.text}>
            Different casinos use different rules. The biggest differences:{'\n\n'}
            • <Text style={styles.bold}>Dealer hits soft 17 (H17)</Text> vs stands on soft 17 (S17). H17 favors the house slightly.{'\n'}
            • <Text style={styles.bold}>Number of decks</Text> (1, 2, 4, 6, 8). More decks = higher house edge.{'\n'}
            • <Text style={styles.bold}>Blackjack pays 3:2</Text> (good) vs 6:5 (bad — avoid these tables).{'\n'}
            • <Text style={styles.bold}>Surrender allowed</Text> — late surrender (after dealer checks for BJ) gives you an escape on bad hands.{'\n'}
            • <Text style={styles.bold}>Double after split</Text> — boosts player edge slightly.{'\n\n'}
            bjshoe offers all of these as configurable settings (deck count, dealer rule on soft 17, insurance offer). Default is 6 decks, H17, insurance on.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎬 How a Round Plays</Text>
          <Text style={styles.text}>
            1. Place your bet (minimum $10){'\n'}
            2. You and the dealer each get 2 cards — yours both face up, dealer's second face down{'\n'}
            3. If the dealer shows an Ace, you're offered insurance{'\n'}
            4. Take your actions: hit, stand, double, split, or surrender{'\n'}
            5. When you stand or bust, the dealer reveals their hole card and draws until 17+{'\n'}
            6. Hands are compared and payouts settled{'\n'}
            7. Next round starts automatically after a brief pause
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ FAQ</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Is bjshoe free?{'\n'}</Text>
            Yes — completely free, no account needed, no real money involved. Chips are virtual and reset to 1,000 anytime you run out.{'\n\n'}
            <Text style={styles.bold}>Can I play on mobile?{'\n'}</Text>
            Yes, the site is responsive and works in any modern mobile browser.{'\n\n'}
            <Text style={styles.bold}>Is the shuffle fair?{'\n'}</Text>
            The shoe is shuffled with a standard Fisher-Yates algorithm using the browser's cryptographic random source. In solo mode the shoe lives in your own browser; in multiplayer it lives on the server.{'\n\n'}
            <Text style={styles.bold}>Can I count cards?{'\n'}</Text>
            The shoe reshuffles every round in solo mode (deck penetration is high), so counting won't give you a meaningful edge here. If you want to learn the Hi-Lo system properly, we wrote a full guide at{' '}
            {/* @ts-ignore — href is supported by react-native-web on Text */}
            <Text accessibilityRole="link" href="/card-counting/" style={styles.link}>/card-counting/</Text>.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 A Brief History</Text>
          <Text style={styles.text}>
            Blackjack — also called "21" — traces back to a French game called <Text style={styles.bold}>Vingt-et-Un</Text> ("twenty-one") in the 1700s. It spread to American casinos in the early 1900s, where bonuses for hands containing the Ace of Spades and a black Jack gave the game its modern name.{'\n\n'}
            Blackjack is one of the only widely-offered casino games where skilled play meaningfully reduces the house edge — typically to under 1% with perfect basic strategy.
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
  link: {
    color: '#60a5fa',
    textDecorationLine: 'underline',
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
