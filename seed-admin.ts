import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
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

async function seedAdminUser() {
  const adminEmail = "admin@tdherp.com";
  const adminPassword = "password";
  const adminPin = "1234";
  const adminName = "Admin";
  const adminRole = "ADMIN";

  try {
    console.log("Creating admin user in Firebase Authentication...");
    
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail,
      adminPassword
    );

    const userId = userCredential.user.uid;
    console.log(`✓ Admin user created with UID: ${userId}`);

    // Create the user document in Firestore
    console.log("Creating admin user document in Firestore...");
    
    await setDoc(doc(db, "users", userId), {
      email: adminEmail,
      name: adminName,
      role: adminRole,
      pin: adminPin,
      status: "ACTIVE"
    });

    console.log("✓ Admin user document created successfully!");
    console.log("\n=== Admin User Credentials ===");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`PIN: ${adminPin}`);
    console.log(`Role: ${adminRole}`);
    console.log("==============================\n");

    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.error("\n❌ Error: Admin user already exists!");
      console.log("\nIf you need to reset the admin user, please:");
      console.log("1. Go to Firebase Console > Authentication");
      console.log("2. Delete the existing admin@tdherp.com user");
      console.log("3. Run this script again\n");
    } else {
      console.error("\n❌ Error creating admin user:", error.message);
    }
    process.exit(1);
  }
}

// Run the seed function
seedAdminUser();
