/** @type import('hardhat/config').HardhatUserConfig */

require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const accounts = process.env.ACCOUNT_PRIVATE_KEY || ""
const url = process.env.GEORLI_NETWORK_URL || ""
const apikey = process.env.ETHERSCAN_API_KEY || ""
module.exports = {
  solidity: "0.8.7",
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      chainId: 31337,
      blockConformations: 1,
    },
    goerli: {
      chainId: 5,
      blockConformations: 6,
      url,
      accounts: [accounts],
    },
  },
  etherscan: {
    apiKey: {
      goerli: apikey,
    },
    customChains: [
      {
        network: "goerli",
        chainId: 5,
        urls: {
          apiURL: "https://api-rinkeby.etherscan.io/api",
          browserURL: "https://rinkeby.etherscan.io",
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 10000000,
  },
}
