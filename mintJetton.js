import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { beginCell, Address, toNano } from "@ton/ton";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: "",
  });

  let mnemonics = process.env.MINTER_ADMIN.split(" ");
  let keyPair = await mnemonicToPrivateKey(mnemonics);

  let workchain = 0; // Usually you need a workchain 0
  let wallet = WalletContractV4.create({
    workchain,
    publicKey: keyPair.publicKey,
  });
  let contract = client.open(wallet);
  const wallet_a = Address.parse(process.env.WALLET_A);
  const wallet_b = Address.parse(process.env.WALLET_B);  
  const j_minter = Address.parse(process.env.J_MINTER);
  const toncenterApiBaseUrl = "https://toncenter.com/api/v2";

  let seqno = await contract.getSeqno();

  const mintMsg = beginCell()
    .storeUint(21, 32)
    .storeUint(0, 64) // op, queryId
    .storeAddress(wallet_b) // to
    .storeCoins(11n) // jetton amount
    .storeCoins(toNano("0")) // forward_ton_amount
    .storeCoins(toNano("0.06")) // total_ton_amount
    .endCell();

  let transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        value: "0.096",
        to: j_minter, // jetton_wallet
        body: mintMsg,
      }),
    ],
  });

  let externalMessage = beginCell()
    .storeUint(0b10, 2) // 0b10 -> 10 in binary
    .storeUint(0, 2) // src -> addr_none
    .storeAddress(wallet_a) // Destination address
    .storeCoins(0) // Import Fee
    .storeBit(0) // No State Init
    .storeBit(1) // We store Message Body as a reference
    .storeRef(transfer) // Store Message Body as a reference
    .endCell();

  const msgBoc = externalMessage.toBoc().toString("base64");
  console.log("transfer boc ", msgBoc);
  setTimeout(async () => {
    try {
      const result = await fetch(`${toncenterApiBaseUrl}/sendBoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boc: msgBoc,
        }),
      });
      console.log("result ", result);
    } catch (e) {
      console.log(e);
    }
  }, 3000);
}

main().finally(() => {
  setTimeout(() => {
    console.log("Exiting ... ");
  }, 2500);
});
