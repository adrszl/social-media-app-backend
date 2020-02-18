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
                    userHandle: DOMRectList.data().userHandle,
                    createdAt: doc.data().createdAt
                });
            });
            return response.json(screams);
        })
        .catch(err => console.error(err));
}

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
}