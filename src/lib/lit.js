//import LitJsSdk from "@lit-protocol/sdk-browser";
import * as LitJsSdk from "@lit-protocol/lit-node-client";

/////
////      Please, ignore this file. 
///

// I intended to implement some more complex variants by incorporating Lit encryption
// on top of DRAND encryption to get a variable timelock (useful in some cases) 
// but time was pressing and on Friday I had to take the decision to abandon 
// the Lit implementation. This is still here and the packages are still here because 
// they implement the polyfills like the Buffer and because in the future I will continue
// the implementation but I don't intend to waste the time of any member of the Lit team:

//    IMPORTANT
//    IMPORTANT, IF YOU ARE FROM THE LIT TEAM, IGNORE THIS PROJECT.            !!!!!!!!!!!!!!!!!!!!!
//    IMPORTANT



//import { CoSAddress } from '../constants';

const client = new LitJsSdk.LitNodeClient();
window.litNodeClient = client;
const chain = "mumbai";
//const chain = "calibration";

// Checks if the nonce of this chamber matches the current nonce in the CoS contract
// Incrementing the nonce breaks the previous nonce, making the CoS CID encrypted forever
// This allow chamber creators to reuse the same chamber and CoS CID with a different decryption time,
// and many other things, like pause/unpause the dead man switch in a secure way (more on this later) 
const evmContractConditions = [
  {
    contractAddress: "",//CoSAddress,
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
const timelockAccessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "timestamp",
    chain,
    method: "eth_getBlockByNumber",
    parameters: ["latest"],
    returnValueTest: {
      comparator: ">=",
      value: "1651276942" // configured later by chamber creator with desired decryptionTime
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
      size: file.size,
      type: file.type
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
  
  
  async encryptFileWithTimelock(file, decryptionTime) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    
    console.log(file);
    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({ file });//await LitJsSdk.encryptString(file);
    
    timelockAccessControlConditions[0].returnValueTest.value = decryptionTime.toString();

    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      accessControlConditions: timelockAccessControlConditions,
      symmetricKey,
      authSig,
      chain
    });

    return {
      encryptedFile: Buffer.from(await encryptedFile.arrayBuffer()).toJSON(),
      encryptedFileAsBlob: encryptedFile,
      encryptedFileAsString: await encryptedFile.text(),
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16"),
      name: file.name,
      size: file.size,
      type: file.type
    };
  }
  
  async decryptFileWithTimelock(encryptedFile, encryptedSymmetricKey, decryptionTime) {
    if (!this.litNodeClient) {
      await this.connect();
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    
    timelockAccessControlConditions[0].returnValueTest.value = decryptionTime.toString();
    console.log(timelockAccessControlConditions);
    
    const symmetricKey = await this.litNodeClient.getEncryptionKey({
      accessControlConditions: timelockAccessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain,
      authSig
    });

    console.log(typeof encryptedFile);
    console.log(encryptedFile);

    return await LitJsSdk.decryptFile({
      file: encryptedFile,
      symmetricKey
    });
  }
 
   
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
  
*/  
  async encryptFileToIpfsWithTimelock(file, decryptionTime) {
    if (!this.litNodeClient) {
      await this.connect();
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    timelockAccessControlConditions[0].returnValueTest.value = decryptionTime.toString();
 
    return await LitJsSdk.encryptToIpfs({
      authSig,
      accessControlConditions: timelockAccessControlConditions,
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
}
export default new Lit();
