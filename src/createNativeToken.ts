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
import config from '../config/testnet-shelley-genesis.json';
import {CoinSelectionWallet} from "cardano-wallet-js/dist/wallet/coin-selection-wallet";
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
    const payer = await getPaymentWallet(walletServer);
    await showWalletInfo(payer);

    // address to hold the minted tokens. You can use which you want.
    const addresses = [(await payer.getAddresses())[0]];

    console.log('policy public/private keypair');
    // console.log('create keypair');
    // const keyPair = Seed.generateKeyPair();
    const bip32PrivateKey = Bip32PrivateKey.from_bytes(Buffer.from(process.env.WALLET_KEY, 'hex'));
    const keyPair: Bip32KeyPair = {
        publicKey: bip32PrivateKey.to_public(),
        privateKey: bip32PrivateKey,
    }

    const policyVKey = keyPair.publicKey;
    // const policySKey = keyPair.privateKey;

    console.log('generate single issuer native script');
    let keyHash = Seed.getKeyHash(policyVKey);
    let script = Seed.buildSingleIssuerScript(keyHash);

    console.log('generate policy id');
    let scriptHash = Seed.getScriptHash(script);
    let policyId = Seed.getPolicyId(scriptHash);
    console.log(`policyId = ${policyId}`);

    console.log('metadata');
    let data: any = {};
    let tokenData: any = {}
    tokenData[policyId] = {
        SealTestOne: {
            name: "SealTestOne",
            description: "Seal Test 1 crypto coin",
            type: "Coin"
        }
    };
    data[0] = tokenData;
    console.dir(data);

    console.log('asset');
    const asset = new AssetWallet(policyId, "SealTestTwo", 1000000);
    console.dir(asset);

    console.log('token');
    const tokens = [new TokenWallet(asset, script, [keyPair])];
    console.log(tokens);

    console.log('scripts');
    const scripts: NativeScript[] = [];
    tokens.forEach(t => {
        if (t?.script) {
            scripts.push(t.script);
        }
    })
    console.dir(scripts);

    console.log('get min ada for address holding tokens');
    let minAda = Seed.getMinUtxoValueWithAssets([asset], config);
    let amounts = [minAda];
    console.dir(amounts);

    console.log('get ttl info');
    let info = await walletServer.getNetworkInformation();
    let ttl = info.node_tip.absolute_slot_number * 12000;
    console.dir(info);
    console.dir(ttl);

    console.log('get coin selection structure (without the assets)');
    const coinSelection: CoinSelectionWallet = await payer.getCoinSelection(addresses, amounts, data);
    console.dir(coinSelection);

    console.dir('add signing keys');
    if (!process.env.WALLET_SED) {
        throw 'No WALLET_SED';
    }
    let rootKey = Seed.deriveRootKey(process.env.WALLET_SED);
    let signingKeys = coinSelection.inputs.map(i => {
        let privateKey = Seed.deriveKey(rootKey, i.derivation_path).to_raw_key();
        return privateKey;
    });
    console.dir(signingKeys);

    console.log('add policy signing keys');
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
    console.dir(metadata);

    console.log('the wallet currently doesn\'t support including tokens not previuosly minted');
    console.log('so we need to include it manually.');
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
    console.log(coinSelection.outputs);

    console.log('we need to sing the tx and calculate the actual fee and the build again');
    console.log('since the coin selection doesnt calculate the fee with the asset tokens included');
    let txBody = Seed.buildTransactionWithToken(coinSelection, ttl, tokens, signingKeys, {data: data, config: config});
    let tx = Seed.sign(txBody, signingKeys, metadata, scripts);
    console.dir(txBody);
    console.dir(tx);

    console.log('submit the tx')
    let signed = Buffer.from(tx.to_bytes()).toString('hex');
    let txId = await walletServer.submitTx(signed);
    console.log(`tx submitted, txId = ${txId}`);
    console.log(`Check Token info on: https://testnet.cardanoscan.io/transaction/${txId}?tab=tokenmint`)

};

main();