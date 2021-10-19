import {getConfig} from '../config';
import {WalletServer} from 'cardano-wallet-js';

export const listWallet = async () => {
    const c = getConfig();
    const walletServer = WalletServer.init(c.walletUrl);
    const wallets = await walletServer.wallets();
    return wallets;
}