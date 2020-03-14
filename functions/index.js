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
const { 
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead 
} = require('./handlers/users');
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
// GET USER DETAILS
// 
app.get('/user/:handle', getUserDetails);

// 
// MARK NOTIFICATIONS AS READ
// 
app.post('/notifications', FBAuth, markNotificationsRead);

//
// "API" PREFIX FOR ENDPOINTS
//
exports.api = functions.https.onRequest(app);

// 
// NOTIFICATIONS ON LIKE
// 
exports.createNotificationOnLike = functions.region('europe-west1').firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then((doc) => {
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
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
            .catch((err) => {
                console.error(err);
            })
    })

// 
// DELETE NOTIFICATIONS ON UNLIKE
// 
exports.deleteNotificationOnUnLike = functions.region('europe-west1').firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        return db.doc(`/notifications/${snapshot.id}`).delete()
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
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then((doc) => {
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
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
            .catch((err) => {
                console.error(err);
                return;
            })
    })

// 
// CHANGE USER'S IMAGE IN POSTS WHEN IMAGE HAS CHANGED
// 
exports.onUserImageChange = functions.region('europe-west1').firestore.document('/users/{userId}')
    .onUpdate((change) => {
        if(change.before.data().imageUrl !== change.after.data().imageUrl) {
            const batch = db.batch();
            return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
                .then((data) => {
                    data.forEach((doc) => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, { userImage: change.after.data().imageUrl })
                    });
                    return batch.commit();
                })
        } else {
            return true;
        }
    });

// 
// DELETE NOTIFICATIONS RELATED TO DELETED POST
// 
exports.onScreamDelete = functions.region('europe-west1').firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db.collection('collection').where('screamId', '==', screamId).get()
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                });
                return db.collection('likes').where('screamId', '==', screamId);
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                });
                return db.collection('notifications').where('screamId', '==', screamId);
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                });
                return batch.commit();
            })
            .catch((err) => {
                console.error(err);

            })
    })