import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, deleteUser as deleteAuthUser } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import * as readline from "readline";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function verifyAndFixAdmin() {
  const adminEmail = "admin@tdherp.com";
  const adminPassword = "password";
  const adminPin = "1234";

  console.log("\n=== Verifying Admin User ===\n");

  try {
    // Try to sign in with the admin credentials
    console.log("1. Testing login with admin@tdherp.com...");
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const userId = userCredential.user.uid;
    console.log(`   ✓ Login successful! User UID: ${userId}`);

    // Check Firestore document
    console.log("\n2. Checking Firestore user document...");
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      console.log("   ❌ User document does NOT exist in Firestore!");
      console.log("\n   Creating Firestore document...");
      
      await setDoc(doc(db, "users", userId), {
        email: adminEmail,
        name: "Admin",
        role: "ADMIN",
        pin: adminPin,
        status: "ACTIVE"
      });
      
      console.log("   ✓ Firestore document created!");
    } else {
      const userData = userDoc.data();
      console.log(`   ✓ User document exists!`);
      console.log(`   - Name: ${userData.name}`);
      console.log(`   - Role: ${userData.role}`);
      console.log(`   - PIN: ${userData.pin}`);
      console.log(`   - Status: ${userData.status}`);

      // Verify PIN matches
      if (userData.pin !== adminPin) {
        console.log(`\n   ⚠️  PIN mismatch! Expected: ${adminPin}, Found: ${userData.pin}`);
        const answer = await question("   Do you want to update the PIN to 1234? (yes/no): ");
        
        if (answer.toLowerCase() === 'yes') {
          await setDoc(doc(db, "users", userId), {
            ...userData,
            pin: adminPin
          });
          console.log("   ✓ PIN updated to 1234");
        }
      }
    }

    console.log("\n=== Verification Complete ===");
    console.log("\nYou can now log in with:");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`PIN: ${adminPin}`);
    console.log("==============================\n");

  } catch (error: any) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
      console.log("   ❌ Cannot login - user doesn't exist or wrong credentials");
      console.log("\nThe admin user needs to be deleted and recreated.");
      console.log("Please run: npm run seed-admin");
    } else {
      console.error("\n❌ Error:", error.message);
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

verifyAndFixAdmin();
