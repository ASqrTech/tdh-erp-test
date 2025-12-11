// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCLfyzun6Lfz96SklUNhJEgCRdLy_MJV6U",
  authDomain: "tdh-erp-asquare.firebaseapp.com",
  projectId: "tdh-erp-asquare",
  storageBucket: "tdh-erp-asquare.firebasestorage.app",
  messagingSenderId: "710616529296",
  appId: "1:710616529296:web:e3504c7899029156acdb15",
  measurementId: "G-NCE27PVGRZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, auth, db, analytics };

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
