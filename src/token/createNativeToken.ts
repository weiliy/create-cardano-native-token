import dotenv from 'dotenv';
import {
    AssetWallet,
    Bip32KeyPair,
    Bip32PrivateKey,
    NativeScript,
    Seed,
    TokenWallet,
    WalletsAssetsAvailable,
    WalletServer
} from 'cardano-wallet-js';
import {CoinSelectionWallet} from "cardano-wallet-js/dist/wallet/coin-selection-wallet";

import config from '../../config/testnet-shelley-genesis.json';
import {showWalletInfo} from "../lib/showWalletInfo";
import {getPaymentWallet} from "../lib/getPaymentWallet";
import {getConfig} from "../config";

dotenv.config();

export const createToken = async (tokenName: string, tokenDescription: string, tokenAmount: number) => {
    const c = getConfig()

    const walletServer = WalletServer.init(c.walletUrl);
    const payer = await getPaymentWallet(walletServer);
    await showWalletInfo(payer);

    // address to hold the minted tokens. You can use which you want.
    const addresses = [(await payer.getAddresses())[0]];

    // policy public/private keypair
    const bip32PrivateKey = Bip32PrivateKey.from_bytes(Buffer.from(c.walletKey, 'hex'));
    const keyPair: Bip32KeyPair = {
        publicKey: bip32PrivateKey.to_public(),
        privateKey: bip32PrivateKey,
    }

    const policyVKey = keyPair.publicKey;

    // generate single issuer native script
    let keyHash = Seed.getKeyHash(policyVKey);
    let script = Seed.buildSingleIssuerScript(keyHash);

    // generate policy id
    let scriptHash = Seed.getScriptHash(script);
    let policyId = Seed.getPolicyId(scriptHash);

    let data: any = {};
    let tokenData: any = {}
    tokenData[policyId] = {
        [tokenName]: {
            name: tokenName,
            description: tokenDescription,
            type: "Coin"
        }
    };
    data[0] = tokenData;

    const asset = new AssetWallet(policyId, tokenName, tokenAmount);
    console.dir(asset);

    const tokens = [new TokenWallet(asset, script, [keyPair])];
    console.log(tokens);

    const scripts: NativeScript[] = [];
    tokens.forEach(t => {
        if (t?.script) {
            scripts.push(t.script);
        }
    })

    // get min ada for address holding tokens
    let minAda = Seed.getMinUtxoValueWithAssets([asset], config);
    let amounts = [minAda];

    // get ttl info
    let info = await walletServer.getNetworkInformation();
    let ttl = info.node_tip.absolute_slot_number * 12000;

    // 'get coin selection structure (without the assets)'
    const coinSelection: CoinSelectionWallet = await payer.getCoinSelection(addresses, amounts, data);

    // add signing keys
    let rootKey = Seed.deriveRootKey(c.walletSed);
    let signingKeys = coinSelection.inputs.map(i => {
        let privateKey = Seed.deriveKey(rootKey, i.derivation_path).to_raw_key();
        return privateKey;
    });

    // add policy signing keys
    tokens
        .filter(t => t.scriptKeyPairs)
        .forEach(t => {
            if (t.scriptKeyPairs !== undefined) {
                signingKeys.push(
                    ...t.scriptKeyPairs.map(k =>
                        k.privateKey.to_raw_key()))
            }
        });

    let metadata = Seed.buildTransactionMetadata(data);

    // the wallet currently doesn\'t support including tokens not previuosly minted
    // so we need to include it manually.
    coinSelection.outputs = coinSelection.outputs.map(output => {
        if (output.address === addresses[0].address) {
            output.assets = tokens.map(t => {
                const asset: WalletsAssetsAvailable = {
                    policy_id: t.asset.policy_id,
                    asset_name: Buffer.from(t.asset.asset_name).toString('hex'),
                    quantity: t.asset.quantity
                };
                console.dir(asset);
                return asset;
            });
        }
        return output;
    });

    // we need to sing the tx and calculate the actual fee and the build again
    // since the coin selection doesnt calculate the fee with the asset tokens included
    let txBody = Seed.buildTransactionWithToken(coinSelection, ttl, tokens, signingKeys, {data: data, config: config});
    let tx = Seed.sign(txBody, signingKeys, metadata, scripts);

    // submit the tx
    let signed = Buffer.from(tx.to_bytes()).toString('hex');
    let txId = await walletServer.submitTx(signed);
    console.log(`tx submitted, txId = ${txId}`);
    console.log(`Check Token info on: https://testnet.cardanoscan.io/transaction/${txId}?tab=tokenmint`)

    return {
        txId,
        url: `https://testnet.cardanoscan.io/transaction/${txId}?tab=tokenmint`,
    }
};