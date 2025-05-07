import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA3_p03SKoRhslo4O3IRNSRRVdlenOr7wE", // Replace with your actual API key
    authDomain: "agroboost-e1cc5.firebaseapp.com",
    projectId: "agroboost-e1cc5",
    storageBucket: "agroboost-e1cc5.appspot.com",
    messagingSenderId: "149622729159",
    appId: "1:149622729159:android:8c38b2758e03a5d59111e2",
    measurementId: "G-XXXXXXX" // Optional, replace with your actual measurement ID if available
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export default { app, auth, firestore, storage };