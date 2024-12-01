const express = require('express');
const { db, auth } = require('../config/firebase');
const multer = require('multer');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

const router = express.Router();
const storage = getStorage();
const upload = multer({ storage: multer.memoryStorage() });

// Get user profile
router.get('/:uid', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    console.log('Fetched user data:', userData); // Add console log
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update user profile
// Update user profile
router.put('/:uid', async (req, res) => {
  try {
    const { username, fullName, location, gender, phoneNumber, age, display_name } = req.body;
    console.log('Updating profile for UID:', req.params.uid);

    // Check if username is available only if it's being changed
    if (username) {
      const userDoc = await db.collection('users').doc(req.params.uid).get();
      const currentUsername = userDoc.data().username;

      if (username !== currentUsername) {
        const usernameDoc = await db.collection('usernames').doc('all').get();
        const usernamesInUse = usernameDoc.exists ? (usernameDoc.data().usernames_in_use || {}) : {};

        if (username in usernamesInUse && usernamesInUse[username] !== req.params.uid) {
          return res.status(400).json({ error: 'Username already in use' });
        }
      }
    }

    // Create an update object and remove undefined fields
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (location !== undefined) updateData.location = location;
    if (gender !== undefined) updateData.gender = gender;
    if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
    if (age !== undefined) updateData.age = age;

    await db.collection('users').doc(req.params.uid).update(updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.query; // Get the current user's UID from the query parameter

    const usernameDoc = await db.collection('usernames').doc('all').get();
    const usernamesInUse = usernameDoc.exists ? (usernameDoc.data().usernames_in_use || {}) : {};

    const isAvailable = !(username in usernamesInUse) || usernamesInUse[username] === uid;

    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Upload profile picture
router.post('/:uid/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const storageRef = ref(storage, `profile_pictures/${req.params.uid}`);
    await uploadBytes(storageRef, file.buffer);
    const photoURL = await getDownloadURL(storageRef);

    await db.collection('users').doc(req.params.uid).update({
      photo_url: photoURL,
    });

    res.json({ message: 'Profile picture uploaded successfully', photoURL });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;