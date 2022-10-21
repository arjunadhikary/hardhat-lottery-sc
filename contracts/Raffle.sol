// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error Raffle__NoEnoughETH();
error Raffel__Transfer_Failed();
error Raffle__NotOpen();
error Raffle__UpKeepNotNeeded(uint256 contractBalance, uint256 playersLength, uint256 raffleState);

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    enum RaffleState {
        OPENED,
        CALCULATING
    }

    address payable[] s_players;
    uint256 private immutable i_minimum_to_enter;
    VRFCoordinatorV2Interface private immutable vrfCoordinatorV2;
    uint16 private constant NUM_WORDS = 1;
    uint16 private constant requestConfirmations = 3;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint32 public immutable i_interval;
    bytes32 immutable i_gasLane;
    RaffleState private s_state;
    uint256 private s_lastTimeStamp;
    address private s_latestWinner;

    event lotteryInEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event winnerList(address indexed winner);

    /**function declerations */
    constructor(
        uint256 min,
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        uint32 updateInterval
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_minimum_to_enter = min;
        vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinator);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        i_interval = updateInterval;
        s_state = RaffleState.OPENED;
        s_lastTimeStamp = block.timestamp;
    }

    function enterInLottery() public payable {
        if (msg.value < i_minimum_to_enter) {
            revert Raffle__NoEnoughETH();
        }
        if ((s_state != RaffleState.OPENED)) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit lotteryInEnter(msg.sender);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        address winner = s_players[randomWords[0] % s_players.length];
        s_latestWinner = winner;
        s_state = RaffleState.OPENED;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;

        (bool success, ) = payable(s_latestWinner).call{value: address(this).balance}("");
        if (!success) revert Raffel__Transfer_Failed();
        emit winnerList(winner);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpened = (s_state == RaffleState.OPENED);
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasBalance = address(this).balance > 0;
        bool isNotEmpty = s_players.length > 0;
        upkeepNeeded = (isOpened && timePassed && hasBalance && isNotEmpty);
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_state)
            );
        }
        s_state = RaffleState.CALCULATING;
        uint256 requestId = vrfCoordinatorV2.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            requestConfirmations,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    /**
     * views and pure function
     */
    function getLatestWinner() public view returns (address) {
        return s_latestWinner;
    }

    function getRequiredAmountToEnter() public view returns (uint256) {
        return i_minimum_to_enter;
    }

    function getIndexedPlayer(uint256 index) public view returns (address) {
        return (s_players[index]);
    }

    function getRaffleState() public view returns (uint256) {
        return uint256(s_state);
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }
}
