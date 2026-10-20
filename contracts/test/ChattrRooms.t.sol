// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../ChattrRooms.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Minimal 6-decimal mock token.
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract ChattrRoomsTest is Test {
    ChattrRooms rooms;
    MockUSDC    usdc;

    address captain  = address(0xA1);
    address memberB  = address(0xB1);
    address memberC  = address(0xC1);
    address payee    = address(0xD1);
    address treasury = address(0xE1);
    address stranger = address(0xF1);

    uint16 constant FEE_BPS = 50;  // 0.5%
    uint256 constant DEPOSIT = 10_000_000; // 10 USDC

    address[] members3;

    function setUp() public {
        usdc  = new MockUSDC();
        rooms = new ChattrRooms(address(usdc), treasury, FEE_BPS);

        members3 = new address[](3);
        members3[0] = captain;
        members3[1] = memberB;
        members3[2] = memberC;

        // Fund everyone and approve
        address[4] memory funders = [captain, memberB, memberC, stranger];
        for (uint256 i; i < funders.length; ++i) {
            usdc.mint(funders[i], 100_000_000); // 100 USDC
            vm.prank(funders[i]);
            usdc.approve(address(rooms), type(uint256).max);
        }
    }

    // helper: create room and deposit
    function _setup() internal returns (uint256 roomId) {
        vm.prank(captain);
        roomId = rooms.createRoom("Alpha", members3, 2);

        vm.prank(captain);
        rooms.deposit(roomId, DEPOSIT);
    }

    // ── createRoom ────────────────────────────────────────────────────────

    function test_CreateRoom() public {
        vm.prank(captain);
        uint256 id = rooms.createRoom("Alpha", members3, 2);
        assertEq(id, 0);
        assertEq(rooms.roomCount(), 1);

        ChattrRooms.RoomView memory r = rooms.getRoom(id);
        assertEq(r.name,      "Alpha");
        assertEq(r.captain,   captain);
        assertEq(r.threshold, 2);
        assertEq(r.members.length, 3);
    }

    function test_CreateRoom_RevertTooManyMembers() public {
        address[] memory big = new address[](9);
        vm.prank(captain);
        vm.expectRevert(ChattrRooms.TooManyMembers.selector);
        rooms.createRoom("X", big, 1);
    }

    function test_CreateRoom_RevertBadThreshold() public {
        vm.prank(captain);
        vm.expectRevert(ChattrRooms.BadThreshold.selector);
        rooms.createRoom("X", members3, 4); // threshold > members.length
    }

    function test_CreateRoom_RevertBadThresholdZero() public {
        vm.prank(captain);
        vm.expectRevert(ChattrRooms.BadThreshold.selector);
        rooms.createRoom("X", members3, 0);
    }

    // ── deposit ───────────────────────────────────────────────────────────

    function test_Deposit() public {
        uint256 id = _setup();
        assertEq(rooms.getRoom(id).balance, DEPOSIT);
    }

    function test_Deposit_ZeroReverts() public {
        uint256 id = _setup();
        vm.prank(captain);
        vm.expectRevert(ChattrRooms.ZeroAmount.selector);
        rooms.deposit(id, 0);
    }

    // ── request ───────────────────────────────────────────────────────────

    function test_Request() public {
        uint256 id = _setup();

        vm.prank(memberB);
        uint256 rid = rooms.request(id, payee, 1_000_000, "invoice #1", 0);
        assertEq(rid, 0);

        ChattrRooms.RequestView memory req = rooms.getRequest(rid);
        assertEq(req.roomId, id);
        assertEq(req.to,     payee);
        assertEq(req.amount, 1_000_000);
        assertEq(uint8(req.status), uint8(ChattrRooms.Status.Pending));
    }

    function test_Request_ZeroPayeeReverts() public {
        uint256 id = _setup();
        vm.prank(memberB);
        vm.expectRevert(ChattrRooms.ZeroPayee.selector);
        rooms.request(id, address(0), 1_000_000, "x", 0);
    }

    function test_Request_ZeroAmountReverts() public {
        uint256 id = _setup();
        vm.prank(memberB);
        vm.expectRevert(ChattrRooms.ZeroAmount.selector);
        rooms.request(id, payee, 0, "x", 0);
    }

    function test_Request_ExceedsBalanceReverts() public {
        uint256 id = _setup();
        vm.prank(memberB);
        vm.expectRevert(ChattrRooms.AmountExceedsBalance.selector);
        rooms.request(id, payee, DEPOSIT + 1, "x", 0);
    }

    function test_Request_NonMemberReverts() public {
        uint256 id = _setup();
        vm.prank(stranger);
        vm.expectRevert(ChattrRooms.NotMember.selector);
        rooms.request(id, payee, 1_000_000, "x", 0);
    }

    // ── approve & execute (happy path) ────────────────────────────────────

    function test_ApproveAndExecute() public {
        uint256 id  = _setup();
        uint256 amt = 1_000_000; // 1 USDC

        vm.prank(memberB);
        uint256 rid = rooms.request(id, payee, amt, "pay vendor", 0);

        // first approval
        vm.prank(captain);
        rooms.approve(id, rid);
        assertEq(rooms.getRequest(rid).approvalCount, 1);

        // second approval → threshold met
        vm.prank(memberB);
        rooms.approve(id, rid);
        assertEq(rooms.getRequest(rid).approvalCount, 2);

        uint256 payeeBefore    = usdc.balanceOf(payee);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        vm.prank(captain);
        rooms.execute(id, rid);

        uint256 feeAmt    = (amt * FEE_BPS) / 10_000;
        uint256 netPayout = amt - feeAmt;

        assertEq(usdc.balanceOf(payee)    - payeeBefore,    netPayout, "payee got net");
        assertEq(usdc.balanceOf(treasury) - treasuryBefore, feeAmt,    "treasury got fee");
        assertEq(uint8(rooms.getRequest(rid).status), uint8(ChattrRooms.Status.Executed));
    }

    function test_DoubleApprovalReverts() public {
        uint256 id = _setup();
        vm.prank(memberB);
        uint256 rid = rooms.request(id, payee, 1_000_000, "x", 0);

        vm.prank(captain);
        rooms.approve(id, rid);

        vm.prank(captain);
        vm.expectRevert(ChattrRooms.AlreadyVoted.selector);
        rooms.approve(id, rid);
    }

    function test_ExecuteBeforeThresholdReverts() public {
        uint256 id = _setup();
        vm.prank(memberB);
        uint256 rid = rooms.request(id, payee, 1_000_000, "x", 0);

        // only 1 of 2 required
        vm.prank(captain);
        rooms.approve(id, rid);

        vm.prank(captain);
        vm.expectRevert(ChattrRooms.ThresholdNotMet.selector);
        rooms.execute(id, rid);
    }

    // ── timed payout ──────────────────────────────────────────────────────

    function test_TimeLock_BlocksAndReleases() public {
        uint256 id = _setup();
        uint64 unlock = uint64(block.timestamp + 600); // 10 min

        vm.prank(memberB);
        uint256 rid = rooms.request(id, payee, 1_000_000, "timed", unlock);

        vm.prank(captain);  rooms.approve(id, rid);
        vm.prank(memberB);  rooms.approve(id, rid);

        // should revert before unlock
        vm.prank(memberC);
        vm.expectRevert(ChattrRooms.TimeLocked.selector);
        rooms.execute(id, rid);

        // warp past unlock
        vm.warp(block.timestamp + 601);

        vm.prank(memberC);
        rooms.execute(id, rid); // should succeed now
        assertEq(uint8(rooms.getRequest(rid).status), uint8(ChattrRooms.Status.Executed));
    }

    // ── attest ────────────────────────────────────────────────────────────

    function _executeRequest(uint256 id) internal returns (uint256 rid) {
        vm.prank(memberB);
        rid = rooms.request(id, payee, 1_000_000, "x", 0);
        vm.prank(captain); rooms.approve(id, rid);
        vm.prank(memberB); rooms.approve(id, rid);
        vm.prank(captain); rooms.execute(id, rid);
    }

    function test_Attest() public {
        uint256 id  = _setup();
        uint256 rid = _executeRequest(id);

        vm.prank(captain);
        rooms.attest(id, rid, true, "all good");

        ChattrRooms.RequestView memory req = rooms.getRequest(rid);
        assertTrue(req.attested);
        assertTrue(req.delivered);
        assertEq(req.attestNote, "all good");
    }

    function test_Attest_BeforeExecutionReverts() public {
        uint256 id = _setup();
        vm.prank(memberB);
        uint256 rid = rooms.request(id, payee, 1_000_000, "x", 0);

        vm.prank(captain);
        vm.expectRevert(ChattrRooms.NotExecuted.selector);
        rooms.attest(id, rid, true, "x");
    }

    function test_Attest_TwiceReverts() public {
        uint256 id  = _setup();
        uint256 rid = _executeRequest(id);

        vm.prank(captain); rooms.attest(id, rid, true, "ok");

        vm.prank(captain);
        vm.expectRevert(ChattrRooms.AlreadyAttested.selector);
        rooms.attest(id, rid, false, "no");
    }

    function test_Attest_NonCaptainReverts() public {
        uint256 id  = _setup();
        uint256 rid = _executeRequest(id);

        vm.prank(memberB);
        vm.expectRevert(ChattrRooms.NotCaptain.selector);
        rooms.attest(id, rid, true, "x");
    }

    // ── shares ────────────────────────────────────────────────────────────

    function test_SetShares_RevertIfNotSumTo10000() public {
        uint256 id = _setup();
        address[] memory m = new address[](2);
        m[0] = captain; m[1] = memberB;
        uint16[] memory b = new uint16[](2);
        b[0] = 5000; b[1] = 4000; // 9000, not 10000

        vm.prank(captain);
        vm.expectRevert(ChattrRooms.BadShares.selector);
        rooms.setShares(id, m, b);
    }

    function test_PayShares() public {
        uint256 id = _setup();

        address[] memory m = new address[](3);
        m[0] = captain; m[1] = memberB; m[2] = memberC;
        uint16[] memory b = new uint16[](3);
        b[0] = 5000; b[1] = 3000; b[2] = 2000; // 50/30/20

        vm.prank(captain);
        rooms.setShares(id, m, b);

        uint256 shareAmt = 900_000; // 0.9 USDC

        uint256 bCaptain  = usdc.balanceOf(captain);
        uint256 bMemberB  = usdc.balanceOf(memberB);
        uint256 bMemberC  = usdc.balanceOf(memberC);
        uint256 bTreasury = usdc.balanceOf(treasury);

        vm.prank(memberB);
        rooms.payShares(id, shareAmt);

        uint256 feeAmt = (shareAmt * FEE_BPS) / 10_000;
        uint256 net    = shareAmt - feeAmt;

        assertApproxEqAbs(usdc.balanceOf(captain)  - bCaptain,  net * 5000 / 10_000, 1);
        assertApproxEqAbs(usdc.balanceOf(memberB)  - bMemberB,  net * 3000 / 10_000, 1);
        assertApproxEqAbs(usdc.balanceOf(memberC)  - bMemberC,  net * 2000 / 10_000, 1);
        assertEq(usdc.balanceOf(treasury) - bTreasury, feeAmt);
    }

    // ── room binding: a request belongs to exactly one room ───────────────

    function _twoRooms() internal returns (uint256 roomA, uint256 roomB) {
        roomA = _setup();
        vm.prank(captain);
        roomB = rooms.createRoom("Beta", members3, 2);
    }

    function test_Approve_RevertWrongRoom() public {
        (uint256 roomA, uint256 roomB) = _twoRooms();

        vm.prank(memberB);
        uint256 reqId = rooms.request(roomA, payee, 1_000_000, "cross-room", 0);

        vm.prank(memberB);
        vm.expectRevert(ChattrRooms.WrongRoom.selector);
        rooms.approve(roomB, reqId);
    }

    function test_Execute_RevertWrongRoom() public {
        (uint256 roomA, uint256 roomB) = _twoRooms();

        vm.prank(memberB);
        uint256 reqId = rooms.request(roomA, payee, 1_000_000, "cross-room", 0);

        vm.prank(captain);
        rooms.approve(roomA, reqId);
        vm.prank(memberB);
        rooms.approve(roomA, reqId);

        uint256 payeeBefore = usdc.balanceOf(payee);

        vm.prank(captain);
        vm.expectRevert(ChattrRooms.WrongRoom.selector);
        rooms.execute(roomB, reqId);

        assertEq(usdc.balanceOf(payee), payeeBefore, "no funds may move across rooms");
    }

    function test_Attest_RevertWrongRoom() public {
        (uint256 roomA, uint256 roomB) = _twoRooms();

        vm.prank(memberB);
        uint256 reqId = rooms.request(roomA, payee, 1_000_000, "cross-room", 0);

        vm.prank(captain);
        rooms.approve(roomA, reqId);
        vm.prank(memberB);
        rooms.approve(roomA, reqId);
        vm.prank(captain);
        rooms.execute(roomA, reqId);

        // captain of both rooms, so only the room binding can stop this
        vm.prank(captain);
        vm.expectRevert(ChattrRooms.WrongRoom.selector);
        rooms.attest(roomB, reqId, true, "not my room");
    }
}
