const { db } = require('../util/admin');

// 
// GET POSTS function
// 
exports.getAllScreams = (request, response) => {
    db.collection('screams').orderBy('createdAt', 'desc').get()
        .then(data => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                });
            });
            return response.json(screams);
        })
        .catch(err => console.error(err));
};

// 
// SET NEW POST function
// 
exports.postOneScream = (request, response) => {
    if (request.body.body.trim() === '') return response.status(400).json({ body: 'Body of the post must not be empty' });

    const newScream = {
        body: request.body.body,
        userHandle: request.user.handle,
        createdAt: new Date().toISOString()
    };

    db
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            response.json({ message: `document ${doc.id} created successfully` });
        })
        .catch((err) => {
            response.status(500).json({ error: 'something went wrong...' });
            console.log(error);
        });
};

// 
// GET ONE PARTICULAR POST
// 
exports.getScream = (request, response) => {
    let screamData = {};

    db.doc(`/screams/${request.params.screamId}`).get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Post not found' });
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db.collection('comments').orderBy('createdAt', 'desc').where('screamId', '==', request.params.screamId).get();
        })
        .then((data) => {
            screamData.comments = [];
            data.forEach((doc) => {
                screamData.comments.push(doc.data())
            });
            return response.json(screamData);
        })
        .catch((err) => {
            console.error(err);
            response.status(500).json({ error: err.code });
        })
}

// 
// POST A COMMENT
// 
exports.commentOnScream = (request, response) => {
    if(request.body.body.trim() === '') return response.status(400).json({ error: 'Must not be empty'});

    const newComment = {
        body: request.body.body,
        createdAt: new Date().toISOString(),
        screamId: request.params.screamId,
        userHandle: request.user.handle,
        userImage: request.user.imageUrl
    };

    // CHECK IF THE POST STILL EXISTS
    db.doc(`/screams/${request.params.screamId}`).get()
        .then((doc) => {
            if(!doc.exists) {
                return response.status(404).json({ error: 'Scream not found' });
            }
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            response.json(newComment);
        })
        .catch((err) => {
            console.log(err);
            response.status(500).json({ error: 'Something went wrong' });
        })
}