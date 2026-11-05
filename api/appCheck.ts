// App Check on phones. The JS SDK has no attestation provider for them (web has its own version
// of this file, appCheck.web.ts), and it takes a native module to get one.
import { FirebaseApp } from "firebase/app";

export function startAppCheck(_app: FirebaseApp): void {}
