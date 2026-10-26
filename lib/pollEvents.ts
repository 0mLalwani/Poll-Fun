// SHARED IN-MEMORY MAP HOLDING listener

// waits for route.ts SSE handling event broker
// to subscribe users to it
type PollListener = () => void

const shared = globalThis as typeof globalThis & {
  pollEventListeners?: Map<string, PollListener[]>
}

//if our global listener ends up null,
//make a new map again and attach it to the global object,
//and put the ref in mp
const mp: Map<string, PollListener[]> = (shared.pollEventListeners ??= new Map<
  string,
  PollListener[]
>())

export function subscribeListeners(pollId: string, listener: PollListener) {
  console.log("SUBSCRIBE:", pollId)
  const existingListeners = mp.get(pollId) ?? []
  mp.set(pollId, [...existingListeners, listener])
  return () => {
    const existingListeners = mp.get(pollId) ?? []
    const remaining = existingListeners.filter((item) => item !== listener)
    if (remaining.length === 0) {
      mp.delete(pollId)
    } else {
      mp.set(pollId, [...remaining])
    }
  }
}

export function publishEvent(pollId: string) {
  console.log("PUBLISH:", pollId)
  console.log("LISTENER COUNT:", mp.get(pollId)?.length ?? 0)
  const callBacks = mp.get(pollId)
  callBacks?.forEach((cb) => cb())
}
