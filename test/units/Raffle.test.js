const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChain, networkConfig } = require("../../hardhat-helper.config")
!developmentChain.includes(network.name)
  ? describe.skip
  : describe("Test for Raffle Smart Contract", () => {
      let raffle, vrfCoordinatorV2Mock, deployer, minimumAmountToEnter, interval, raffleEntranceFee

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        minimumAmountToEnter = networkConfig[network.config.chainId]["minimumAmountToEnter"]
        interval = networkConfig[network.config.chainId]["interval"]
        await deployments.fixture(["all"])
        raffle = await ethers.getContract("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        raffleEntranceFee = await raffle.getRequiredAmountToEnter()
      })

      describe("Constrcution Initilization", async () => {
        it("check the constructor initilization ", async () => {
          const raffleState = (await raffle.getRaffleState()).toString()
          assert.equal(raffleState, "0")
          assert.equal((await raffle.getRequiredAmountToEnter()).toString(), minimumAmountToEnter)
        })
      })
      describe("enterInLottery", () => {
        it("checks if the miniumum amount required fails", async function () {
          await expect(raffle.enterInLottery()).to.be.revertedWith("Raffle__NoEnoughETH")
        })
        it("enter the deployer in the lottery", async function () {
          await raffle.enterInLottery({
            value: minimumAmountToEnter,
          })
          assert.equal(await raffle.getIndexedPlayer(0), deployer)
        })
        it("emits the event when a player is registered", async function () {
          await expect(
            raffle.enterInLottery({
              value: minimumAmountToEnter,
            })
          ).to.emit(raffle, "lotteryInEnter")
        })
        it("Fail to enter in raffle, when it is in calculating state", async function () {
          await raffle.enterInLottery({ value: minimumAmountToEnter })
          await ethers.provider.send("evm_increaseTime", [+interval + 1])
          await ethers.provider.send("evm_mine", [])
          await raffle.performUpkeep([])
          await expect(raffle.enterInLottery({ value: minimumAmountToEnter })).to.be.revertedWith(
            "Raffle__NotOpen"
          )
        })
      })

      describe('"Checks upkeep function', () => {
        it("returns false ie fails if no eth is send by people", async function () {
          await ethers.provider.send("evm_increaseTime", [+interval + 1])
          await ethers.provider.send("evm_mine", [])
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
          assert(!upkeepNeeded)
        })
        it("returns false if raffle isnot open", async function () {
          await raffle.enterInLottery({ value: minimumAmountToEnter })
          await ethers.provider.send("evm_increaseTime", [+interval + 1])
          await ethers.provider.send("evm_mine", [])
          await raffle.performUpkeep("0x")
          const raffleState = await raffle.getRaffleState()
          assert.equal(raffleState.toString(), "1")
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
          assert(!upkeepNeeded)
        })
      })
      describe("Checks performUpkeep", () => {
        it("runs only if checkUpKeep is true", async function () {
          await raffle.enterInLottery({ value: minimumAmountToEnter })
          await ethers.provider.send("evm_increaseTime", [+interval + 1])
          await ethers.provider.send("evm_mine", [])
          const transactionResponse = await raffle.performUpkeep("0x")
          assert(transactionResponse)
        })
        it("reverts if checkupkeep isnot neede", async function () {
          await expect(raffle.performUpkeep("0x")).to.be.revertedWith("Raffle__UpKeepNotNeeded")
        })
        it("checks if state is calculating, requestRandomWord and emits an event", async function () {
          await raffle.enterInLottery({ value: minimumAmountToEnter })
          await ethers.provider.send("evm_increaseTime", [+interval + 1])
          await ethers.provider.send("evm_mine", [])
          const transactionResponse = await raffle.performUpkeep("0x")
          const transactionReceipt = await transactionResponse.wait(1)
          const raffleState = await raffle.getRaffleState()
          assert(+transactionReceipt.events[1].args.requestId > 0)
          assert.equal(raffleState.toString(), "1")
        })
      })
      describe("fulfillRandomWord", () => {
        beforeEach(async function () {
          await raffle.enterInLottery({ value: minimumAmountToEnter })
          await ethers.provider.send("evm_increaseTime", [+interval + 1])
          await ethers.provider.send("evm_mine", [])
        })
        it("can only be called after fulfillRandomWord", async function () {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith("nonexistent request")
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
          ).to.be.revertedWith("nonexistent request")
        })
        it("enters multiple account in lottery and picks a winner and resets", async () => {
          const accounts = await ethers.getSigners()

          const startIndexOfPersonToEnterLottery = 1
          const totalAccountToEnter = 3
          for (
            let index = startIndexOfPersonToEnterLottery;
            index < startIndexOfPersonToEnterLottery + totalAccountToEnter;
            index++
          ) {
            const raffleConnectedAccount = raffle.connect(accounts[index])
            raffleConnectedAccount.enterInLottery({ value: minimumAmountToEnter })
          }
          const startingTimeStamp = await raffle.getLatestTimeStamp()
          return new Promise(async (resolve, reject) => {
            raffle.once("winnerList", async () => {
              console.log("Winner picked")
              try {
                const latestWinner = await raffle.getLatestWinner()
                console.log(latestWinner)

                const raffleState = await raffle.getRaffleState()
                const playersInRaffle = await raffle.getNumberOfPlayers()
                const lastTimeStamp = await raffle.getLatestTimeStamp()
                assert.equal(raffleState.toString(), "0")
                assert.equal(+playersInRaffle, 0)
                assert(lastTimeStamp > startingTimeStamp)
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

            const transactionResponse = await raffle.performUpkeep("0x")
            const transactionReceipt = await transactionResponse.wait(1)
            const requestId = transactionReceipt.events[1].args.requestId
            const winnerStartingBalance = await accounts[1].getBalance()
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffle.address)
          })
        })
      })
    })
