// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";


Error Raffle__NoEnoughETH()
Error Raffel__Transfer_Failed()
Error Raffle__NotOpen()
contract Raffle is VRFConsumerBaseV2,AutomationCompatibleInterface{
    enum RaffelState{
        OPENED,
        CALCULATING
    }
    event lotteryInEnter(address indexed player)
    event RequestedRaffleWinner(uint256 requestId)
    event winnerList(address winner)

    address[] payable s_players
    uint256 private immutable i_minimum_to_enter;
    VRFCoordinatorV2Interface private immutable vrfCoordinatorV2;
    uint32[] private constant NUM_WORDS = 1;
    uint32[] private constant requestConfirmations = 3;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint32 public immutable i_interval;
    bytes32 immutable i_gasLane
    RaffelState private s_state
    uint256 private s_lastTimeStamp;
    uint256 private s_latestWinner;
    constructor(
        uint256 min,VRFConsumerBaseV2 vrfCoordinator,
        uint256 requestId,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit
        uint32 updateInterval
        ) VRFConsumerBaseV2(vrfCoordinator) { {
        i_minimum_to_enter = min
        vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinator)
        i_subscriptionId = subscriptionId
        i_gasLane = gasLane
        i_callbackGasLimit = callbackGasLimit
        i_interval = updateInterval;
        s_state = RaffelState.OPENED
        s_lastTimeStamp = block.timestamp

    }

    function enterInLottery() public payable {
        if(msg.value< i_minimum_to_enter) { revert Raffle__NoEnoughETH()}
        if((s_RaffelState != RaffelState.OPENED)) {revert Raffle__NotOpen()}
        s_players.push(payable(msg.sender))
        emit lotteryInEnter(msg.sender)
    }

    function getRequiredAmountToEnter () public view returns(uint256){
        return i_minimum_to_enter
    }

     // Assumes the subscription is funded sufficiently.
    function requestRandomWinner() external onlyOwner {
        // Will revert if subscription is not set and funded.
       uint256 requestId = COORDINATOR.requestRandomWords(
            i_keyLane,
            i_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId)

    }

    function fulfillRandomWords(
         uint256 /*requestId*/ ,
        uint256[] memory randomWords
    ) internal override {
        uint256 winner = s_players[randomWords[0] % s_players.length]
        s_latestWinner = winner
        s_state = RaffelState.OPENED
        s_players =  new address payable [](0)
        s_lastTimeStamp = block.timestamp
        
        (bool sucess,) = payable(s_latestWinner).call{value:address(this).balance}("")
        if(!sucess) revert Raffel__Transfer_Failed()
        emit(s_latestWinner)
    }

    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool isOpened = (s_state == RaffelState.OPENED);
        bool timePassed =  ( block.timestamp - lastTimeStamp) > interval;
        bool hasBalance = address(this).balance > 0;
        bool isNotEmpty = s_players.length >0

        upkeepNeeded = isOpened && timePassed && hasBalance && isNotEmpty
    }

  function performUpkeep(bytes calldata /* performData */) external override {}
    function getLatestWinner () public view returns (uint256) {
        return s_latestWinner
    }
}

