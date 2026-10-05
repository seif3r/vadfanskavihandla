// DEV ONLY: pretends the other user is using the app, so notifications can be tried
// without a second device. Delete it together with the rest of mock/.
import { db, recordActivity } from "@/mock/db";

const INTERVAL_MS = 30_000;
const NEW_ITEMS = ["Mjölk", "Kaffe", "Bananer", "Ost", "Glass", "Chips", "Tandkräm"];

// Every 30 s, the other user adds an item or checks one off. Returns a stop function.
export function startMockActivity(currentUserId: string): () => void {
  const timer = setInterval(() => {
    const others = db.users.filter((u) => u.id !== currentUserId);
    const lists = db.lists;
    if (others.length === 0 || lists.length === 0) return;

    const pick = <T>(array: T[]) => array[Math.floor(Math.random() * array.length)];
    const other = pick(others);
    const unchecked = db.items.filter((i) => !i.done && lists.some((l) => l.id === i.listId));

    if (unchecked.length > 0 && Math.random() < 0.5) {
      const item = pick(unchecked);
      item.done = true;
      recordActivity({ type: "itemCompleted", listId: item.listId, itemName: item.name, userId: other.id });
    } else {
      const list = pick(lists);
      const name = pick(NEW_ITEMS);
      db.items.push({ id: String(Date.now()), listId: list.id, name, done: false, addedBy: other.id });
      recordActivity({ type: "itemAdded", listId: list.id, itemName: name, userId: other.id });
    }
  }, INTERVAL_MS);

  return () => clearInterval(timer);
}
