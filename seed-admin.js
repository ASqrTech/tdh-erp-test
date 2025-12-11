import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLfyzun6Lfz96SklUNhJEgCRdLy_MJV6U",
  authDomain: "tdh-erp-asquare.firebaseapp.com",
  projectId: "tdh-erp-asquare",
  storageBucket: "tdh-erp-asquare.firebasestorage.app",
  messagingSenderId: "925263924086",
  appId: "1:925263924086:web:1fe6e7fd3e0a6e68fc3bc1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seedAdmin() {
  try {
    console.log("Creating admin user...");
    
    const adminEmail = "admin@tdherp.com";
    const adminPassword = "password";
    const adminPIN = "1234";
    
    // Create the admin user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log("Admin user created in Auth:", user.uid);
    
    // Create the admin user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      department: "Administration",
      phone: "0000000000",
      pin: adminPIN,
      status: "active",
      createdAt: new Date()
    });
    
    console.log("Admin user document created in Firestore");
    console.log("\n✅ Admin user created successfully!");
    console.log("Email: admin@tdherp.com");
    console.log("Password: password");
    console.log("PIN: 1234");
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("✅ Admin user already exists");
      console.log("Email: admin@tdherp.com");
      console.log("Password: password");
      console.log("PIN: 1234");
      process.exit(0);
    } else {
      console.error("Error creating admin:", error.message);
      process.exit(1);
    }
  }
}

seedAdmin();
