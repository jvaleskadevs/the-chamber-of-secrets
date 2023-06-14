import { useState } from 'react';
import { ethers } from 'ethers';
import lit from './lib/lit';
import { encryptWithTimelock, decryptWithTimelock } from './lib/timelockEncryption';
import { NFTStorage } from 'nft.storage';
import { SecretFile } from './components/SecretFile'; 

import { CoSAddress, CoSAbi } from './constants';

function App () {
  const [encryptOptions, setEncryptOptions] = useState({ unstoppable: false });
  const [decryptOptions, setDecryptOptions] = useState();
  
  const [CoS, setCoS] = useState();
  const [nftStorageToken, setNftStorageToken] = useState("");
  // List of files encrypted with Lit, ready to nft.storage
  const [files, setFiles] = useState([]); 
  // Files encrypted with Lit and symmetric keys
  const [filesAndKeys, setFilesAndKeys] = useState([]); 
  
  const [CID, setCID] = useState("bafybeibjcrs6u6puvdh3fcads7lfvyxd3wh3riavvkcwegoj5rjlfnc6iy");
  // encrypted Cid with Key, if exists
  const [cidAndKey, setCidAndKey] = useState();
  const [decryptedCid, setDecryptedCid] = useState("");
  const [decryptedFile, setDecryptedFile] = useState("");
  const [decryptionTime, setDecryptionTime] = useState(0);
  
  const [decryptedFileAsUrl , setDecryptedFileAsUrl] = useState("");
  
  const [toDecryptCidAndKey, setToDecryptCidAndKey] = useState(null);
  const [toDecryptFileAndKey, setToDecryptFileAndKey] = useState(null);
  
  const [done, setDone] = useState(false);
  
  const initCoS = async () => {
    if (window.ethereum == null) alert("Please install an EVM compatible wallet");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const CoS = new ethers.Contract(CoSAddress, CoSAbi, provider); 
    const signer = await provider.getSigner();
    const signerNonce = await CoS.nonces(signer.address);
    const auth = {
      signer,
      signerNonce
    };
    CoS.auth = auth;
    console.log(provider);
    console.log(signer);
    console.log(CoS.auth);
    setCoS(CoS);
  }
  
  // Publish the metadata CID on the blockchain, increasing the nonce on CoS contract
  const publishMetadataOnChain = async () => {
    if (!metadataCID || !decryptionTime) return;
    if (!CoS) await initCoS();
    await CoS.cos(metadataCID, decryptionTime);
    setDone(true);
  }

  const readFiles = async (e) => {
    e.preventDefault();
    const filesToRead = e.target.files;
    for (let i = 0; i < filesToRead.length; i++) {
      await readFile(filesToRead[i]);
    }
  }
  
  const readFile = async (file) => {
    const reader = new window.FileReader();
    // Reading file as base64 data URL
    reader.readAsDataURL(file);
    
    reader.onloadend = async () => {
      console.log("reader.result:base64:URL") && console.log(reader.result);
      if (!encryptOptions?.unstoppable) {
        // Encrypting base64 data URL of the file with LIT
        const encryptedFileAndKey = await lit.encryptFile(reader.result);
        console.log("encryptedFileAndKey") && console.log(encryptedFileAndKey);
        // Converting Blob to File, NFT Storage works with File
        const encryptedFile = new File([encryptedFileAndKey.encryptedFile], file.name); 
        console.log("encryptedFile") && console.log(encryptedFile);
        //TODO: {type: file.type}, file.size?
        setFiles(prevFiles => [...prevFiles, encryptedFile]);
        setFilesAndKeys(prevFilesKeys => [...prevFilesKeys, encryptedFileAndKey]);
      } else {
        // Skipping Lit encryption, skips Access Control Conditions. 
        // No way to stop timelock decryption.
        const encryptedFile = new File([reader.result], file.name);
        console.log("encryptedFile") && console.log(encryptedFile);
        setFiles(prevFiles => [...prevFiles, encryptedFile]);
      }
    };
  }
/*  
  const encryptFile = async (file) => {     
    //console.log(file);
    const { encryptedFile, encryptedSymmetricKey } = await lit.encryptFile(file);
     
    //console.log(encryptedFile); // blob
    //console.log(encryptedSymmetricKey);
     
    return { 
      encryptedFile,//new File([encryptedString], file.name, { type: file.type }),
      symmetricKey: encryptedSymmetricKey,
      name: file.name,
      size: file.size,
    };
  }
*/  
  const uploadFiles = async () => {
    if (files.length === 0 || !nftStorageToken) return;
    console.log("files");
    console.log(files);
    const nftstorage = new NFTStorage({ token: nftStorageToken });
    const cid = await nftstorage.storeDirectory(files);
    setCID(cid);
    /*
    console.log(cid);
    const status = await nftstorage.status(cid);
    console.log(status);
    */
    //    CID  sec  bafybeibjcrs6u6puvdh3fcads7lfvyxd3wh3riavvkcwegoj5rjlfnc6iy
  }
  
  const encryptCID = async () => {
    if (!CID || !decryptionTime) return;
    
    const { ciphertext } = await encryptWithTimelock(CID, Date.parse(decryptionTime));
    
    if (encryptOptions?.unstoppable) {
      console.log("encryptedCid");
      console.log(encryptedCid);
      setCidAndKey(ciphertext);
      return;
    }
    
    const encryptedCidAndKey = await lit.encryptText(ciphertext, CoS.auth);
    console.log("encryptedCidAndKey");
    
    encryptedCidAndKey.encryptedStringAsString = await encryptedCidAndKey.encryptedString.text();
    console.log(encryptedCidAndKey);
    
    setCidAndKey(encryptedCidAndKey);
  }
  
  const decryptCID = async () => {
    if (!cidAndKey) return;
    
    let timelockEncryptedCid;
    if (!encryptOptions?.unstoppable) {
      timelockEncryptedCid = await lit.decryptText(
        cidAndKey.encryptedString, 
        cidAndKey.encryptedSymmetricKey,
        { signer: { address: '0x33be97e6e15301988e3f326bb7dac3c55c8ea472' }, signerNonce: "0" }  
      );
    } else {
      timelockEncryptedCid = cidAndKey.encryptedString
    }
    const decryptedCid = await decryptWithTimelock(timelockEncryptedCid, decryptionTime);
    
    console.log("decryptedCid");
    console.log(decryptedCid);
    console.log(decryptedCid.plaintext == CID);
    
    setDecryptedCid(decryptedCid);
  }
  
  const decryptFile = async (file, symmetricKey) => {
    const decryptedFileAsUrl = await lit.decryptFile(file, symmetricKey);
    console.log(decryptedFileAsUrl);
    setDecryptedFileAsUrl(decryptedFileAsUrl);
  }
  
  const onDateInputChange = (e) => {
    console.log("decryptionTime");
    console.log(decryptionTime);
    console.log("e");
    console.log(e.target.value);
    console.log("eparse");
    console.log(Date.parse(e.target.value));
    setDecryptionTime(e.target.value);
    // decyption error: It's too early to decrypt the ciphertext - decryptable at round 11694308
  }
  
  const onCidOrKeyInputChange = (e) => {
    if (e.target.name === "cid") {
      setToDecrytCidAndKey(prevCidAndKey => { e.target.value, prevCidAndKey?.key });
    } else if (e.target.name === "cidkey") {
      setToDecryptCidAndKey(prevCidAndKey => { prevCidAndKey?.cid, e.target.value });
    }   
  }
  
  const onFileOrKeyInputChange = (e) => {
    if (e.target.name === "file") {
      setToDecryptFileAndKey(prevFileAndKey => { e.target.value, prevFileAndKey?.key });
    } else if (e.target.name === "filekey") {
      setToDecryptFileAndKey(prevFileAndKey => { prevFileAndKey?.file, e.target.value });
    }    
  }
  
  const onNftStorageTokenInputChange = (e) => {
    setNftStorageToken(e.target.value);
  }
  
  return (
    <div className="container">
      <h1>The Chamber of Secrets</h1>

      { !CoS && (
        <button type="button" onClick={initCoS}>Connect</button>
      )}
      
      { CoS && (
        <>
          <p>Your address: {CoS.auth.signer.address}</p>
          <p>Chamber Of Secrets contract address: {CoSAddress}</p>
          <p>Your CoS nonce: {CoS.auth.signerNonce.toString()}</p>
          
        </>
      )}
      
      <div className="section">
        <h2>Encryption</h2>
        <p>Select a folder and encrypt it:</p>
        <input type="file" webkitdirectory="true" multiple onChange={readFiles}/>
        
        { filesAndKeys.length > 0 && filesAndKeys.map((file, index) => (
          <SecretFile 
            key={index} 
            file={file} 
            decryptFile={decryptFile} 
            decryptedFileAsUrl={decryptedFileAsUrl}
          />
        ))}
        
        { files.length > 0 && (
          <>
            <p>Store your files on IPFS and Filecoin trough NFT.Storage (insert your API token):</p>
            <input type="text" onChange={onNftStorageTokenInputChange} placeholder="NFT.storage API Token"/>
            <button type="button" onClick={uploadFiles}>Store folder on nft.storage</button>
          </>
        )}
        
        { CID && (
          <div className="container-cid">
            <p>Chamber of Secrets (CoS) CID: {CID}</p>
            <p>Congrats! Your Chamber of Secrets contains {filesAndKeys.length} secrets now!</p>
            <p>Visit your Chamber of Secrets:</p>
            <a href={`https://nftstorage.link/ipfs/${CID}`}>{`https://nftstorage.link/ipfs/${CID}`}</a>
            
            <h3>Encrypt the CoS CID</h3>
            
            <p>Encrypt the CID with DRAND timelock and Lit (select the date after which decryption will be available)</p>
            
            <input type="datetime-local" value={decryptionTime} onChange={onDateInputChange}/>
            <button type="button" onClick={encryptCID}>Encrypt CID</button>
            
            { cidAndKey && (
              <>
                <p>CoS CID has been successfully encrypted</p>
                <p>Encrypted CoS CID: {cidAndKey?.encryptedStringAsString}</p>
                <p>Encrypted CoS CID Symmetric Key: {cidAndKey?.encryptedSymmetricKey}</p>
                <button type="button" onClick={decryptCID}>Decrypt CID</button>
                
                { decryptedCid && (
                  <>
                    <p>CoS CID has been successfully decrypted</p>
                    <p>Decrypted CoS CID: {decryptedCid.plaintext}</p>
                    <p>Chamber of Secrets:</p>
                    <a href={`https://nftstorage.link/ipfs/${decryptedCid.plaintext}`}>{`https://nftstorage.link/ipfs/${decryptedCid.plaintext}`}</a>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="section">
        <h2>Decryption</h2>
        <input type="text" name="cid" placeholder="Encrypted CoS CID" onChange={onCidOrKeyInputChange} />
        <input type="text" name="cidkey" placeholder="Encrypted Symmetric Key" onChange={onCidOrKeyInputChange} />
        <button type="button" onClick={() => decryptCID(toDecryptCidAndKey)}>Decrypt CID</button>
        
        { decryptedCid && (
          <>
            <p>CoS CID has been successfully decrypted</p>
            <p>Decrypted CoS CID: {decryptedCid.plaintext}</p>
            <p>Chamber of Secrets:</p>
            <a href={`https://nftstorage.link/ipfs/${decryptedCid.plaintext}`}>{`https://nftstorage.link/ipfs/${decryptedCid.plaintext}`}</a>
          </>
        )}    
        
        <br></br>
        <br></br>
        
        <input type="text" name="file" placeholder="Encrypted CoS File" onChange={onFileOrKeyInputChange} />
        <input type="text" name="filekey" placeholder="Encrypted Symmetric Key" onChange={onFileOrKeyInputChange} />
        <button type="button" onClick={() => decryptFile(toDecryptFileAndKey.encryptedFile, toDecryptFileAndKey.encryptedSymmetricKey)}>Decrypt File</button>
        
        { decryptedFile && (
          <>
            <p>CoS File has been successfully decrypted</p>
            <p>Decrypted CoS File: {decryptedFile.plaintext}</p>
            <p>Chamber of Secrets:</p>
            <a href={`https://nftstorage.link/ipfs/${decryptedFile.plaintext}`}>{`https://nftstorage.link/ipfs/${decryptedFile.plaintext}`}</a>
          </>
        )}
      </div>  
    </div>
  );
}

export default App;
