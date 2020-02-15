const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

admin.initializeApp();

// 
// GET POSTS function
// 
app.get('/screams', (request, response) => {
    admin.firestore().collection('screams').orderBy('createdAt', 'desc').get()
        .then(data => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: DOMRectList.data().userHandle,
                    createdAt: doc.data().createdAt
                });
            });
            return response.json(screams);
        })
        .catch(err => console.error(err));
});

// 
// HELLO WORLD function
// 
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

// 
// SET NEW POST function
// 
app.post('/scream', (request, response) => {
    const newScream = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: new Date().toISOString()
    };

    admin
        .firestore()
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            response.json({ message: `document ${doc.id} created successfully` });
        })
        .catch((err) => {
            response.status(500).json({ error: 'something went wrong...' });
            console.log(error);
        });
});

//
// PREFIX "API" DO ENDPOINTÓW
//
exports.api = functions.https.onRequest(app);