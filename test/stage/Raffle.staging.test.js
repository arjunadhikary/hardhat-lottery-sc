const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChain, networkConfig } = require("../../hardhat-helper.config")

developmentChain.includes(network.name)
  ? describe.skip
  : describe("Test for Raffle Smart Contract", () => {
      let raffle, deployer, raffleEntranceFee
      console.log(network.name)
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        raffle = await ethers.getContract("Raffle", deployer)
        raffleEntranceFee = await raffle.getRequiredAmountToEnter()
      })
      describe("fulfillRandomWord", () => {
        it("enters deployers account in lottery and picks a winner and resets in testchain", async () => {
          const startingTimeStamp = await raffle.getLatestTimeStamp()
          const accounts = await ethers.getSigners()
          return new Promise(async (resolve, reject) => {
            raffle.once("winnerList", async () => {
              console.log("Winner picked")
              try {
                setTimeout(async () => {
                  const latestWinner = await raffle.getLatestWinner()
                  const raffleState = await raffle.getRaffleState()
                  const playersInRaffle = await raffle.getNumberOfPlayers()
                  console.log(latestWinner)
                  // const lastTimeStamp = await raffle.getLatestTimeStamp()
                  console.log(
                    `Raffle is in ${
                      raffleState.toString() === "0" ? "Open" : "Calculating"
                    } with ${playersInRaffle} players`
                  )
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(playersInRaffle.toString(), "0")
                  assert.equal(latestWinner, accounts[0].address)
                  const winnerEndingBalance = await accounts[0].getBalance()
                  assert.equal(
                    winnerEndingBalance.toString(),
                    winnerStartingBalance.add(raffleEntranceFee).toString()
                  )
                  // console.log(lastTimeStamp.toString())

                  resolve()
                }, 10000)
              } catch (error) {
                reject(error)
              }
            })
            console.log("Entering in lottery......")
            const tx = await raffle.enterInLottery({ value: raffleEntranceFee })
            await tx.wait(1)
            console.log("Ok, time to wait...")
            const winnerStartingBalance = await accounts[0].getBalance()
          })
        })
      })
    })
