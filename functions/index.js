const functions = require('firebase-functions');
const app = require('express')();
const { getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream  } = require('./handlers/screams');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');
const FBAuth = require('./util/fbAuth');

/* 
 * * * * * * * *  *
 * SCREAMS ROUTES *
 * * * * * * * *  *
 */

// 
// GET POSTS, SET NEW POST, SEE A PARTICULAR POST AND POST COMMENT
// 
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
// 
// LIKE AND POST
// 
app.get('/scream/:screamId/like/', FBAuth, likeScream);
app.get('/scream/:screamId/unlike/', FBAuth, unlikeScream);

/* 
 * * * * * * * *
 * USER ROUTES *
 * * * * * * * *
 */

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