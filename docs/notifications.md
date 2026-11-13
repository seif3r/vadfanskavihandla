# Notifications

How "Anna added 3 items: milk, eggs, bread" reaches the other members of the list's group. This replaces
chapter 8.1 and 8.3 of `backend-and-hosting-guide.pdf`; the rest of that chapter (push tokens,
`expo-notifications` setup, region, EAS credentials) still applies.

## What triggers a notification

| Change | Notification | Setting |
| --- | --- | --- |
| Someone adds an item | "Anna added milk" / "Anna added 3 items: …" | `settings.notifications.itemAdded` |
| Someone removes items (deletes them, e.g. "remove checked items") | "Anna removed milk" / "Anna removed 3 items: …" | `settings.notifications.itemRemoved` |
| Someone checks or unchecks an item | nothing: checking off is personal | none |
| Someone edits an item | nothing | none |

Everyone in the list's group is a recipient, except the person who made the change. The list
name is the notification title. Both
settings are off for new accounts; turning one on asks for permission.

## Bundling and the 60-second delay

Changes are grouped per **list + person + type** (added or removed). Every change restarts a
60-second timer, and the notification goes out once that person has been quiet on that list for
60 seconds. One item uses the single text (`notifications.itemAdded`); more than one uses the
`…Many` text with a count and the item names. The same item changed twice in a batch counts once.

Texts live in `i18n/locales/{en,sv}.json` under `notifications`. The Cloud Function reads the same
files (copied into `functions/locales/` at build time), so there is one place to translate.

## Two paths

**Installed builds (push, works with the app closed)** — `functions/src/index.ts`:

1. `notifyOnItemChange` (Firestore trigger with auth context on `items/{itemId}`) sees an item
   created or deleted. The person is `updatedBy` for adds and the trigger's `authId` for deletes,
   since a deleted document can't say who deleted it. Deletes made by the server are skipped: those
   are `cleanUpList` removing the items of a deleted list, and there's no one to tell.
2. It adds the item to `pendingNotifications/{listId}_{personId}_{type}` in a transaction and bumps
   that doc's `seq`. No Security Rule matches this collection, so only the server can touch it.
3. It enqueues a Cloud Task for `sendBatchedNotification` with `{batchId, seq}`, 60 s out. The
   trigger has `retry: true`, so a failed enqueue doesn't leave a batch with no task to send it.
4. When a task runs, it only sends if its `seq` is still the latest. Otherwise a newer change has
   its own task coming. The sender moves the batch's `items` to `sending` in the same transaction
   (the doc stays, so `seq` never repeats), then sends via Expo's push service (10 s time limit)
   and removes tokens Expo reports as `DeviceNotRegistered`. Recipients are the `members` of the
   group named by the list's `groupId`.
5. Only after Expo has accepted the messages are they removed from `sending`. If Expo can't be
   reached or answers with an error, the task throws and Cloud Tasks retries it (3 attempts). If a
   newer change arrives first, its task sends what is left in `sending` together with its own items.
   Ticket errors other than `DeviceNotRegistered` are logged, not retried, since resending would
   repeat the notification on the phones that got it.

**Web and Expo Go (in-app, only while the app is open)** — `hooks/useLiveUpdates.ts` gets changes
from `subscribeToItems` in `api/items.ts` and batches them with timers in the same way. Installed
builds skip this path so nothing is shown twice. This path only sees changes while the app is open
and its listeners run: changes made while it's in the background, closed or offline are never
notified in-app. A delete arriving through a listener doesn't say
who made it, so `removeDone` first stamps the items' `updatedBy` with the remover (a separate
commit, so listeners get it before the delete) and the listener names `updatedBy`, the same person
the server gets from `authId`. Batches not yet shown are lost if the app closes.

When changing what triggers a notification, its text or its timing, change both paths.

## Deploying

```bash
firebase deploy --only functions
```

Regions: `notifyOnItemChange` runs in `europe-north1` (Cloud Functions isn't offered in
`europe-north2`, where the database is). Cloud Tasks isn't offered in either Nordic region, so the
queue and `sendBatchedNotification` run in `europe-west1`. Both are set at the top of
`functions/src/index.ts`. Moving a task function to another region leaves the old one behind; if
the CLI can't delete it, delete its Cloud Run service in the Google Cloud console.

The first deploy turns on the Cloud Tasks API. If the trigger then fails with a permission error
when it enqueues, give the functions' service account (by default
`PROJECT_NUMBER-compute@developer.gserviceaccount.com`) the roles **Cloud Tasks Enqueuer** and
**Service Account User**.
