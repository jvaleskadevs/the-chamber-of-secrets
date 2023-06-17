require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    calibration: {
      chainId: 314159,
      url: "https://api.calibration.node.glif.io/rpc/v1",
      accounts: [ process.env.PK ]
    },
    filecoin: {
      chainId: 314,
      url: "https://api.node.glif.io",
      accounts: [ process.env.PK ]
    },
    mumbai: {
      url: process.env.ALCHEMY_MUMBAI_URL,
      accounts: [ process.env.PK ]
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.ETHERSCAN
    }
  }
};
