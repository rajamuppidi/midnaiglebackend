const express = require('express');
const { db } = require('../config/firebase');
const router = express.Router();

// Fetch data from Firestore
router.get('/data', async (req, res) => {
  try {
    const snapshot = await db.collection('items').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});/* 

// Add data to Firestore
router.post('/submit', async (req, res) => {
  try {
    const newItem = req.body;
    const docRef = await db.collection('items').add(newItem);
    res.json({ success: true, message: 'Data added successfully', id: docRef.id });
  } catch (error) {
    console.error('Error adding data:', error);
    res.status(500).json({ error: 'Failed to add data' });
  }
});

// Update data in Firestore
router.put('/update/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    await db.collection('items').doc(id).update(updatedData);
    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
});

// Delete data from Firestore
router.delete('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.collection('items').doc(id).delete();
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

module.exports = router; */