const express = require('express');
require('dotenv').config();
const { db, auth } = require('../config/firebase');
const { authClient, sendPasswordResetEmail } = require('../config/firebaseClient');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body.email);
  try {
    const { email, password } = req.body;
    
    // Authenticate user with Firebase
    const userRecord = await auth.getUserByEmail(email);

    // Verify password (replace with your secure password verification)
    // ... (your password verification logic) ...

    // Generate a custom token
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    res.json({ token: customToken, uid: userRecord.uid });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Check username availability
// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const uid = req.query.uid; // Pass the current user's UID as a query parameter

    console.log('Checking username availability:', username);

    const usernamesDoc = await db.collection('usernames').doc('all').get();
    const usernamesInUse = usernamesDoc.exists ? (usernamesDoc.data().usernames_in_use || {}) : {};

    const isAvailable = !(username in usernamesInUse) || usernamesInUse[username] === uid;

    console.log('Username availability result:', isAvailable);
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});



//signup route
router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body.email);
  try {
    const { email, password, username } = req.body;
    let userRecord;
    
    await db.runTransaction(async (transaction) => {
      console.log('Starting transaction');
      const usernameDoc = await transaction.get(db.collection('usernames').doc('all'));
      const usernamesInUse = usernameDoc.exists ? (usernameDoc.data().usernames_in_use || []) : [];
      
      console.log('Checking username availability:', username);
      if (usernamesInUse.includes(username)) {
        throw new Error('Username already in use');
      }
      
      console.log('Creating user with Firebase Authentication');
      userRecord = await auth.createUser({
        email: email,
        password: password,
      });
      console.log('User created:', userRecord.uid);
      
      console.log('Adding user to Firestore');
      await transaction.set(db.collection('users').doc(userRecord.uid), {
        email: email,
        username: username,
      });
      
      console.log('Updating usernames list');
      await transaction.set(db.collection('usernames').doc('all'), {
        usernames_in_use: [...usernamesInUse, username]
      }, { merge: true });
      
      console.log('Transaction completed successfully');
    });

    console.log('Generating custom token');
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    console.log('Signup successful');
    res.json({ token: customToken, uid: userRecord.uid });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(400).json({ error: 'Signup failed', details: error.message });
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    await sendPasswordResetEmail(authClient, email);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Updated Logout Route using Firebase Admin SDK
router.post('/logout', async (req, res) => {
  try {
    const customToken = req.headers.authorization?.split('Bearer ')[1];
    if (!customToken) {
      return res.status(401).json({ error: 'Unauthorized, token is missing' });
    }

    try {
      const decodedToken = await auth.verifyIdToken(customToken);
      const uid = decodedToken.uid;

      // Revoke refresh tokens
      await auth.revokeRefreshTokens(uid);
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ error: 'Unauthorized, invalid token' });
    }
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Logout failed', details: error.message });
  }
});

module.exports = router;
