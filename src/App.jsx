import { useState } from 'react';
import lit from './lib/lit';
import { NFTStorage } from 'nft.storage';
import { SecretFile } from './components/SecretFile'; 


function App () {
  const [files, setFiles] = useState([]);
  const [filesAndKeys, setFilesAndKeys] = useState([]);
  const [CID, setCID] = useState("bafybeibjcrs6u6puvdh3fcads7lfvyxd3wh3riavvkcwegoj5rjlfnc6iy");
  const [cidAndKey, setCidAndKey] = useState(null);
  const [decryptedCid, setDecryptedCid] = useState("");


  const readFiles = async (e) => {
    e.preventDefault();
    const filesToRead = e.target.files;
    for (let i = 0; i < filesToRead.length; i++) {
      await readFile(filesToRead[i]);
    }
  }
  
  const readFile = async (file) => {
    //const data = e.target.files[0];
    const reader = new window.FileReader();
    // Reading file as base64 data URL
    reader.readAsDataURL(file);
    
    reader.onloadend = async () => {
      console.log("reader.result:base64:URL");
      console.log(reader.result);
      // Encrypting base64 data URL of the file with LIT
      const encryptedFileAndKey = await lit.encryptText(reader.result);
      console.log("encryptedFile");
      console.log(encryptedFileAndKey);
      // Converting Blob to File, NFT Storage works with File
      const encryptedFile = new File([encryptedFileAndKey.encryptedString], file.name); //TODO: {type: file.type}, file.size?
      // list of encrypted files ready to be uploaded to NFT Storage
      setFiles(prevFiles => [...prevFiles, encryptedFile]);
      // list of encrypted files and their correspondent symmetric keys
      setFilesAndKeys(prevFilesKeys => [...prevFilesKeys, encryptedFileAndKey]);
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
    if (files.length === 0) return;
    console.log("files");
    console.log(files);
    // Please hardcode your NFT Storage Token here. Or install dotenv. TODO
    const nftstorage = new NFTStorage({ token: process.env.NFT_STORAGE_TOKEN });
    const cid = await nftstorage.storeDirectory(files);
    console.log(cid);

    const status = await nftstorage.status(cid);
    console.log(status);
    setCID(cid);
    //    CID  sec  bafybeibjcrs6u6puvdh3fcads7lfvyxd3wh3riavvkcwegoj5rjlfnc6iy
  }
  
  const encryptCID = async () => {
    if (!CID) return;
    const encryptedCidAndKey = await lit.encryptText(CID);
    console.log("encryptedCidAndKey");
    console.log(encryptedCidAndKey);
    
    /// TODO timelock encryption here
    
    setCidAndKey(encryptedCidAndKey);
  }
  
  const decryptCID = async () => {
    if (!cidAndKey) return;
    
    /// TODO timelock decryption here
    
    const decryptedCid = await lit.decryptText(
      cidAndKey.encryptedString, 
      cidAndKey.encryptedSymmetricKey
    );
    
    console.log("decryptedCid");
    console.log(decryptedCid);
    console.log(decryptedCid == CID);
    
    setDecryptedCid(decryptedCid);
  }
  
  const decryptFile = async (file, symmetricKey) => {
    return await lit.decryptText(file, symmetricKey);
  }
  
  return (
    <div>
      <h1>The Chamber of Secrets</h1>
      
      <input type="file" webkitdirectory="true" multiple onChange={readFiles}/>
      
      { filesAndKeys.length > 0 && filesAndKeys.map((file, index) => (
        <SecretFile key={index} file={file} decryptFile={decryptFile} />
      ))}
      
      <button type="button" onClick={uploadFiles}>Store directory on nft.storage</button>
      
      { CID && (
        <>
          <p>Congrats! Your Chamber of Secrets contains {filesAndKeys.length} secrets now!</p>
          
          <p>Visit your Chamber of Secrets:</p>
          <a href={`https://nftstorage.link/ipfs/${CID}`}>{`https://nftstorage.link/ipfs/${CID}`}</a>
          <p>COS CID: {CID}</p>
          
          <button type="button" onClick={encryptCID}>Encrypt CID</button>
          
          <p>Encrypted COS CID: {cidAndKey?.encryptedString.toString()}</p>
          <p>Encrypted COS CID Symmetric Key: {cidAndKey?.encryptedSymmetricKey}</p>
          <button type="button" onClick={decryptCID}>Decrypt CID</button>
          <p>Decrypted COS CID: {decryptedCid}</p>
          <p>Chamber of Secrets:</p>
          <a href={`https://nftstorage.link/ipfs/${decryptedCid}`}>{`https://nftstorage.link/ipfs/${decryptedCid}`}</a>
        </>
      )}
    </div>
  );
}

export default App;
