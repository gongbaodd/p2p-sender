// Map to store room codes and peer IDs
// Key: 6-digit room code, Value: Set of peer IDs
export const idMap = new Map<string, Set<string>>()

// Generate a random 6-digit code
export function generateRoomCode(): string {
  // Keep generating until we find a unique code
  let code: string
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString()
  } while (idMap.has(code))

  return code
}

