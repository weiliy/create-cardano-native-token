import {ShelleyWallet} from "cardano-wallet-js";

export const showWalletInfo = async (wallet: ShelleyWallet) => {
    console.log('################## Wallet Info #####################');
    const totalBalance = wallet.getAvailableBalance();
    const addresses = await wallet.getAddresses();
    console.log(`totalBalance = ${totalBalance}`);
    for (let i = 0; i < 10; i++) {
        console.log(`address ${i}      = ${addresses[i].id}`);
    }
    console.log('####################################################');
}