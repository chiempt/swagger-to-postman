interface TokenBucket {
  tokens: number
  lastRefill: number
  capacity: number
  refillRate: number
}

const buckets = new Map<string, TokenBucket>()

export function checkRateLimit(identifier: string, cost = 1): boolean {
  const now = Date.now()
  const capacity = 10 // Max 10 requests
  const refillRate = 1 / 60000 // 1 token per minute

  let bucket = buckets.get(identifier)
  if (!bucket) {
    bucket = {
      tokens: capacity,
      lastRefill: now,
      capacity,
      refillRate,
    }
    buckets.set(identifier, bucket)
  }

  // Refill tokens based on time passed
  const timePassed = now - bucket.lastRefill
  const tokensToAdd = Math.floor(timePassed * bucket.refillRate)
  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now

  // Check if we have enough tokens
  if (bucket.tokens >= cost) {
    bucket.tokens -= cost
    return true
  }

  return false
}
