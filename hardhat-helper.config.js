const { ethers } = require("hardhat")
const developmentChain = ["hardhat", "localhost"]
const otherConfig = {
  minimumAmountToEnter: ethers.utils.parseEther("0.01"),
  gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
  updateInterval: "30",
  callbackGasLimit: "2500000",
  interval: "30",
}

const networkConfig = {
  5: {
    networkName: "goerli",
    subscriptionId: "4000",
    vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    ...otherConfig,
  },
  31337: {
    networkName: "localhost",
    ...otherConfig,
  },
}
module.exports = { developmentChain, networkConfig }
