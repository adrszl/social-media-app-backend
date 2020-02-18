const admin = require('firebase-admin');
const serviceAccount = require('../protected/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://react-social-media-app-bc530.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };