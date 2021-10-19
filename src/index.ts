import express from 'express';
import dotenv from "dotenv";
import {listWallet} from "./wallet";

const app = express();
const port = 8080;

app.listen(port, () => {
  console.log(`app run on port: 8080`);
  dotenv.config();
});

app.get('/', (_req, res) => {
  res.send('Well done!');
});

app.get('/wallet', async (_req, res) => {
  try {
    const walletList = await listWallet();
    console.log(walletList);
    res.send(walletList.map(w => ({
      id: w.id,
      name: w.name,
      status: w.state.status,
    })));
  } catch (e) {
    res.status(400).send({
      message: `${e}`,
    });
  }
});

app.post('/token', (_req, res) => {
  res.send('token created');
});