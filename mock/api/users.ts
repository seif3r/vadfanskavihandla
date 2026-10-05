import { db } from "@/mock/db";
import { delay, response } from "@/mock/network";
import { User } from "@/types/models";

// Everyone using the app. Used to put names on notifications.
export async function getUsers(): Promise<User[]> {
  await delay();
  return response(db.users);
}
