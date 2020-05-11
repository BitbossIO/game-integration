export interface BetItem {
    q: number;  // quantity -- for submitting a bet this is crypto, for fav bets this is fiat
    b: number[];// bet details
}

// Used to place bets by sending request to parent app
export interface BetRequest {
    d: string;  // game instance id
    t: number; // Time in seconds that bet was submitted from client
    b: BetItem[];
    c: number; // conversion rate displayed to user when bet was placed
    fc: string; // fiat code (ex: USD) in use when bet was placed
    gt: string; // game title for games that have multiple offerings
    pf: string; // provably fair token
}

export interface FavoriteBets {
    i: number; // 0-based index of saved bet
    b: BetItem[];
    sn: number[]; // game table data for recreating fav bet
}

// Results of a bet including cards/dice/wheel/ball result and the payout
export interface BetResult {
    txid: string; // Transaction id of the bet result
    r: any; // results from game service, ex cards drawn from deck
    t: number; // Timestamp for when the result was processed
    d: string; // game instance id
    p: number; // total payout
    pf: number; // total payout in fiat
    gs: any; //A game service can pass back raw json data to game client
}

export interface BetHistoryItem {
    q: number;  // bet quantity in crypto
    c: number;  // conversion rate to fiat
    fs: string; // fiat symbol that was used for bet
    b: number[];// bet details (game specific array of numbers)
    p: number;  // payout for this single bet
}

export interface BetHistoryRequest {
    d: string; // game instance id, for example drawId for lottery
    t: number; // Time in seconds that bet was submitted from client
    b: BetHistoryItem[];
    c: number; // conversion rate displayed to user when bet was placed
    fc: string; // fiat code (ex: USD) in use when bet was placed
    gt: string; // game title
    pf: string; // provably fair token
}

export interface BetHistory {
    txid: string;
    betTime: number;
    error: string; // TODO this might change to an error code number
    assetCode: string;
    assetName: string;
    betRequest: BetHistoryRequest;
    betPayout: number; // Total payout
    betResult: BetResult; // null
}

export interface BetConfig {
    total_maxbet: number; // Total max bet allowed when submitting to blockchain
    minbet: number; // default minimum per bet amount
    maxbet: number; // default maximum per bet amount
    language_code: string; // en-us, zh-cn, zh-hk, etc.
    gameSpecific: any;
}

export interface BetMinMaxOverride {
    betType: number; // Bet Type - this corresponds to a game specific enum value
    minbet: number; // minimum per bet amount for this type
    maxbet: number; // maximum per bet amount for this type
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
            const response = await this.sendMessage("placeBet", betRequest);
            return response.confirm;
        } else {
            return false;
        }
    }

    /* Process the bet results received in the "betResult" event
     * The game UI logic calls the implementation of this method to get bet
     * result data that the game ui understands.
     * BetResult.gameSpecific is used to pass game specific content from a game service
     */
    abstract processBetResults(result: BetResult, gameSpecific: any): any;

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
    public saveFavoriteBets(bets: FavoriteBets[]) {
        if (bets.length > 0) {
            this.sendMessage("saveFavoriteBets", bets);
        }
    }

    /* 
     * Retrieves favorite bets from the parent app
     */
    public async getFavoriteBets(): Promise<FavoriteBets[]> {
        const favBets: FavoriteBets[] = await this.sendMessage("getFavoriteBets", null);
        return favBets;
    }

    /* 
     * Sends game state to the parent, can be anything not stored on blockchain
     * that is ok if lost (for example due to the app being uninstalled)
     */
    public saveGameState(state: any) {
        if (state) {
            this.sendMessage("saveGameState", state);
        }
    }

    /* 
     * Retrieves game state
     */
    public async getGameState(): Promise<any> {
        const state: any = await this.sendMessage("getGameState", null);
        return state;
    }

    /* 
     * Clears out all game state
     */
    public clearGameState() {
        this.sendMessage("clearGameState", {});
    }

    /**
     * Launches specified url in device browser
     * @param url
     */
    public launchURL(url: string) {
        this.sendMessage("launchURL", url);
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
     * Return a proper date value, converting from UTC if flagged
     */
    protected normalizeDate(value: any): number {
        let intValue: number;
        intValue = parseInt(value);

        // If the value doesn't have milliseconds then convert to milliseconds
        if (value <= 1000000000000) {
            intValue = intValue * 1000;
        }

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
