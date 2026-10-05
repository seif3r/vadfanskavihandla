import { ApiError } from "@/api/ApiError";
import { db } from "@/mock/db";
import { delay, response } from "@/mock/network";
import { LoginResponse } from "@/types/api";
import { User } from "@/types/models";

// Mock: any password works for a known email. The token is just the user id.
export async function login(email: string, _password: string): Promise<LoginResponse> {
  await delay();
  const user = db.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) throw new ApiError("errors.unknownEmail");
  return response({ token: user.id, user });
}

export async function getCurrentUser(token: string): Promise<User> {
  await delay();
  const user = db.users.find((u) => u.id === token);
  if (!user) throw new ApiError("errors.invalidSession");
  return response(user);
}
