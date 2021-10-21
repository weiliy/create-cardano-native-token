import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from "dotenv";
import {listWallet} from "./wallet";
import {createToken} from "./token";

const app = express();
const port = 8080;

app.listen(port, () => {
  console.log(`app run on port: 8080`);
  dotenv.config();
});

app.use(bodyParser.json());

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

interface ITokenRequestBody {
  name: string;
  description: string;
  amount: number;
}

interface ITokenResponseBody {
  txId: string;
  url: string;
}

app.post('/token', async (req: Request<ITokenRequestBody> , res: Response<ITokenResponseBody>) => {
  const {
    name,
    description,
    amount,
  } = req.body;

  const result = await createToken(name, description, amount);

  res.send(result);
});