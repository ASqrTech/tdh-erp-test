
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Make sure to export this so it can be used in Other files
export const firebaseConfig = {
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

/*
FIX THIS: To fix the "Missing or insufficient permissions" and "domain not authorized" errors, you need to authorize your app's domain in Firebase.

1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project: "tdh-erp"
3. Go to "Authentication" from the side menu.
4. Click on the "Settings" tab.
5. Click on the "Authorized domains" tab.
6. Click "Add domain" and enter the domain from the error message:
   3000-firebase-tdh-erp-fb-1763631534424.cluster-wurh6gchdjcjmwrw2tqtufvhss.cloudworkstations.dev
7. Click "Add".

After you do this, the login should work correctly.
*/
