const { network, ethers } = require("hardhat")
const { developmentChain, networkConfig } = require("../hardhat-helper.config")
const { verify } = require("../utils/verify")
module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const chainId = network.config.chainId
  const minimumAmountToEnter = networkConfig[chainId]["minimumAmountToEnter"]
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
  const interval = networkConfig[chainId]["interval"]
  const gasLane = networkConfig[chainId]["gasLane"]
  const FUND_AMOUNT = ethers.utils.parseEther("1")
  let vrfCoordinatorAddress
  let subscriptionId

  try {
    if (developmentChain.includes(network.name)) {
      const vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock")
      vrfCoordinatorAddress = vrfCoordinator.address
      const transactionResponse = await vrfCoordinator.createSubscription()
      const transactionReceipt = await transactionResponse.wait(1)
      subscriptionId = transactionReceipt.events[0].args.subId
      // Fund the subscription
      // Our mock makes it so we don't actually have to worry about sending fund
      await vrfCoordinator.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
      vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"]
      subscriptionId = networkConfig[chainId]["subscriptionId"]
    }
    const args = [
      minimumAmountToEnter,
      vrfCoordinatorAddress,
      subscriptionId,
      gasLane,
      callbackGasLimit,
      interval,
    ]

    const raffle = await deploy("Raffle", {
      from: deployer,
      args,
      log: true,
      waitConfirmations: developmentChain.includes(network.name)
        ? 1
        : network.config.blockConfirmations,
    })
    console.log("--------Deployed Raffle.sol-----------------------")
    if (!developmentChain.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
      await verify(raffle.address, args)
      console.log("----------verified---------")
    }
  } catch (error) {
    console.debug(error)
  }
}

module.exports.tags = ["main", "all"]
