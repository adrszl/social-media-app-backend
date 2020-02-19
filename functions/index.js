const functions = require('firebase-functions');
const app = require('express')();
const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');
const FBAuth = require('./util/fbAuth');

// 
// GET POSTS AND SET NEW POST
// 
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);

// 
// SIGNUP AND LOGIN ROUTES
// 
app.post('/signup', signup);
app.post('/login', login);

// 
// IMAGE UPLOAD FOR THE PROFILE IMAGE
// 
app.post('/user/image', FBAuth, uploadImage);

// 
// ADD USER DETAILS
// 
app.post('/user', FBAuth, addUserDetails);

// 
// GET ATHENTICATED USER'S DATA TO THE REDUX
// 
app.get('/user', FBAuth, getAuthenticatedUser);

//
// "API" PREFIX FOR ENDPOINTS
//
exports.api = functions.https.onRequest(app);