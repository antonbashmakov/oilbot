import * as admin from "firebase-admin";
import {CONSTANTS} from "../controllers/admin/imports";

// emulators:exec sets the host when the emulators run on other ports (rule 107.12).
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
  projectId: "test-project",
});

// Export the Admin db for tests
const db = admin.firestore();
db.settings({
  host: FIRESTORE_EMULATOR_HOST, // Firestore emulator host
  ssl: false, // Must be false for emulator
});

afterEach(async () => {
  await Promise.all(
    Object.keys(CONSTANTS.COLLECTIONS).map(async (key) => {
      await db.recursiveDelete(db.collection(key));
    })
  );
});

afterAll(async () => {
  await db.terminate();
});

export default db;
