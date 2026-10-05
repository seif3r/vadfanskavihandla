import { ApiError } from "@/api/ApiError";
import { db } from "@/mock/db";
import { delay, response } from "@/mock/network";
import { User, UserSettings } from "@/types/models";

// Saves the given settings and returns the updated user.
export async function updateSettings(userId: string, settings: Partial<UserSettings>): Promise<User> {
  await delay();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new ApiError("errors.invalidSession");
  user.settings = { ...user.settings, ...settings };
  return response(user);
}
