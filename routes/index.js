var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var session = require('express-session');
mongoose.connect("mongodb+srv://System:utssmartparking@parkdb-fez7r.mongodb.net/carParkDB?retryWrites=true");

var userSchema = new Schema({
    userID: Number,
    name: String,
    phone: Number,
    email: String,
    userType: String,
    password: String
});

var userModel = mongoose.model('Users', userSchema);

//var mongo = require('mongodb').MongoClient;
//var assert = require('assert');
//var url = "mongodb+srv://System:utssmartparking@parkdb-fez7r.mongodb.net/";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { layout: false });
});

router.get('/dashboard', function(req, res, next) {
    res.render('dashboard', { status: 'na' });
});

router.get('/bookSpace', function(req, res, next) {
    res.render('bookSpace', { title: 'Book Space' });
});

router.get('/bookings', function(req, res, next) {
    res.render('bookings', { title: 'Bookings' });
});

router.get('/account', function(req, res, next) {
    if (!req.session.user) {
        res.render('index');
    }

    res.render('account', { user: req.session.user });
});

router.get('/manageUsers', function(req, res) {
    res.render('manageUsers')
});


//Get spaces is triggered by a user clicking the day options, the function then
//opens the database Spaces collection and stores it in a list temporarily
//the Bookings are then queried with the .find() function ***this will need the correct date added***
//the booking collection is also stored in a temporary list and sent filterSpaces() to remove private data.
router.get('/getSpaces', function(req, res) {
    let spaces = [];
    let bookings = [];
    mongo.connect(url, function(err, client) {
        assert.equal(null, err);
        var db = client.db('carParkDB'); // new variable version 3.0+ (connection loads client -> this stores the database)
        const cursor = db.collection('Spaces').find(); //essentially an iterator
        cursor.forEach(function(doc, err) { // doc is the variable we want -> document (like an SQL entry)
            assert.equal(null, err); // check for an error
            spaces.push(doc); //add the document to the spaces array
        }, function() {
            client.close();// must be here due to node.js being asynchronous // must close the client from mongo version 3.0+
        });
    });

    mongo.connect(url, function(err, client) {
        assert.equal(null, err);
        var db = client.db('carParkDB'); // new variable version 3.0+ (connection loads client -> this stores the database)
        const cursor = db.collection('Bookings').find(); //essentially an iterator
        cursor.forEach(function(doc, err) { // doc is the variable we want -> document (like an SQL entry)
            assert.equal(null, err); // check for an error
            bookings.push(doc); //add the document to the bookings array array
        }, function() {
            client.close();// must be here due to node.js being asynchronous // must close the client from mongo version 3.0+
            res.render('bookSpace', { spaces: filterSpaces(spaces, bookings) });
        });
    });


});


//This is the log in Functionality. The users login data is received using post and accessed with req (request)
//The data base is opened and the User collection is used to verify the users ID and password. a session is then
//created and tracked using cookies.
//INCOMPLETE
//Issues:
router.post('/login', function(req, res) {
    let user;

    userModel.findOne({ userID: parseInt(req.body.userID), password: req.body.password}, function(err, user) {
        if(err) {
            console.log(err);
            res.render('dashboard', { status: "error" } )
        }
        if (!user) {
            res.render('dashboard', { status: "not valid" } )
        }
        req.session.user = user;
        res.render('dashboard', { status: "success", user: user.name } )


    });
});


//This Function is used to simply list all the users. this is useful for administrator rights.
//Has no functionality to stop user passwords being sent to the client.
router.get('/get-users', function(req, res, next) { //list all users
    let users = [];
    mongo.connect(url, function(err, client) {
        assert.equal(null, err);
        var db = client.db('carParkDB'); // new variable version 3.0+ (connection loads client -> this stores the database)
        const cursor = db.collection('Users').find(); //essentially an iterator
        cursor.forEach(function(doc, err) { // doc is the variable we want -> document (like an SQL entry)
            assert.equal(null, err); // check for an error
            users.push(doc); //add the document to the users array
        }, function() {
            client.close();// must be here due to node.js being asynchronous // must close the client from mongo version 3.0+
            res.render('manageUsers', { items: users});
        });
    });
});


//This function is used to add a user to the database.
//This function takes the form input, opens the data base user collection and inserts a User Document.
//Current work in Progress. INCOMPLETE
router.post('/insert-user', function(req, res, next) {
    let user = {
        userID: parseInt(req.body.userID),
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        usertype: req.body.usertype
    };
    console.log("User created: " + user.name);


    mongo.connect(url, function(err, client){
        assert().equal(null, err);
        var db = client.db('carParkDB');
        db.collection('Users').insertOne(user);
        client.close();
    });
    res.redirect('/manageUsers');

    /*mongo.connect(url, function(err, client){
        assert().equal(null, err);
        var db = client.db('carParkDB');
        db.collection('Users').insertOne(user, function(err, result) {
            assert(null, err);
            console.log('user added.');
            client.close();
        });
    });
    res.redirect('/manageUsers');*/
});

router.post('/update', function(req, res, next) {

});

router.post('/delete', function(req, res, next) {

});

router.post('/addUser', function(req, res, next) {

    var newUser = new userModel();
    newUser.userID = parseInt(req.body.userID);
    newUser.name = req.body.name;
    newUser.phone = parseInt(req.body.phone);
    newUser.email = req.body.email;
    newUser.userType = req.body.usertype;
    newUser.password = req.body.password;

    newUser.save(function(err, addedUser) {
        if (err) {
            console.log(err);
            res.status(500).send();
        } else {
            //console.log('User added: ' + addedUser.name())
            res.render('./dashboard', { status: "success"} )
        }
    });
});


// old function to gather users, not sure if it has a use yet.
// This function opens the data base and pulls the user collection and RETURNS A LIST.
//INCOMPLETE
function getUsers() {

}


//this function removes personal booking data from the list that will be sent to the client browser.
//This function takes an array of spaces and an array of bookings that have been pulled from the database
// It will then go through and grab only the relivant information to be displayed to the client.
// It only keeps the space id, type and a list of booleans which represent the operating hours and if
// the space is available. RETURNS A LIST.
function filterSpaces(spaces, bookings) {
    let newSpaces = [];
    spaces.forEach(function(space) {
        let timeSlots = [];
        bookings.forEach(function(booking) {
            if (booking.spaceID == space.spaceID){
                for(var i = 7; i < 22; i++) {
                    if (i >= booking.timeFrom && i <= booking.timeTo ) {
                        timeSlots.push(false);
                    }
                    else {
                        timeSlots.push(true);
                    }
                }
            }
        });
        newSpace = {
            spaceID: space.spaceID,
            spaceType: space.spaceType,
            bookings: timeSlots
        };
        newSpaces.push(newSpace);

    });
    return newSpaces;
}

module.exports = router;
