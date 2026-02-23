import admin from "firebase-admin";

// The service account JSON can either be provided as a path or as a
// stringified JSON object in an environment variable.  On Render we
// env-configure the latter so this helper handles both cases.

function loadServiceAccount(): admin.ServiceAccount | undefined {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (path) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require(path) as admin.ServiceAccount;
    } catch (err) {
      console.warn("failed to load firebase service account from path", err);
    }
  }
  if (json) {
    try {
      return JSON.parse(json) as admin.ServiceAccount;
    } catch (err) {
      console.warn("failed to parse FIREBASE_SERVICE_ACCOUNT JSON", err);
    }
  }
  return undefined;
}

// During unit tests we don't have a service account configured
// and none of the code actually hits Firebase (we spy on logAuthEvent),
// so skip initialization entirely to avoid esbuild errors about the
// credential object being undefined.
if (process.env.NODE_ENV === "test") {
  // no-op
} else if (!admin.apps.length) {
  const service = loadServiceAccount();
  if (service) {
    const credential = admin.credential.cert(service as any);
    admin.initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DB_URL,
    });
  } else {
    // fall back to default credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp({
      databaseURL: process.env.FIREBASE_DB_URL,
    });
  }
}

export const realtimeDb = admin.database();

/**
 * Write an authentication event to the realtime database.  If the
 * database isn't available we simply log a warning and continue — the
 * core application shouldn't fail just because logging is mis‑configured.
 */
export function logAuthEvent(event: Record<string, any>) {
  try {
    realtimeDb.ref("authLogs").push({
      ...event,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn("firebase logAuthEvent failed", err);
  }
}
