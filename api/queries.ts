// Queries used by more than one file in api/.
import { db } from "@/api/firebase";
import { collection, orderBy, query, where } from "firebase/firestore";

export const myGroupsQuery = (uid: string) =>
    query(collection(db, "groups"), where("members", "array-contains", uid), orderBy("createdAt"));

export const groupListsQuery = (groupId: string) =>
    query(collection(db, "lists"), where("groupId", "==", groupId), orderBy("createdAt"));
