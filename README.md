# create-cardano-native-token

Create your own Cardano native token

1. setup cardano-node and cardano-wallet
2. cp `.env.sample` to `.env`, and fill your info
3. run `yarn` to install dependencies
4. create payment wallet `npx ts-node src/createWallet.ts`
5. create token `npx ts-node src/createNativeToken.ts`
6. click the url in the output to check the TX and token info (need wait amount)