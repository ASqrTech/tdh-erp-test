const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');

admin.initializeApp();

// CORS middleware
const corsHandler = cors({ origin: true });

// Callable function for deleting users
exports.deleteUser = functions.https.onCall(async (data, context) => {
    // Verify the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = data.userId;

    if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required');
    }

    try {
        // Delete from Firebase Authentication
        await admin.auth().deleteUser(userId);
        
        // User is already deleted from Firestore by the client
        return { success: true, message: `User ${userId} deleted from Firebase Authentication` };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error deleting user from authentication');
    }
});
