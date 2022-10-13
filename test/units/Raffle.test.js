const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChain, networkConfig } = require("../../hardhat-helper.config")
!developmentChain.includes(network.name)
  ? describe.skip
  : describe("Test for Raffle Smart Contract", async () => {
      let raffle, vrfCoordinatorV2Mock, deployer
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        raffle = await ethers.getContract("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
      })

      describe("Constrcution Initilization", async () => {
        it("check the constructor initilization ", async () => {
          const raffleState = (await raffle.getRaffleState()).toString()
          assert.equal(raffleState, "0")
          assert.equal(
            (await raffle.getRequiredAmountToEnter()).toString(),
            networkConfig[network.config.chainId]["minimumAmountToEnter"]
          )
        })
      })
      describe("enterInLottery", () => {
        it("checks if the miniumum amount required fails", async function () {
          await expect(raffle.enterInLottery()).to.be.revertedWith("Raffle__NoEnoughETH")
        })
        it("enter the deployer in the lottery", async function () {
          await raffle.enterInLottery({
            value: networkConfig[network.config.chainId]["minimumAmountToEnter"],
          })
          assert.equal(await raffle.getIndexedPlayer(0), deployer)
        })
        it("emits the event when a player is registered", async function () {
          await expect(
            raffle.enterInLottery({
              value: networkConfig[network.config.chainId]["minimumAmountToEnter"],
            })
          ).to.emit(raffle, "lotteryInEnter")
        })
      })
    })
