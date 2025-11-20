
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBj8qEWRmClgVZAxL2cEAZiUb6tR_Hnksg",
  authDomain: "tdh-erp.firebaseapp.com",
  projectId: "tdh-erp",
  storageBucket: "tdh-erp.firebasestorage.app",
  messagingSenderId: "363677734618",
  appId: "1:363677734618:web:dc5ef03e1a5960107537e3",
  measurementId: "G-Y8MB6NJLQ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
