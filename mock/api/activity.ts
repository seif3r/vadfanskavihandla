import { db } from "@/mock/db";
import { delay, response } from "@/mock/network";
import { ActivityEvent } from "@/types/models";

// Everything that happened after event `afterId`, oldest first.
// With a real backend these would arrive as push notifications instead of being polled.
export async function getActivity(afterId: number): Promise<ActivityEvent[]> {
  await delay();
  return response(db.activity.filter((e) => e.id > afterId));
}
