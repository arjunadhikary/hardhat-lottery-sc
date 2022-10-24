const { ethers } = require("hardhat")
const developmentChain = ["hardhat", "localhost"]
const otherConfig = {
  minimumAmountToEnter: ethers.utils.parseEther("0.01"),
  updateInterval: "30",
  callbackGasLimit: "500000",
  interval: "30",
}

const networkConfig = {
  5: {
    networkName: "goerli",
    subscriptionId: "5183",
    vrfCoordinator: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    ...otherConfig,
  },
  31337: {
    networkName: "localhost",
    ...otherConfig,
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
  },
}
module.exports = { developmentChain, networkConfig }
