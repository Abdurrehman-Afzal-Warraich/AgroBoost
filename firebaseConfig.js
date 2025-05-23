import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3_p03SKoRhslo4O3IRNSRRVdlenOr7wE",
  authDomain: "agroboost-e1cc5.firebaseapp.com",
  databaseURL:
    "https://agroboost-e1cc5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agroboost-e1cc5",
  storageBucket: "agroboost-e1cc5.appspot.com",
  messagingSenderId: "149622729159",
  appId: "1:149622729159:android:8c38b2758e03a5d59111e2",
};

// Initialize Firebase
let app;
// Check if Firebase app is already initialized
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

// Initialize Auth with React Native persistence
export const my_auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize services
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { db, rtdb, storage };
export default app;
