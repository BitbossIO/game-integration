/*
* This is a simple example class representing what would need to be done
* within a game screen code to listen for bet results after the player
* has placed a bet.
*/
class GameUIExample {

    onLoad() {
        // Somewhere in the game UI javascript/typescript startup code set up this event 
        // listener to get the game bet results when they become available.  The parent
        // mobile app will invoke the "betResult" event when it gets the results off of
        // the blockchain.
        window.document.addEventListener('betResult', (evt) => this.handleBetResultEvent(evt), false);
    }

    /*
     * Handler to receive incoming bet result from parent app
     */
    private handleBetResultEvent(evt: any) {
        console.log('bet results', evt.detail);

        // Call the processBetResults() method in the manager class that
        // extends GameManager to process the bet results and prepare data
        // in a format that the game UI understands

        // const betResultUIData: any = GameXYZManager.processBetResults(evt.detail);
    }
}