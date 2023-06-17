import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import lit from './lib/lit';
import { encryptWithTimelock, decryptWithTimelock } from './lib/timelockEncryption';
import { NFTStorage } from 'nft.storage';
import { SecretFile } from './components/SecretFile'; 
import { ChamberOfSecrets } from './components/ChamberOfSecrets';

import { CoSAddressMumbai, CoSAddressCalibration, CoSAbi } from './constants';

function App () {
  const [encryptOptions, setEncryptOptions] = useState({ unstoppable: true, drand: true });
  const [decryptOptions, setDecryptOptions] = useState({ unstoppable: true, drand: true });
  const [decryptionTime, setDecryptionTime] = useState(new Date(Date.now()).toISOString().slice(0, 16));
  // the CoS contract
  const [CoS, setCoS] = useState("");
  const [done, setDone] = useState(false);
  const [communityChambers, setCommunityChambers] = useState([]);
  // List of files as base64 data URL
  const [filesAsUrls, setFilesAsUrls] = useState([]);
  const [encryptedCoS, setEncryptedCoS] = useState([]);
  const [nftStorageToken, setNftStorageToken] = useState("");
  const [CoSCID, setCoSCID] = useState("");
  const [CoSCIDToPublish, setCoSCIDToPublish] = useState(""); 
  // decryption CoS CID
  const [encryptedCoSCID, setEncryptedCoSCID] = useState("");
  const [decryptedCoSCid, setDecryptedCoSCid] = useState("");
  // decryption CoS File
  const [toDecryptCoSFile, setToDecryptCoSFile] = useState("");
  const [decryptedCoSFile, setDecryptedCoSFile] = useState("");
  

  const initCoS = async () => {
    try {
      if (window.ethereum == null) alert("Please install an EVM compatible wallet");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId != "314159" && network.chainId != "80001") {
         alert("Please change to Calibration or Mumbai networks");
         return;
      }
      const contractAddress = network.chainId == "80001" ? CoSAddressMumbai : CoSAddressCalibration;
      const signer = await provider.getSigner();
      const CoS = new ethers.Contract(contractAddress, CoSAbi, signer); 
      CoS.chainId = network.chainId == "80001" ? "Mumbai" : network.chainId == "314159" ? "Calibration" : "";
      console.log(CoS);
      setCoS(CoS);
    } catch (err) {
      console.log(err);
    }
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
      console.log("reader.result:base64:URL"); console.log(reader.result);
      setFilesAsUrls(prevFilesAsUrls => [...prevFilesAsUrls, reader.result]);
    };
  }
  
  const encryptCoS = async () => {
    if (encryptOptions.unstoppable) {
      if (encryptOptions.drand) {
        await encryptCoSWithDrandTimelock(filesAsUrls);
      }
    } 
  }
  
  const encryptCoSWithDrandTimelock = async (files) => {
    const encryptedFiles = [];
    for (let i = 0; i < files.length; i++) {
      try {
        encryptedFiles.push(
          await encryptWithTimelock(files[i], Date.parse(decryptionTime))
        );
      } catch (err) {
        console.log(err);
      } finally {
        continue;
      }
    }
    console.log("encryptedFiles"); console.log(encryptedFiles);
    setEncryptedCoS(encryptedFiles);
  }
  
  const uploadCoS = async () => {
    if (encryptedCoS.length === 0 || !nftStorageToken) return;
    const CoS = encryptedCoS.map(file => new File([file.ciphertext], file.name, { type: file.type }));
    const nftstorage = new NFTStorage({ token: nftStorageToken });
    const cid = await nftstorage.storeDirectory(CoS);
    setCoSCID(cid);
  }
  
  const publishCoSCID = async () => {
    if (!CoSCIDToPublish || !decryptionTime) return;
    if (!CoS) await initCoS();
    const decryptionTimeInSeconds = Date.parse(decryptionTime) / 1000;
    try {
      await CoS.addCoS(CoSCIDToPublish, decryptionTimeInSeconds.toString());
      onCoSPublished();
    } catch (err) {
      console.log(err);
    }
  }

  const decryptCoSFile = async () => {
    if (decryptOptions.unstoppable) {
      if (decryptOptions.drand) {
        await decryptCoSFileWithDrandTimelock(toDecryptCoSFile.encryptedFile);
      } 
    }
  }

  const decryptCoSFileWithDrandTimelock = async (encryptedFile) => {
    try {
      const decryptedFile = await decryptWithTimelock(encryptedFile);
      console.log(decryptedFile);
      setDecryptedCoSFile(decryptedFile);
    } catch (err) {
      alert(err.message);
      console.log(err);
    }  
  }
  
  const encryptCoSCID = async () => {
    if (!CoSCID || !decryptionTime) return;
    const { ciphertext } = await encryptWithTimelock(CoSCID, Date.parse(decryptionTime), true);
    console.log(ciphertext);
    setEncryptedCoSCID(ciphertext);
  }
  
  const decryptCoSCID = async () => {
    if (!encryptedCoSCID || !decryptionTime) return;
    const decryptedCid = await decryptWithTimelock(encryptedCoSCID, decryptionTime);
    console.log("decryptedCid"); console.log(decryptedCid);
    console.log(decryptedCid.plaintext == CoSCID);    
    setDecryptedCoSCid(decryptedCid);
  }

  // blockchain event
	const onCoSPublished = () => {
		const event = CoS.filters.NewCoS();
		CoS.removeListener(event);
		
		CoS.on(event, (logs) => {
			const parsedLogs = (new ethers.Interface(CoSAbi)).parseLog(logs);
			console.log(parsedLogs);
			
			if (CoS?.runner?.address.toLowerCase() === parsedLogs.args.owner) {
        setDone(true);
			}
		});	
	}
  
  // decryptionTime
  const onDateInputChange = (e) => {
    setDecryptionTime(e.target.value);
  }
  
  // to manage encryption mode (currently, always running DRAND Timelock)
  const onEncryptModeInputChange = (e) => {
    let options = {};
    switch (e.target.value) {
      case "timedrand":
        options.unstoppable = true;
        options.drand = true;
        break;
      case "timelit":
        options.unstoppable = true;
        options.lit = true;
        break;
      case "nonces":
        options.unstoppable = false;
        options.nonce = true;
      default:
        break;
    }
    options.mode = e.target.value;
    console.log(options);
    setEncryptOptions(options);
  }
  
  // to manage decryption mode (currently, always running DRAND Timelock)
  const onDecryptModeInputChange = (e) => {
    let options = {};
    switch (e.target.value) {
      case "timedrand":
        options.unstoppable = true;
        options.drand = true;
        break;
      case "timelit":
        options.unstoppable = true;
        options.lit = true;
        break;
      case "nonces":
        options.unstoppable = false;
        options.nonce = true;
      default:
        break;
    }
    options.mode = e.target.value;
    console.log(options);
    setDecryptOptions(options);
  }
 
  // to store CoS
  const onNftStorageTokenInputChange = (e) => {
    setNftStorageToken(e.target.value);
  }
  
  // to encrypt CID
  const onCoSCIDInputChange = (e) => {
    setCoSCID(e.target.value);
  }
  
  // to publish CID
  const onToPublishCoSCidInputChange = (e) => {
    setCoSCIDToPublish(e.target.value);
  }

  // to decrypt CID
  const onEncryptedCoSCIDInputChange = (e) => {
    setEncryptedCoSCID(e.target.value);
  }
  
  // to decrypt file
  const onEncryptedCoSFileInputChange = (e) => {
    setToDecryptCoSFile({ 
        encryptedFile: e.target.value.replace(/\\n/g, "\n")
    });
  }
  
  const fetchCommunityChambers = async () => {
    const totalChambers = await CoS.totalCoS();
    const chambers = [];
    for (let i = 1; i <= totalChambers; i++) {
      chambers.push(await CoS.chambers(i));
    }
    setCommunityChambers(chambers);
  }
  
  useEffect(() => {
    if (CoS) fetchCommunityChambers();
  }, [CoS, done]);
 
  return (
    <div className="container">
      <h1>The Chamber of Secrets</h1>

      { !CoS && (
        <button type="button" onClick={initCoS}>Connect</button>
      )}
      
      { CoS && (
        <>
          <p>Your address: {CoS?.runner?.address}</p>
          <p>Chamber Of Secrets contract address: {CoS?.target}</p>
          <p>Connected to {CoS?.chainId}</p>
        </>
      )}
      
      {/* ENCRYPTION */}
      
      <div className="section">
        <h2>Encryption</h2>
        
        <label htmlFor="enc-mode">Choose encryption mode:</label>
        <select name="enc-mode" id="enc-mode" onChange={onEncryptModeInputChange}>
          <option value="timedrand">DRAND Timelock (Unstoppable)</option>
          <option value="timedrand">More Options (soon)</option>
        </select>
        
        {/* FILE ENCRYPTION */}
        <h3>Encrypt CoS</h3>
        
        <p>Select date and time after which decryption will be available:</p>
        <input type="datetime-local" value={decryptionTime} onChange={onDateInputChange}/>
        
        { encryptOptions.unstoppable && encryptOptions.drand && (
          <>
            <p>Select a folder and encrypt it:</p>
            <input type="file" webkitdirectory="true" multiple onChange={readFiles}/>
            <button type="button" onClick={encryptCoS}>Encrypt CoS</button>
          </>
        )}
    
        { encryptedCoS.length > 0 && encryptedCoS.map((file, index) => (
          <SecretFile 
            key={index} 
            file={file}
          />
        ))}
        
        { encryptedCoS.length > 0 && (
          <>
            <p>CoS has been successfully encrypted</p>
            <h3>Upload CoS</h3>
            <p>Store your CoS on IPFS and Filecoin trough NFT.Storage (insert your API token):</p>
            <input type="text" onChange={onNftStorageTokenInputChange} placeholder="NFT.storage API Token"/>
            <button type="button" onClick={uploadCoS}>Store folder on nft.storage</button>
          </>
        )}
        
        { CoSCID && (
          <div className="container-cid">
            <p>Chamber of Secrets (CoS) CID: {CoSCID}</p>
            <p>Congrats! Your Chamber of Secrets contains {encryptedCoS.length} secrets now!</p>
            <p>Visit your Chamber of Secrets:</p>
            <a href={`https://nftstorage.link/ipfs/${CoSCID}`}>{`https://nftstorage.link/ipfs/${CoSCID}`}</a>
          </div>
        )}
          
        {/* CID ENCRYPTION */}
        
        <div>  
          <h3>Encrypt the CoS CID</h3>
          
          <p>Select the date after which decryption will be available:</p>
          <input type="text" placeholder="Chamber of Secrets CID" onChange={onCoSCIDInputChange} />
          <input type="datetime-local" value={decryptionTime} onChange={onDateInputChange}/>
          <button type="button" onClick={encryptCoSCID}>Encrypt CID</button>
          
          { encryptedCoSCID && (
            <>
              <p>CoS CID has been successfully encrypted</p>
              <p>Encrypted CoS CID: {encryptedCoSCID}</p>
            </>
          )}
        </div>
        
        {/* PUBLISH CoS CID */}
        <div>
          <h3>Publish the CoS CID</h3>
            
          <input type="text" placeholder="Chamber of Secrets CID" onChange={onToPublishCoSCidInputChange} />
          <button type="button" onClick={publishCoSCID}>Publish CID</button>
          
          { done && (
            <p>Congrats, your Chamber of Secrets has been successfully published!</p>
          )}
        </div>
      </div>
      
      {/* DECRYPTION */}
      
      <div className="section">
        <h2>Decryption</h2>
        
        <label htmlFor="dec-mode">Choose decryption mode:</label>
        <select name="dec-mode" id="dec-mode" onChange={onDecryptModeInputChange}>
          <option value="timedrand">DRAND Timelock (Unstoppable)</option>
          <option value="timedrand">More Options (soon)</option>
        </select>
        
        <br></br>

        
        {/* CID DECRYPTION */}
        <h3>Decrypt CoS CID</h3>

        
        { decryptOptions.unstoppable && decryptOptions.drand && (
          <>
            <textarea
              type="text"
              name="cid"
              placeholder="Encrypted CoS CID"
              onChange={onEncryptedCoSCIDInputChange}>
            </textarea>
            <button type="button" onClick={decryptCoSCID}>Decrypt CID</button>
          </>
        )}

        
        { decryptedCoSCid && (
          <>
            <p>CoS CID has been successfully decrypted</p>
            <p>Decrypted CoS CID: {decryptedCoSCid.plaintext}</p>
            <p>Chamber of Secrets:</p>
            <a href={`https://nftstorage.link/ipfs/${decryptedCoSCid.plaintext}`}>{`https://nftstorage.link/ipfs/${decryptedCoSCid.plaintext}`}</a>
          </>
        )}    
        
        <br></br>
        <br></br>
        
        {/* FILE DECRYPTION */}
        <h3>Decrypt CoS File</h3>
        
        { decryptOptions.unstoppable && decryptOptions.drand && (
        <>
          <textarea
            type="text"
            name="file"
            placeholder="Encrypted CoS File"
            onChange={onEncryptedCoSFileInputChange}
            value={toDecryptCoSFile?.encryptedFile}>
          </textarea>
          <button type="button" onClick={decryptCoSFile}>Decrypt File</button>
        </>
        )}
       
        { decryptedCoSFile && (
          <>
            <p>CoS File has been successfully decrypted</p>
            <p>Decrypted CoS File (base64 URL data):</p> 
            <p>{decryptedCoSFile.plaintext}</p>
            <p>Download decrypted CoS file:</p>
            <a href={decryptedCoSFile.plaintext} download>{decryptedCoSFile.plaintext}</a>
          </>
        )}
      </div>
      
      <div className="section">
        <h3>Chambers of Secrets (Community)</h3>
        
        { communityChambers.length > 0 && communityChambers.map((cos, ind) => (
           <ChamberOfSecrets key={ind} cos={cos} />
        ))}
      </div>
    </div>
  );
}

export default App;
