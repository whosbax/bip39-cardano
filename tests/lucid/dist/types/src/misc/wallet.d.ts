import { Address, Core, KeyHash, Network, PrivateKey, RewardAddress, UTxO } from "../mod.js";
declare type FromSeed = {
    address: Address;
    rewardAddress: RewardAddress | null;
    paymentKey: PrivateKey;
    stakeKey: PrivateKey | null;
};
export declare function walletFromSeed(seed: string, options?: {
    addressType?: "Base" | "Enterprise";
    accountIndex?: number;
    network?: Network;
}): FromSeed;
export declare function discoverOwnUsedTxKeyHashes(tx: Core.Transaction, ownKeyHashes: Array<KeyHash>, ownUtxos: Array<UTxO>): Array<KeyHash>;
export {};
