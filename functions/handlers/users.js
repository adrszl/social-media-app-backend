const { admin, db } = require('../util/admin');
const config = require('../protected/credentials');
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');
const firebase = require('firebase');

firebase.initializeApp(config);

// 
// SIGNUP ROUTE
// 
exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle
    };

    // 
    // VALIDATION
    // 
    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return response.status(400).json(errors);

    // 
    // DEFAULT PROFILE IMAGE FOR NEWLY CREATED USERS
    // 
    const noImg = 'no-img.png';

    let token, userId;

    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return response.status(400).json({ handle: 'this handle is already taken' });
            } else {
                return (
                    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
                );
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
                userId: userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return response.status(400).json({ email: 'Email is already in use' });
            } else {
                return response.status(500).json({ error: err.code });
            }
        })
}

// 
// LOGIN ROUTE
// 
exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    };

    // 
    // VALIDATION
    // 
    const { valid, errors } = validateLoginData(user);
    
    if (!valid) return response.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((token) => {
            return response.json({ token });
        })
        .catch((err) => {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                return response.status(403).json({ general: 'Incorrect password' });
            } else {
                return response.status(500).json({ error: err.code });
            }
        });
}

// 
// ADD USER DETAILS
// 
exports.addUserDetails = (request, response) => {
    let userDetails = reduceUserDetails(request.body);

    db.doc(`/users/${request.user.handle}`).update(userDetails)
        .then(() => {
            return response.json({ message: 'Details added successfully' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
}

// 
// GET USER DETAILS
// 
exports.getUserDetails = (request, response) => {
    let userData = {};
    db.doc(`/users/${request.params.handle}`).get()
        .then((doc) => {
            if(doc.exists) {
                userData.user = doc.data();
                return db.collection('screams').where('userHandle', '==', request.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                return response.status(404).json({ error: 'User not found' });
            }
        })
        .then((data) => {
            userData.screams = [];
            data.forEach((doc) => {
                userData.screams.push({
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    userHandle: doc.data().userHandle,
                    userImage: doc.data().userImage,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount,
                    screamId: doc.id
                })
            });
            return response.json(userData);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
}

// 
// GET ATHENTICATED USER'S DATA TO THE REDUX
// 
exports.getAuthenticatedUser = (request, response) => {
    let userData = {};

    db.doc(`/users/${request.user.handle}`).get()
        .then((doc) => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', request.user.handle).get();
            }
        })
        .then((data) => {
            userData.likes = [];
            data.forEach((doc) => {
                userData.likes.push(doc.data());
            })
            return db.collection('notifications').where('recipient', '==', request.user.handle)
                .orderBy('createdAt', 'desc').limit(10).get();
        })
        .then((data) => {
            userData.notifications = [];
            data.forEach((doc) => {
                userData.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    createdAt: doc.data().createdAt,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    read: doc.data().read,
                    notificationId: doc.id
                })
            });
            return response.json(userData);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code});
        })
}

// 
// IMAGE UPLOAD FOR THE PROFILE IMAGE
// 
exports.uploadImage = (request, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: request.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return response.status(400).json({ error: 'Unsupported file type! Please upload JPEG or PNG file instead' });
        }

        const imageExtension = filename.split('.')[filename.split('.').lenght - 1];
        imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };
        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${request.user.handle}`).update({ imageUrl: imageUrl});
        })
        .then(() => {
            return response.json({ message: 'Image uploaded successfully'});
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
    });
    busboy.end(request.rawBody);
}

// 
// MARK NOTIFICATION AS READ
// 
exports.markNotificationsRead = (request, response) => {
    let batch = db.batch();
    
    request.body.forEach((notificationId) => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, { read: true });
    
    });
    batch.commit()
        .then(() => {
            return response.json({ message: 'Notifications marked read' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
}