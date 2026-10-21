// Generated from the compiled artifact of the deployed contract.
// Regenerate: arc-studio cat contracts/out/ChattrRooms.sol/ChattrRooms.json --app <appId>
// Do not hand-edit. A hand-maintained copy drifted once (kept a removed field,
// dropped the public immutable getters) and would have broken decoding.

export const CHATTR_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_usdc",
        "type": "address"
      },
      {
        "name": "_treasury",
        "type": "address"
      },
      {
        "name": "_feeBps",
        "type": "uint16"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "BPS_DENOM",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_FEE_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_MEMBERS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      },
      {
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "attest",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      },
      {
        "name": "requestId",
        "type": "uint256"
      },
      {
        "name": "delivered",
        "type": "bool"
      },
      {
        "name": "note",
        "type": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createRoom",
    "inputs": [
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "members",
        "type": "address[]"
      },
      {
        "name": "threshold",
        "type": "uint8"
      }
    ],
    "outputs": [
      {
        "name": "roomId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      },
      {
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "feeBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRequest",
    "inputs": [
      {
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "v",
        "type": "tuple",
        "components": [
          {
            "name": "roomId",
            "type": "uint256"
          },
          {
            "name": "to",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          },
          {
            "name": "memo",
            "type": "string"
          },
          {
            "name": "unlockAt",
            "type": "uint64"
          },
          {
            "name": "approvalCount",
            "type": "uint256"
          },
          {
            "name": "status",
            "type": "uint8"
          },
          {
            "name": "attested",
            "type": "bool"
          },
          {
            "name": "delivered",
            "type": "bool"
          },
          {
            "name": "attestNote",
            "type": "string"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRoom",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "v",
        "type": "tuple",
        "components": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "captain",
            "type": "address"
          },
          {
            "name": "members",
            "type": "address[]"
          },
          {
            "name": "threshold",
            "type": "uint8"
          },
          {
            "name": "balance",
            "type": "uint256"
          },
          {
            "name": "shareMembers",
            "type": "address[]"
          },
          {
            "name": "shareBps",
            "type": "uint16[]"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasVoted",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      },
      {
        "name": "who",
        "type": "address"
      },
      {
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "payShares",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "request",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      },
      {
        "name": "to",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      },
      {
        "name": "memo",
        "type": "string"
      },
      {
        "name": "unlockAt",
        "type": "uint64"
      }
    ],
    "outputs": [
      {
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "requestCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "roomCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setShares",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256"
      },
      {
        "name": "members",
        "type": "address[]"
      },
      {
        "name": "bps",
        "type": "uint16[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "treasury",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "usdc",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Approved",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "requestId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "voter",
        "type": "address",
        "indexed": true
      },
      {
        "name": "approvalCount",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Attested",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "requestId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "captain",
        "type": "address",
        "indexed": true
      },
      {
        "name": "delivered",
        "type": "bool",
        "indexed": false
      },
      {
        "name": "note",
        "type": "string",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Deposited",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "sender",
        "type": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Executed",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "requestId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "to",
        "type": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "fee",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FeeTaken",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Requested",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "requestId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "to",
        "type": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "memo",
        "type": "string",
        "indexed": false
      },
      {
        "name": "unlockAt",
        "type": "uint64",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoomCreated",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "captain",
        "type": "address",
        "indexed": true
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false
      },
      {
        "name": "members",
        "type": "address[]",
        "indexed": false
      },
      {
        "name": "threshold",
        "type": "uint8",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SharesPaid",
    "inputs": [
      {
        "name": "roomId",
        "type": "uint256",
        "indexed": true
      },
      {
        "name": "totalAmount",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "fee",
        "type": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyAttested",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyVoted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AmountExceedsBalance",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadShares",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadThreshold",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyName",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FeeTooHigh",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotCaptain",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotExecuted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotMember",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotPending",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RequestNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RoomNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ThresholdNotMet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TimeLocked",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TooManyMembers",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongRoom",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroMembers",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroPayee",
    "inputs": []
  }
] as const
