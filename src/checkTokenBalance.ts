import dotenv from 'dotenv';

import {WalletServer} from 'cardano-wallet-js';
import {showWalletInfo} from "./showWalletInfo";
import {getPaymentWallet} from "./getPaymentWallet";

dotenv.config();

const main = async () => {
    if (!process.env.WALLET_URL) {
        throw 'Not set WALLET_URL';
    }
    if (!process.env.WALLET_KEY) {
        throw 'Not set WALLET_KEY';
    }

    const walletServer = WalletServer.init(process.env.WALLET_URL);
    const wallet = await getPaymentWallet(walletServer);
    await showWalletInfo(wallet);

    console.log('get available balance. The balance you can expend');
    const availableBalance = wallet.getAvailableBalance();
    console.dir(availableBalance);

    console.log('get rewards balance. The balance available to withdraw');
    const rewardBalance = wallet.getRewardBalance();
    console.dir(rewardBalance);

    console.log('get total balance. Total balance is the sum of available balance plus reward balance');
    const totalBalance = wallet.getTotalBalance();
    console.dir(totalBalance);

    const statics = await wallet.getUtxoStatistics();
    console.dir(statics);

    const delegation = wallet.getDelegation();
    console.dir(delegation);

    // TODO: Still not found how check native token balance API. Maybe need to switch wallet lib
}

main();