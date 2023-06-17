export const CoSAddressMumbai = "0x0f4318580cD57Bd50bfe91e83BfCc938938575d6";
export const CoSAddressCalibration = "0x715C77C75a5E9bD74F359FC6C0cdac6f617549e6";
export const CoSAbi = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "cid",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "decryptionTime",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "NewCoS",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "cid",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "decryptionTime",
          "type": "uint256"
        }
      ],
      "name": "addCoS",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "chambers",
      "outputs": [
        {
          "internalType": "string",
          "name": "cid",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "decryptionTime",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalCoS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
