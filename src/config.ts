interface IConfig {
  walletUrl: string,
  walletKey: string,
  walletSed: string,
}

export const getConfig = (): IConfig => {
  if (!process.env.WALLET_URL) {
    throw 'Not set WALLET_URL';
  }

  if (!process.env.WALLET_KEY) {
    throw 'Not set WALLET_KEY';
  }

  if (!process.env.WALLET_SED) {
    throw 'No WALLET_SED';
  }

  return {
    walletUrl: process.env.WALLET_URL,
    walletKey: process.env.WALLET_KEY,
    walletSed: process.env.WALLET_SED,
  };
}