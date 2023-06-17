# The Chamber of Secrets

The Chamber of Secrets is a decentralized dead man switch 
powered by The League of Entropy and the InterPlanetary FileSystem 
available on any Ethereum Virtual Machine*. (*Currently The Chamber 
of Secrets has been deployed on Calibration and Mumbai Networks*)

The Chamber of Secrets allows anyone to upload a folder,
encrypt the files inside this folder and deploy it to IPFS by leveraging
NFT.storage. The encryption is done with DRAND Timelock Encryption
allowing the CoS creator to set a deadline after which the encryption will be
available. This mechanism, fully decentralized, allows for many interesting use cases
such as web3 assets inheritance, blind auctions, crypto-puzzles, games and riddles.
And, of course, a dead man switch to publish all your secrets after death or whatever
you want. The Chamber of Secrets could contain everything, even an unicorn.

### Chamber of Secrets flow
#### Encryption
- Choose encryption mode (currently only DRAND Timelock Encryption available).
- Upload a folder.
- Choose decryption time, the date after decryption will be available.
- Encrypt files inside the folder with DRAND Timelock Encryption.
- Upload the folder to IPFS trough NFT.Storage (insert your API token).
- At this point, you will get a CID pointing to your Chamber of Secrets, well done!
- (optional) Encrypt your CoS CID. Encrypted CID will pay more gas, it is a larger string.
- Publish your Chamber of Secrets CID to the blockchain to make your Chamber available to the community. (*Connect your wallet to Mumbai or Calibration networks*)
#### Decryption
- Choose decryption mode (currently only DRAND Timelock Decryption available).
- Insert an encrypted CID, or an encrypted file from a Chamber of Secrets.
- Decrypt.
- At this point you will get the decrypted CID or a link to download the decrypted file.
#### Community Chambers of Secrets
This is a little sample on how to retrieve data about other published Chambers. 
Allowing easy discovering of Chambers about to be available for decryption and 
helping to publish the secrets. (A better client may be deployed on the future by anyone).

### Live Demo, live contracts and live Chamber of Secrets

- Live demo: https://the-chamber-of-secrets.vercel.app/
- Contract address on Filecoin Calibration testnet: 0x715C77C75a5E9bD74F359FC6C0cdac6f617549e6
- Contract address on Polygon Mumbai tesnet: 0x0f4318580cD57Bd50bfe91e83BfCc938938575d6
- Chamber of Secrets sample: https://bafybeicqjyv2qhspdvz4jnkppgi5lif6ewftnhqtc6hdhkhunzhcftt5zq.ipfs.nftstorage.link/
- Another Chamber of Secrets (locked until the end of the HackFS hackathon, 21-06-2023): 


### LIT - IMPORTANT INFO

If you are from the Lit team, ignore this project.
I intended to implement some more complex variants by incorporating Lit encryption on top of DRAND encryption 
to get a dynamic timelock (useful in some cases) but time was pressing and on Friday I had to take the decision
to abandon the Lit implementation. Sime files are still here and the packages are still here because they implement
some polyfills like the Buffer and because in the future I will continue the implementation but I don't intend to 
waste the time of any member of the Lit team:

**IMPORTANT, IF YOU ARE FROM THE LIT TEAM, IGNORE THIS PROJECT**


## Setup 
### Development setup
```
git clone https://github.com/jvaleskadevs/the-chamber-of-secrets.git
cd the-chamber-of-secrets
yarn
yarn start
```
*Maybe you need to add some ENV variables, look at the `.env.sample` file and fill it with your own variables (only to deploy contracts)*

### Production build
From the root of the project:
```
yarn build
```

## HackFS 2023 hackathon

This project has been created for the HackFS hackathon of 2023 by leveraging DRAND, NFT.Storage, the Filecoin network and IPFS sponsors tech.

Big thanks to everyone of them!

Another honorable mentions are: the League of Entropy, ethGlobal, Polygon Network, Hardhat, ethers and Alchemy. Without them, nothing of this could be done. Thanks!

J. Valeska
