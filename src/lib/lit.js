import LitJsSdk from "@lit-protocol/sdk-browser";

const client = new LitJsSdk.LitNodeClient();
const chain = "mumbai";

// Checks if the user has at least 0.1 MATIC
const accessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "",
    chain,
    method: "eth_getBalance",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
      comparator: ">=",
      value: "100000000000000000", // 0.1 MATIC
    }
  }
 /* {
    contractAddress: "0x8E80F503c06aDd4BE47b7561aEF1709e58e52066",
    standardContractType: "ERC721",
    chain,
    method: "ownerOf",
    parameters: ["1"],
    returnValueTest: {
      comparator: "=",
      value: ":userAddress"
    },
  },
  { "operator":"and" },
  {
    contractAddress: "0x8E80F503c06aDd4BE47b7561aEF1709e58e52066",
    standardContractType: "ERC721",
    chain,
    method: "isNeville",//"eth_getBalance",
    parameters: [":userAddress"],//[":userAddress", "latest"],
    returnValueTest: {
      comparator: "=",
      value: "true"//"100000000000000000", // 0.1 MATIC
    },    
  }  */
];

class Lit {
  litNodeClient;

  async connect() {
    await client.connect();
    this.litNodeClient = client;
  }

  async encryptText(text) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(text);

    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      accessControlConditions: accessControlConditions,
      symmetricKey,
      authSig,
      chain,
    });

    return {
        encryptedString,//: await encryptedString.text(),
        encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    };
  }

  async decryptText(encryptedString, encryptedSymmetricKey) {
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

    return await LitJsSdk.decryptString(
        encryptedString,
        symmetricKey
    );
  }
  
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

   
   
   /**   ENCRYPT to and DECRYPT from IPFS   **/

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
}

export default new Lit();
