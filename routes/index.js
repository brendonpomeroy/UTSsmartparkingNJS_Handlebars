var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var assert = require('assert');

var url = "mongodb+srv://System:utssmartparking@parkdb-fez7r.mongodb.net/test";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/bookSpace', function(req, res, next) {
    res.render('bookSpace', { title: 'Book Space' });
});

router.get('/bookings', function(req, res, next) {
    res.render('bookings', { title: 'Bookings' });
});

router.get('/account', function(req, res, next) {
    res.render('account', { title: 'Account' });
});

router.get('/manageUsers', function(req, res) {
    res.render('manageUsers')
});


router.get('/get-users', function(req, res, next) {
    var users = [];
    mongo.connect(url, function(err, db) {
        assert.equal(null, err);
        var cursor = db.collection('users').find(); //essentially an iterator
        cursor.forEach(function(doc, err) { // doc is the variable we want -> document (like an SQL entry)
            assert.equal(null, err); // check for an error
            users.push(doc); //add the document to the users array
        }, function() {
            db.close();// must be here due to node.js being asynchronous
            res.render('manageUsers', { items: users});
        });
    });
});

router.post('/insert-user', function(req, res, next) {
    var user = {
        userID: req.body.userID,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        usertype: req.body.usertype
    };

    mongo.connect(url, function(err, db){
        assert().equal(null, err);
        db.collection('users').insertOne(user, function(err, result) {
            assert(null, err);
            console.log('user added.');
            db.close();
        });
    })
});

router.post('/update', function(req, res, next) {

});

router.post('/delete', function(req, res, next) {

});

module.exports = router;
