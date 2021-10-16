import {WalletServer} from "cardano-wallet-js";

export const getPaymentWallet = async (walletServer: WalletServer) => {
    // use the first wallet as payment wallet
    const [wallet] = await walletServer.wallets();

    return await walletServer.getShelleyWallet(wallet.id);
}