const { network, ethers } = require("hardhat")
const { developmentChain } = require("../hardhat-helper.config")
module.exports = async ({ deployments, getNamedAccounts }) => {
  try {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const networkName = network.name

    console.log("First" + developmentChain.includes(networkName))
    const BASE_FEE = ethers.utils.parseEther("0.25")
    const GAS_PRICE_LINK = 1e8
    const args = [BASE_FEE, GAS_PRICE_LINK]
    if (developmentChain.includes(networkName)) {
      console.log("We are on local node")
      //deploy the mock
      await deploy("VRFCoordinatorV2Mock", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
      })
      log("----------------------Mock Deployed----------------------")
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports.tags = ["mocks", "all"]
