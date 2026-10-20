// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  ChattrRooms
 * @notice Shared-USDC room registry with m-of-n approval, timed payouts,
 *         split payout, and captain attestation.
 *
 * Key design decisions
 * ─────────────────────
 * • All room funds move exclusively through the 6-decimal ERC-20 interface.
 *   msg.value is never touched for room money.
 * • Amounts are always in USDC base units (1 = 0.000001 USDC).
 * • Fee is fixed at constructor time, capped at 100 bps (1%).
 * • Pull-payment is used: balances accumulate inside the contract, creators
 *   call execute/payShares to move funds out.
 * • Members are fixed at room creation (v1).
 */
contract ChattrRooms is ReentrancyGuard {

    // ─── Constants ─────────────────────────────────────────────────────────

    uint8   public constant MAX_MEMBERS = 8;
    uint16  public constant MAX_FEE_BPS = 100;   // 1 %
    uint16  public constant BPS_DENOM   = 10_000;

    // ─── Types ─────────────────────────────────────────────────────────────

    enum Status { Pending, Executed, Cancelled }

    struct Room {
        string    name;
        address   captain;
        address[] members;
        uint8     threshold;
        uint256   balance;
        // shares (parallel arrays, length == members.length or 0)
        address[] shareMembers;
        uint16[]  shareBps;
    }

    struct Request {
        uint256 roomId;
        address to;
        uint256 amount;
        string  memo;
        uint64  unlockAt;
        uint256 approvalCount;
        Status  status;
        // attestation
        bool    attested;
        bool    delivered;
        string  attestNote;
    }

    // ─── Storage ───────────────────────────────────────────────────────────

    IERC20  public immutable usdc;
    address public immutable treasury;
    uint16  public immutable feeBps;

    uint256 public roomCount;
    uint256 public requestCount;

    mapping(uint256 => Room)    private _rooms;
    mapping(uint256 => Request) private _requests;

    /// roomId  => member => has voted on requestId => bool
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) private _voted;

    // ─── Events ────────────────────────────────────────────────────────────

    event RoomCreated(
        uint256 indexed roomId,
        address indexed captain,
        string  name,
        address[] members,
        uint8   threshold
    );
    event Deposited(
        uint256 indexed roomId,
        address indexed sender,
        uint256 amount
    );
    event Requested(
        uint256 indexed roomId,
        uint256 indexed requestId,
        address indexed to,
        uint256 amount,
        string  memo,
        uint64  unlockAt
    );
    event Approved(
        uint256 indexed roomId,
        uint256 indexed requestId,
        address indexed voter,
        uint256 approvalCount
    );
    event Executed(
        uint256 indexed roomId,
        uint256 indexed requestId,
        address indexed to,
        uint256 amount,
        uint256 fee
    );
    event FeeTaken(
        uint256 indexed roomId,
        uint256 amount
    );
    event Attested(
        uint256 indexed roomId,
        uint256 indexed requestId,
        address indexed captain,
        bool    delivered,
        string  note
    );
    event SharesPaid(
        uint256 indexed roomId,
        uint256 totalAmount,
        uint256 fee
    );

    // ─── Errors ────────────────────────────────────────────────────────────

    error TooManyMembers();
    error BadThreshold();
    error ZeroMembers();
    error EmptyName();
    error NotMember();
    error NotCaptain();
    error RoomNotFound();
    error RequestNotFound();
    error WrongRoom();
    error ZeroPayee();
    error ZeroAmount();
    error AmountExceedsBalance();
    error AlreadyVoted();
    error NotPending();
    error ThresholdNotMet();
    error TimeLocked();
    error AlreadyAttested();
    error NotExecuted();
    error BadShares();
    error TransferFailed();
    error FeeTooHigh();

    // ─── Constructor ───────────────────────────────────────────────────────

    /**
     * @param _usdc     6-decimal ERC-20 used for all room funds (USDC on Arc).
     * @param _treasury Protocol fee recipient.
     * @param _feeBps   Fee in basis points, must be <= MAX_FEE_BPS (100).
     */
    constructor(address _usdc, address _treasury, uint16 _feeBps) {
        require(_usdc     != address(0), "zero usdc");
        require(_treasury != address(0), "zero treasury");
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        usdc     = IERC20(_usdc);
        treasury = _treasury;
        feeBps   = _feeBps;
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    function _isMember(uint256 roomId, address who) internal view returns (bool) {
        address[] storage members = _rooms[roomId].members;
        for (uint256 i; i < members.length; ++i) {
            if (members[i] == who) return true;
        }
        return false;
    }

    function _requireRoom(uint256 roomId) internal view {
        if (roomId >= roomCount) revert RoomNotFound();
    }

    function _requireRequest(uint256 requestId) internal view {
        if (requestId >= requestCount) revert RequestNotFound();
    }

    function _fee(uint256 amount) internal view returns (uint256) {
        return (amount * feeBps) / BPS_DENOM;
    }

    // ─── Core Actions ──────────────────────────────────────────────────────

    /**
     * @notice Create a new room. Caller becomes captain. Members are used exactly as
     *         given, so the captain must include their own address if they intend to vote.
     */
    function createRoom(
        string calldata name,
        address[] calldata members,
        uint8 threshold
    ) external returns (uint256 roomId) {
        if (bytes(name).length == 0)        revert EmptyName();
        if (members.length == 0)             revert ZeroMembers();
        if (members.length > MAX_MEMBERS)    revert TooManyMembers();
        if (threshold == 0 || threshold > members.length) revert BadThreshold();

        roomId = roomCount++;
        Room storage r = _rooms[roomId];
        r.name      = name;
        r.captain   = msg.sender;
        r.threshold = threshold;
        for (uint256 i; i < members.length; ++i) {
            r.members.push(members[i]);
        }

        emit RoomCreated(roomId, msg.sender, name, members, threshold);
    }

    /**
     * @notice Anyone may top up a room. Pulls USDC via transferFrom.
     */
    function deposit(uint256 roomId, uint256 amount) external nonReentrant {
        _requireRoom(roomId);
        if (amount == 0) revert ZeroAmount();

        bool ok = usdc.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        _rooms[roomId].balance += amount;
        emit Deposited(roomId, msg.sender, amount);
    }

    /**
     * @notice Member creates a spend request.
     * @param unlockAt Unix timestamp; 0 means executable immediately.
     */
    function request(
        uint256 roomId,
        address to,
        uint256 amount,
        string calldata memo,
        uint64 unlockAt
    ) external returns (uint256 requestId) {
        _requireRoom(roomId);
        if (!_isMember(roomId, msg.sender)) revert NotMember();
        if (to == address(0))               revert ZeroPayee();
        if (amount == 0)                    revert ZeroAmount();
        if (amount > _rooms[roomId].balance) revert AmountExceedsBalance();

        requestId = requestCount++;
        Request storage req = _requests[requestId];
        req.roomId   = roomId;
        req.to       = to;
        req.amount   = amount;
        req.memo     = memo;
        req.unlockAt = unlockAt;
        req.status   = Status.Pending;

        emit Requested(roomId, requestId, to, amount, memo, unlockAt);
    }

    /**
     * @notice Member casts an approval vote. One vote per member, reverts on double.
     */
    function approve(uint256 roomId, uint256 requestId) external {
        _requireRoom(roomId);
        _requireRequest(requestId);
        if (_requests[requestId].roomId != roomId) revert WrongRoom();
        if (!_isMember(roomId, msg.sender))         revert NotMember();
        if (_requests[requestId].status != Status.Pending) revert NotPending();
        if (_voted[roomId][msg.sender][requestId])  revert AlreadyVoted();

        _voted[roomId][msg.sender][requestId] = true;
        uint256 count = ++_requests[requestId].approvalCount;

        emit Approved(roomId, requestId, msg.sender, count);
    }

    /**
     * @notice Execute a request once the threshold is met and the time lock has passed.
     *         Pays the fee to treasury, then pays the payee.
     */
    function execute(uint256 roomId, uint256 requestId) external nonReentrant {
        _requireRoom(roomId);
        _requireRequest(requestId);

        Request storage req = _requests[requestId];
        Room    storage  r  = _rooms[roomId];

        if (req.roomId != roomId)                   revert WrongRoom();
        if (req.status != Status.Pending)          revert NotPending();
        if (req.approvalCount < r.threshold)        revert ThresholdNotMet();
        if (req.unlockAt != 0 && block.timestamp < req.unlockAt) revert TimeLocked();
        if (req.amount > r.balance)                 revert AmountExceedsBalance();

        uint256 feeAmt  = _fee(req.amount);
        uint256 payout  = req.amount - feeAmt;

        r.balance -= req.amount;
        req.status = Status.Executed;

        if (feeAmt > 0) {
            bool fOk = usdc.transfer(treasury, feeAmt);
            if (!fOk) revert TransferFailed();
            emit FeeTaken(roomId, feeAmt);
        }

        bool pOk = usdc.transfer(req.to, payout);
        if (!pOk) revert TransferFailed();

        emit Executed(roomId, requestId, req.to, payout, feeAmt);
    }

    /**
     * @notice Captain attests outcome of an executed request. Fires once, moves no money.
     */
    function attest(
        uint256 roomId,
        uint256 requestId,
        bool delivered,
        string calldata note
    ) external {
        _requireRoom(roomId);
        _requireRequest(requestId);
        if (_requests[requestId].roomId != roomId) revert WrongRoom();
        if (msg.sender != _rooms[roomId].captain) revert NotCaptain();
        if (_requests[requestId].status != Status.Executed) revert NotExecuted();
        if (_requests[requestId].attested) revert AlreadyAttested();

        _requests[requestId].attested  = true;
        _requests[requestId].delivered = delivered;
        _requests[requestId].attestNote = note;

        emit Attested(roomId, requestId, msg.sender, delivered, note);
    }

    /**
     * @notice Captain sets share percentages for members (must sum to 10000 bps).
     */
    function setShares(
        uint256 roomId,
        address[] calldata members,
        uint16[] calldata bps
    ) external {
        _requireRoom(roomId);
        if (msg.sender != _rooms[roomId].captain) revert NotCaptain();
        if (members.length == 0 || members.length != bps.length) revert BadShares();

        uint256 total;
        for (uint256 i; i < bps.length; ++i) {
            total += bps[i];
        }
        if (total != BPS_DENOM) revert BadShares();

        Room storage r = _rooms[roomId];
        delete r.shareMembers;
        delete r.shareBps;
        for (uint256 i; i < members.length; ++i) {
            r.shareMembers.push(members[i]);
            r.shareBps.push(bps[i]);
        }
    }

    /**
     * @notice Execute a split payout to all share holders in one call.
     *         Fee applies to the total amount.
     */
    function payShares(uint256 roomId, uint256 amount) external nonReentrant {
        _requireRoom(roomId);
        if (!_isMember(roomId, msg.sender)) revert NotMember();
        if (amount == 0)                    revert ZeroAmount();

        Room storage r = _rooms[roomId];
        if (r.shareMembers.length == 0)     revert BadShares();
        if (amount > r.balance)             revert AmountExceedsBalance();

        uint256 feeAmt = _fee(amount);
        uint256 net    = amount - feeAmt;

        r.balance -= amount;

        if (feeAmt > 0) {
            bool fOk = usdc.transfer(treasury, feeAmt);
            if (!fOk) revert TransferFailed();
            emit FeeTaken(roomId, feeAmt);
        }

        for (uint256 i; i < r.shareMembers.length; ++i) {
            uint256 share = (net * r.shareBps[i]) / BPS_DENOM;
            if (share > 0) {
                bool ok = usdc.transfer(r.shareMembers[i], share);
                if (!ok) revert TransferFailed();
            }
        }

        emit SharesPaid(roomId, amount, feeAmt);
    }

    // ─── Views ─────────────────────────────────────────────────────────────

    struct RoomView {
        string    name;
        address   captain;
        address[] members;
        uint8     threshold;
        uint256   balance;
        address[] shareMembers;
        uint16[]  shareBps;
    }

    function getRoom(uint256 roomId) external view returns (RoomView memory v) {
        _requireRoom(roomId);
        Room storage r = _rooms[roomId];
        v.name         = r.name;
        v.captain      = r.captain;
        v.members      = r.members;
        v.threshold    = r.threshold;
        v.balance      = r.balance;
        v.shareMembers = r.shareMembers;
        v.shareBps     = r.shareBps;
    }

    struct RequestView {
        uint256 roomId;
        address to;
        uint256 amount;
        string  memo;
        uint64  unlockAt;
        uint256 approvalCount;
        Status  status;
        bool    attested;
        bool    delivered;
        string  attestNote;
    }

    function getRequest(uint256 requestId) external view returns (RequestView memory v) {
        _requireRequest(requestId);
        Request storage req = _requests[requestId];
        v.roomId        = req.roomId;
        v.to            = req.to;
        v.amount        = req.amount;
        v.memo          = req.memo;
        v.unlockAt      = req.unlockAt;
        v.approvalCount = req.approvalCount;
        v.status        = req.status;
        v.attested      = req.attested;
        v.delivered     = req.delivered;
        v.attestNote    = req.attestNote;
    }

    function hasVoted(uint256 roomId, address who, uint256 requestId) external view returns (bool) {
        return _voted[roomId][who][requestId];
    }
}
