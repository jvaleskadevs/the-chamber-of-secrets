import LitJsSdk from "@lit-protocol/sdk-browser";
import { CoSAddress } from '../constants';

const client = new LitJsSdk.LitNodeClient();
const chain = "mumbai";

// Checks if the nonce of this chamber matches the current nonce in the CoS contract
// Incrementing the nonce breaks the previous nonce, making the CoS CID encrypted forever
// This allow chamber creators to reuse the same chamber and CoS CID with a different decryption time,
// and many other things, like pause/unpause the dead man switch in a secure way (more on this later) 
const evmContractConditions = [
  {
    contractAddress: CoSAddress,
    chain,
    functionName: "nonces",
    functionAbi: {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "nonces",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    functionParams: ["0x"], // the address of chamber creator, configured later
    returnValueTest: {
      key: "",
      comparator: "=",
      value: "0", // current signerNonce+1, configured later
    }    
  }
];
const accessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "timestamp",
    chain,
    method: "eth_getBlockByNumber",
    parameters: ["latest"],
    returnValueTest: {
      comparator: ">=",
      value: "1663259602" // eth merge date, always true (Sept 15, 2022)
    },
  },
];

class Lit {
  litNodeClient;

  async connect() {
    await client.connect();
    this.litNodeClient = client;
  }
  
  // The auth object contains the signer and the current signerNonce, access control needs them.
  async encryptText(text, auth) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(text);

    evmContractConditions[0].functionParams[0] = authSig.address; // chamber creator address
    evmContractConditions[0].returnValueTest.value = "0"//(parseInt(auth.signerNonce) + 1).toString();

    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      evmContractConditions,
      symmetricKey,
      authSig,
      chain,
    });

    return {
      encryptedString,//: await encryptedString.text(),
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    };
  }

  async decryptText(encryptedString, encryptedSymmetricKey, auth) {
    if (!this.litNodeClient) {
      await this.connect();
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    evmContractConditions[0].functionParams[0] = auth.signer.address;
    evmContractConditions[0].returnValueTest.value = auth.signerNonce;
    
    const symmetricKey = await this.litNodeClient.getEncryptionKey({
      evmContractConditions,
      toDecrypt: encryptedSymmetricKey,
      chain,
      authSig
    });

    return await LitJsSdk.decryptString(
      encryptedString,
      symmetricKey
    );
  }
  
  // Encrypting files as string without access control condition (nonce)
  async encryptFile(file) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(file);

    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain
    });

    return {
      encryptedFile: encryptedString,
      encryptedFileAsString: await encryptedString.text(),
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16"),
      name: file.name,
      size: file.size
    };
  }

  async decryptFile(encryptedFile, encryptedSymmetricKey) {
    if (!this.litNodeClient) {
      await this.connect();
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    
    const symmetricKey = await this.litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain,
      authSig
    });

    return await LitJsSdk.decryptString(
      encryptedFile,
      symmetricKey
    );
  }
/*  
  async encryptFile(file) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile(file);

    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      accessControlConditions: accessControlConditions,
      symmetricKey,
      authSig,
      chain,
    });

    return {
        encryptedFile,
        encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    };
  }

  async decryptFile(encryptedFile, encryptedSymmetricKey) {
    if (!this.litNodeClient) {
      await this.connect();
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    const symmetricKey = await this.litNodeClient.getEncryptionKey({
        accessControlConditions: accessControlConditions,
        toDecrypt: encryptedSymmetricKey,
        chain,
        authSig
    });

    return await LitJsSdk.decryptFile(
        encryptedFile,
        symmetricKey
    );
  }

*/   
   
   /**   ENCRYPT to and DECRYPT from IPFS   **/
/*
  async encryptStringToIpfs(string) {
    if (!this.litNodeClient) {
      await this.connect();
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    return await LitJsSdk.encryptToIpfs({
      authSig,
      accessControlConditions,
      chain,
      string,
      litNodeClient: this.litNodeClient,
      infuraId: process.env.INFURA_ID,
      infuraSecretKey: process.env.INFURA_SECRET
    });
  }  
  
  
  async encryptFileToIpfs(file) {
    if (!this.litNodeClient) {
      await this.connect();
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    return await LitJsSdk.encryptToIpfs({
      authSig,
      accessControlConditions,
      chain,
      file,
      litNodeClient: this.litNodeClient,
      infuraId: process.env.INFURA_ID,
      infuraSecretKey: process.env.INFURA_SECRET
    });
  }
  
  
  async decryptFromIpfs(cid) {
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    return await LitJsSdk.decryptFromIpfs({
      authSig,
      ipfsCid: cid,
      litNodeClient: this.litNodeClient
    });
  }
*/
}
export default new Lit();
