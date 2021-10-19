interface IConfig {
  walletUrl: string,
}
export const getConfig = (): IConfig => {
  if (!process.env.WALLET_URL) {
    throw 'Not set WALLET_URL';
  }

  return {
    walletUrl: process.env.WALLET_URL,
  };
}