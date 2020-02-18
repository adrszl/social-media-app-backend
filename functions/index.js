const functions = require('firebase-functions');
const express = require('express');
const firebase = require('firebase');
const app = express();
const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login } = require('./handlers/users');
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
// "API" PREFIX FOR ENDPOINTS
//
exports.api = functions.https.onRequest(app);