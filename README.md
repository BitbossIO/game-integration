# BitBoss Gaming Platform Content Integration
![BitBoss Logo](https://user-images.githubusercontent.com/2952481/71929859-c8dc0680-3157-11ea-8335-27979acd2d40.png)

## Overview
This document describes how a content provider integrates an html5 game into the BitBoss mobile wallet application.  The BitBoss app runs on Android and iOS.  It launches games within a webview and therefore the game must be built with html5 and javascript/typescript.  Our app communicates with the game using DOM window events.

Here is a demo that we created using Bitcoin SV and Tokenized to place bets on the blockchain with tokens.  It shows a simple mobile app with a html5 embedded baccarat game being launched.  Our initial integration with content providers will use native BSV, but the concept is exactly the same.  https://youtu.be/IAMzM7NKsOA

## Architecture
This diagram shows the high level flow in our platform:
![Architecture Overview](https://user-images.githubusercontent.com/2952481/71930124-4273f480-3158-11ea-8c32-c6c90f987c97.png)

* Games are embedded within the BitBoss mobile app
* A game gets balance information from the BitBoss app and it calls the BitBoss app to submit a bet
* The BitBoss mobile app sends bets and funds (BSV) to the blockchain
* A game service specific to a type of game play detects blockchain bet transactions sent to it
* The game service produces randomness and process the bet
* The game service uses an Oracle for external public information such as a lottery drawing result
* The game service calls into a proprietary math model by calling a compiled binary library that is provided to BitBoss by the content provider, for example a model for a Slot game
* The game service sends commissions to the affiliate and content providers
* The casino gets the funds that are not won by the player
* The bet result and any payout (BSV) is sent back to the player’s app via the blockchain

## Client Game
The game implements a “manager” typescript class that extends the GameManager base class shown below.  This is the implementation for communicating between the game and the BitBoss app.  This manager class gets called by the game UI code to do things like:

* Get the player’s current balance (with proper denomination, for example BSV)
* Get the min and max bet limits that are allowed
* Place a bet or set of bets
* Process the bet results once they come back from the blockchain
* Get bet history details
* Get and set favorite bets (if the game supports this functionality, it isn’t required for the integration.
* Exit the game and return to the BitBoss mobile app

The npm package for this GitHub project is located at: https://www.npmjs.com/package/@bitboss/game-integration.  

### GameManager Base Class
This [GameManager](https://github.com/BitbossIO/game-integration/blob/master/src/GameManager.ts) base class contains the fundamental methods required to communicate with the BitBoss app.  It has the bet and history interfaces defined at the top.  The game developer extends this class and overrides the methods as necessary to customize the implementation.

Method | Purpose
------------ | -------------
getBalance | Get the player's balance
getBetConfiguration | Get configuration details such as the minimum and maximum allowed bets
placeBet | Send bet(s) to the Bitboss app to be sumbitted to the blockchain
processBetResults | This method must be overridden, it's used in the callback when receiving bet results
getHistory | Bet history for each bet placed and the corresponding results
saveFavoriteBets | Save favorite bet information in the mobile app local storage
getFavoriteBets | Retreive any stored favorite bets
saveGameState | Saves game specific state data to local storage
getGameState | Retrieves game state data from local storage
clearGameState | Clears all game state data for the game
exitGame | Call this method from the game UI to exit back to the BitBoss app


### Example Game UI Class
The [GameUIExample](https://github.com/BitbossIO/game-integration/blob/master/src/GameUIExample.ts) class shows an example of how to register a callback handler to receive bet results once the BitBoss app receives them from the blockchain.
<br/>
<br/>
<br/>
## Game Service
The game service is a smart contract that reacts to bet transactions sent to its address on the Bitcoin SV blockchain.  BitBoss creates a game service for every game type: Baccarat, Slots, Lottery, Roulette, etc. and deploys high available instances of each required game service that a casino wants to run.

### Oracle Services
The game service processes incoming bets sent to it using RNG that it creates.  It may need to call out to an Oracle service to get external information such as a public lottery drawing result.  

### Content Provider Modules
The game service may also need to invoke a content provider’s proprietary logic that is required to produce the game results.  An example of this would be the math model for a Slot game.   For this case a local web service is configured with the game server that has the ability to call into the content provider’s code/logic which has been compiled into a software module.  The game service sends over the RNG and the content provider’s module returns the game result. 

### Payouts
The game service packages the bet result and a payout (if the player won the bet) and sends in a transaction to the blockchain addressed to the player’s wallet.  The game service will also pay affiliates and content providers their commission when processing each bet.  The content provider will have their own BSV crypto wallet to receive payments.

### Bet Result to Client
The BitBoss mobile app reacts to the bet result transaction and sends it to the embedded game to then show the game result in the UI.  At the same time the player’s crypto wallet balance is updated to show any payouts received.
