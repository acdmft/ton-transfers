import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import dotenv from "dotenv";

dotenv.config();
// Create Client
const client = new TonClient({
  endpoint: "https://toncenter.com/api/v2/jsonRPC",
});

// Generate new key
let mnemonics = process.env.WALLET_A_SEED.split(" ");
let keyPair = await mnemonicToPrivateKey(mnemonics);
let wallet_b = process.env.WALLET_B;

// Create wallet contract
let workchain = 0; // Usually you need a workchain 0
let wallet = WalletContractV4.create({
  workchain,
  publicKey: keyPair.publicKey,
});
let contract = client.open(wallet);

// Get balance
setTimeout(async () => {
  let balance = await contract.getBalance();
  console.log("balance ", balance);
}, 1000);

// Create a transfer
let seqno;
setTimeout(async () => {
  seqno = await contract.getSeqno();
  console.log("seqno ", seqno);
}, 6000);
setTimeout(async () => {
  let transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        value: "0.054",
        to: wallet_b,
        body: "Hello world",
      }),
    ],
  });
    try {

        await contract.send(transfer);
    } catch(e) {
      console.log(e)
    }
    console.log('exiting ...');
}, 10000);
