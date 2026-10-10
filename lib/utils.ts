export { cn } from "cn"

export type EventLifecycleState = "UPCOMING" | "STARTED" | "ENDED"

export function getEventLifecycleState(startsAt: Date, endsAt: Date): EventLifecycleState {
  const now = new Date()
  
  if (now >= endsAt) {
    return "ENDED"
  }
  
  if (now >= startsAt) {
    return "STARTED"
  }
  
  return "UPCOMING"
}
