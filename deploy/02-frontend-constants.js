const fs = require("fs")
const { ethers, network } = require("hardhat")

const frontend_contractLocation = "/home/arjun/raffle-frontend/constants/contractAddress.json"
const frontend_abiLocation = "../raffle-frontend/constants/abi.json"

module.exports = async () => {
  console.log("Updating Frontend")
  if (process.env.FRONTEND_UPDATE) {
    await storeContractAddress()
    await updateAbiFile()
  }
}

async function storeContractAddress() {
  const raffle = await ethers.getContract("Raffle")
  const contractAddressData = JSON.parse(fs.readFileSync(frontend_contractLocation, "utf-8"))
  const chainId = network.config.chainId.toString()
  if (chainId in contractAddressData) {
    if (!contractAddressData[chainId].includes(raffle.address)) {
      contractAddressData[chainId].push(raffle.address)
    }
  }
  {
    contractAddressData[chainId] = raffle.address
  }
  fs.writeFileSync(frontend_contractLocation, JSON.stringify(contractAddressData))
}

async function updateAbiFile() {
  const raffle = await ethers.getContract("Raffle")
  const ABI_FORMAT_TYPE = ethers.utils.FormatTypes.json
  const ABI = raffle.interface.format(ABI_FORMAT_TYPE)
  fs.writeFileSync(frontend_abiLocation, ABI)
}

module.exports.tags = ["all", "frontend"]
