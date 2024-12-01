const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./mindaigle-pnrxef-firebase-adminsdk-nrpto-cca9f415c5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();
const auth = admin.auth();

module.exports = { db, auth };