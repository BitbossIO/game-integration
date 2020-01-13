export interface BetItem {
    q: number;  // quantity
    b: number[];// bet details
}

// Used to send request back to parent
export interface BetRequest {
    d: string;  // game instance id
    b: BetItem[];
}

export interface BetResult {
    draw: any;
    payout: number;
}

export interface BetHistoryItem {
    q: number;  // bet quantity
    b: number[];// bet details (game specific array of numbers)
    p: number;  // payout for this single bet
    ps: string; // payout status
}

export interface BetHistoryRequest {
    d: string; // game instance id, for example drawId for lottery
    b: BetHistoryItem[];
}

export interface BetHistory {
    txid: string;
    betTime: number;
    assetCode: string;
    assetName: string;
    betRequest: BetHistoryRequest;
    betPayout: number; // Total payout
    betResult: any; // null
}

export interface BetConfig {
    minbet: number;
    maxbet: number;
    gameSpecific: any; // For Roulette the gameSpecific.isAmericanRoulette field is populated
}

export class BalanceInfo {
    balance: number;
    assetCode: string;
    assetName: string;

    constructor(bal: number) {
        this.balance = bal;
        this.assetCode = 'BSV';
        this.assetName = 'BSV';
    }
}


export abstract class GameManager {
    g_cachedBetHistory: BetHistory[] = [];

    constructor() {
    }

    /*
     * Get the player balance from the parent app
     */
    public async getBalance(): Promise<BalanceInfo> {
        const balance: BalanceInfo = await this.sendMessage("getBalance", null);
        return balance;
    }

    /* 
     * Gets the min and max bet amounts from the parent app and
     * any game specific data
     */
    public async getBetConfiguration(): Promise<BetConfig> {
        return await this.sendMessage("getBetConfig", null);
    }

    /* 
     * Sends the bet details to the parent app
     */
    public async placeBet(betRequest: BetRequest): Promise<boolean> {
        if (betRequest.b.length > 0) {
            const response = await this.sendMessage("placeBet", JSON.stringify(betRequest));
            return response.confirm;
        } else {
            return false;
        }
    }

    /* Process the bet results received in the "betResult" event (see bottom of this file)
     * Converts the bet results into data that the game ui understands
     * The game UI logic calls this method to get 
     */
    abstract processBetResults(results: BetResult[], gameSpecific: any): any;

    /*
     * Retrieves history data from parent app.  Derived class can override to customize the
     * data returned to the game UI if necessary.
     */
    public async getHistory(forceRefresh: boolean): Promise<BetHistory[]> {
        // Used cached data if available
        if (!forceRefresh && this.g_cachedBetHistory.length > 0) {
            return this.g_cachedBetHistory;
        }

        const historyData: BetHistory[] = await this.sendMessage("getHistory", null);
        this.g_cachedBetHistory = historyData;
        return historyData;
    }

    /* 
     * Uses sendMessage to send the favorite bet list to the parent app
     * for storage.  The parent app overwrites any previously saved favorites
     */
    public saveFavoriteBets(bets: BetRequest[]) {
        if (bets.length > 0) {
            this.sendMessage("saveFavoriteBets", JSON.stringify(bets));
        }
    }

    /* 
     * Retrieves favorite bets from the parent app
     */
    public async getFavoriteBets(): Promise<BetRequest[]> {
        const favBets: BetRequest[] = await this.sendMessage("getFavoriteBets", null);
        return favBets;
    }

    /*
     * Called by the game screen exit/home button to tell the parent app
     * to hide the game
     */
    public async exitGame() {
        await this.sendMessage("exitGame", null);
        return;
    }

    /* 
    * Return the value converted to an integer in seconds
    */
    protected getDateValueInSeconds(value: any): number {
        let intValue: number;
        intValue = parseInt(value);

        // If the value contains ms convert to seconds
        if (value > 1000000000000)
            return intValue / 1000;
        else
            return intValue;
    }

    /**
     * Dispatch event to parent windows
     * @param path 
     * @param data 
     */
    protected sendMessage(path: string, data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let message: any = {};
            message.data = data;
            message.resolve = resolve;
            message.reject = reject;
            var event = new CustomEvent(path, { detail: message });
            window.parent.document.dispatchEvent(event);
        });
    }
}
