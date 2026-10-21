export type RequestStatus = 'Pending' | 'Executed' | 'Cancelled'

export interface RoomData {
  name:         string
  captain:      `0x${string}`
  members:      readonly `0x${string}`[]
  threshold:    number
  balance:      bigint
  shareMembers: readonly `0x${string}`[]
  shareBps:     readonly number[]
}

export interface RequestData {
  roomId:        bigint
  to:            `0x${string}`
  amount:        bigint
  memo:          string
  unlockAt:      bigint
  approvalCount: bigint
  status:        number  // 0=Pending, 1=Executed, 2=Cancelled
  attested:      boolean
  delivered:     boolean
  attestNote:    string
}

// Activity feed entries (built from on-chain events)
export type ActivityKind = 'deposit' | 'request' | 'approval' | 'executed' | 'shares'

export interface ActivityItem {
  id:        string
  kind:      ActivityKind
  txHash:    string
  timestamp: number
  // deposit
  sender?:   string
  amount?:   bigint
  // request / executed
  requestId?: bigint
  to?:        string
  memo?:      string
  fee?:       bigint
  // approval
  voter?:     string
  approvals?: bigint
  // attestation (overlay on executed)
  attested?:  boolean
  delivered?: boolean
  attestNote?: string
}
