const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChain, networkConfig } = require("../../hardhat-helper.config")

describe("Test for Raffle Smart Contract", () => {
  let raffle, deployer, raffleEntranceFee, minimumAmountToEnter
  developmentChain.includes(network.name)
    ? describe.skip
    : beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        raffle = await ethers.getContract("Raffle", deployer)
        raffleEntranceFee = await raffle.getRequiredAmountToEnter()
        minimumAmountToEnter = await raffle.getRequiredAmountToEnter()
      })
  describe("fulfillRandomWord", () => {
    it("enters deployers account in lottery and picks a winner and resets", async () => {
      const startingTimeStamp = await raffle.getLatestTimeStamp()
      return new Promise(async (resolve, reject) => {
        raffle.once("winnerList", async () => {
          console.log("Winner picked")
          try {
            const latestWinner = await raffle.getLatestWinner()

            const raffleState = await raffle.getRaffleState()
            const playersInRaffle = await raffle.getNumberOfPlayers()
            const lastTimeStamp = await raffle.getLatestTimeStamp()
            assert.equal(raffleState.toString(), "0")
            assert.equal(+playersInRaffle, 0)
            assert(lastTimeStamp > startingTimeStamp)
            assert.equal(latestWinner, deployer)
            const winnerEndingBalance = await accounts[1].getBalance()
            assert.equal(
              +winnerEndingBalance,
              +winnerStartingBalance.add(
                raffleEntranceFee.mul(totalAccountToEnter).add(raffleEntranceFee)
              )
            )
          } catch (error) {
            reject(error)
          }
          resolve()
        })
        await raffle.enterInLottery({ value: minimumAmountToEnter })
      })
    })
  })
})
