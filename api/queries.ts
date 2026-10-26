// Queries shared by groups.ts and lists.ts, kept here so the two don't import each other.
import { db } from "@/api/firebase";
import { collection, orderBy, query, where } from "firebase/firestore";

export const myGroupsQuery = (uid: string) =>
    query(collection(db, "groups"), where("members", "array-contains", uid), orderBy("createdAt"));

export const groupListsQuery = (groupId: string) =>
    query(collection(db, "lists"), where("groupId", "==", groupId), orderBy("createdAt"));
