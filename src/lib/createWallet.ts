import dotenv from 'dotenv';
import {Seed, WalletServer} from 'cardano-wallet-js';

export const createWallet = async () => {
    dotenv.config();
    if (!process.env.WALLET_SED) {
        throw 'WALLET_SED not set';
    }
    const recoveryPhrase = process.env.WALLET_SED;
    const walletServer = WalletServer.init('http://localhost:8090/v2');
    let mnemonic_sentence = Seed.toMnemonicList(recoveryPhrase);
    let passphrase = 'tangocrypto';
    let name = 'tangocrypto-wallet';

    await walletServer.createOrRestoreShelleyWallet(name, mnemonic_sentence, passphrase);
};