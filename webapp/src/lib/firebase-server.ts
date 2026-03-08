import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    databaseURL: "https://idpa-gps-tracker-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);