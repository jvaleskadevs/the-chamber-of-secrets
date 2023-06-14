import { roundAt, timelockEncrypt, timelockDecrypt } from "tlock-js";
import { timelockParamsSchema } from "./timelockParamsSchema";
import { mainnet, testnet } from "./timelockClient";

const network = "testnet";

function getClient() {
  let client;
  if (network === "mainnet") {
    client = mainnet();
  } else {
    client = testnet();
  }
  return client;
}

export async function encryptWithTimelock(plaintext, decryptionTime) {
  const params = await timelockParamsSchema.validate({ plaintext, decryptionTime });
  return await encrypt(getClient(), params.plaintext, params.decryptionTime);
}

export async function decryptWithTimelock(ciphertext) {
  //const params = await timelockParamsSchema.validate({ ciphertext, decryptionTime: 1 });
  return await decrypt(getClient(), ciphertext);
}

async function encrypt(client, plaintext, decryptionTime) {
  const chainInfo = await client.chain().info();
  const roundNumber = roundAt(decryptionTime, chainInfo);
  const ciphertext = await timelockEncrypt(
    roundNumber, 
    Buffer.from(plaintext), 
    client
  );
  return {
    plaintext,
    decryptionTime,
    ciphertext
  };  
}

async function decrypt(client, ciphertext) {
  const plaintext = await timelockDecrypt(ciphertext, client)
  return {
    plaintext,
    //decryptionTime,
    ciphertext
  }
}
