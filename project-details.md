I want to create a game of blackjack. Game should have all basic blackjack rules. Shuffle randomly and every next card should be random from the remaining set of cards. Give user a real blackjack feel. Make UI attractive and addictive. Use a addictive music.

I want users to spend more time on the website playing this free game. Add Ads logic. Distribute ads in such a way that it does not feels too many ads but also creates revenue.

Reference: https://www.247blackjack.com/

Features: - Player can be anonymous - Player can play along with friends in a room with join code. - Player can play just against dealer

    - Settings
        - Player can have options of choosing how many deck they want to play with(2,4,6,8,10)
        - Dealer hits on soft 17: On / Off (Default on)
        - Ask Insurance: On / Off (Default on)
        - Auto Last Bet: On / Off (Default on)

## 💰 Resolution & Payout Matrix

| Hand Condition               | Outcome                          | Payout Odds        |
| :--------------------------- | :------------------------------- | :----------------- |
| Player Hand > 21             | **Player Bust** (Immediate Loss) | Lose Bet           |
| Dealer Hand > 21             | **Dealer Bust** (Player Wins)    | 1:1                |
| Player Total > Dealer Total  | **Player Wins**                  | 1:1                |
| Dealer Total > Player Total  | **Dealer Wins**                  | Lose Bet           |
| Player Total == Dealer Total | **Push** (Tie)                   | 0:0 (Bet Returned) |
| Initial Hand == 21           | **Natural Blackjack**            | 3:2                |
