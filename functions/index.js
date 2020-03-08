const functions = require('firebase-functions');
const app = require('express')();
const { db } = require('./util/admin');
const { 
    getAllScreams, 
    postOneScream, 
    getScream, 
    commentOnScream, 
    likeScream, 
    unlikeScream, 
    deleteScream  
} = require('./handlers/screams');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');
const FBAuth = require('./util/fbAuth');

/* 
 * * * * * * * *  *
 * SCREAMS ROUTES *
 * * * * * * * *  *
 */

// 
// GET POSTS, SET NEW POST, SEE A PARTICULAR POST, POST COMMENT AND DELETE POST
// 
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
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

// 
// NOTIFICATIONS ON LIKE
// 
exports.createNotificationOnLike = functions.region('europe-west1').firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then((doc) => {
                if(doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
                return;
            })
    })

// 
// DELETE NOTIFICATIONS ON UNLIKE
// 
exports.deleteNotificationOnUnLike = functions.region('europe-west1').firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        db.doc(`/notifications/${snapshot.id}`).delete()
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
                return;
            })
    })

// 
// NOTIFICATIONS ON COMMENT
// 
exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then((doc) => {
                if(doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
                return;
            })
    })