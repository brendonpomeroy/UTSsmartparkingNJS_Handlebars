var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect("mongodb+srv://System:utssmartparking@parkdb-fez7r.mongodb.net/carParkDB?retryWrites=true");


//schemas define what data and how the data will exist in the database. These are strict and can only be defined once.
var bookingSchema = new Schema({
    bookingID: Number,
    userID: Number,
    spaceID: Number,
    date: String,
    timeFrom: Number,
    timeTo: Number
});

var userSchema = new Schema({
    userID: Number,
    name: String,
    phone: Number,
    email: String,
    userType: String,
    password: String
});

var spaceSchema = new Schema({
    spaceID: Number,
    locationID: Number,
    spaceType: String
});

var receiptSchema = new Schema({
    receiptID: Number,
    bookingID: Number,
    date: Date
});

//Models what we use to access the data in the database.
var userModel = mongoose.model('Users', userSchema);
var bookingModel = mongoose.model('Bookings', bookingSchema);
var spaceModel = mongoose.model('Spaces', spaceSchema);
var receiptModel = mongoose.model('Receipts', receiptSchema);

//var mongo = require('mongodb').MongoClient;
//var assert = require('assert');
//var url = "mongodb+srv://System:utssmartparking@parkdb-fez7r.mongodb.net/";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { layout: false });
});

router.get('/pay', function(req, res) {
    res.render('pay', { layout: false });
});

router.get('/dashboard', function(req, res, next) {
    res.render('dashboard', {ind: 0});
});

router.get('/bookSpace', function(req, res, next) {
    res.render('bookSpace', { title: 'Book Space', ind: 1});
});

router.get('/bookings', function(req, res, next) {
    res.render('bookings', { title: 'Bookings', ind: 2});
});

router.get('/account', function(req, res, next) {
    if (!req.session.user) {
        res.render('index');
    }

    res.render('account', { user: req.session.user, ind: 4});
});

router.get('/manageUsers', function(req, res) {
    let users = [];

    userModel.find({}, function(err, userDB) {
        if(err) {
            console.log(err);
        } else {
            res.render('manageUsers', { users: userDB, ind: 3} )
        }
    });
});


//Get spaces is triggered by a user clicking the day options, the function then
//opens the database Spaces collection and stores it in a list temporarily
//the Bookings are then queried with the .find() function ***this will need the correct date added***
//the booking collection is also stored in a temporary list and sent filterSpaces() to remove private data.
router.get('/getSpaces', function(req, res) {
    let spaces = [];
    let bookings = [];
    let filteredSpaces = [];
    /*
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
    });*/

    let date;
    let todaysDate = new Date();
    if (req.query.day == "Today") {
        date = todaysDate.getDate().toString() + "/" + (todaysDate.getMonth()+1).toString() + "/" + todaysDate.getFullYear().toString();
    }
    else if (req.query.day == "Tomorrow") {
        date = (todaysDate.getDate()+1).toString() + "/" + (todaysDate.getMonth()+1).toString() + "/" + todaysDate.getFullYear().toString();
    }
    else {
        date = (todaysDate.getDate()+2).toString() + "/" + (todaysDate.getMonth()+1).toString() + "/" + todaysDate.getFullYear().toString();
    }
    console.log(date);


    bookingModel.find({ date: date }, function(err, bookingsDB) {
        if(err) {
            console.log(err);
        } else {
            console.log(bookingsDB);
            bookings = bookingsDB;
        }
    });
    spaceModel.find({}, function(err, spaceDB) {
        if(err) {
            console.log(err);
        } else {
           spaces = spaceDB;
           console.log(spaces);
        }
        filteredSpaces = filterSpaces(spaces, bookings);
        console.log(filteredSpaces);
        res.render('bookSpace', { spaces: filterSpaces(spaces, bookings) }); //may need some sequential support
    });



});


//This is the log in Functionality. The users login data is received using post and accessed with req (request)
//The data base is opened and the User collection is used to verify the users ID and password. a session is then
//created and tracked using cookies.
router.post('/login', function(req, res) {
    let user;

    userModel.findOne({ userID: parseInt(req.body.userID), password: req.body.password}, function(err, user) {
        if(err) {
            console.log(err);
            res.render('dashboard', { status: "error" } )
        }
        if (!user) {
            res.render('index', { layout: false, status: "Not valid a valid user" } )
        }
        req.session.user = user;
        res.render('dashboard')


    });
});

router.post('/updateUser', function(req, res, next) {
    if (req.session.user.userType == "Admin") {
        //delete the user
    } else {
        res.status(404).send();
    }
});

router.delete('/deleteUser', function(req, res, next) {
        let user = req.body.userID;

        userModel.findOneAndRemove({userID: user}, function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send();
            }
            res.redirect(`manageUsers`, {status: "Successfully deleted user."})
            //return res.status(200).send();
        });
});

//Add a new user to the data base
router.post('/addUser', function(req, res, next) {

    let newUser = new userModel(); //must create a new instance of the model when creating a user.
    newUser.userID = parseInt(req.body.userID); //according to sschema this needs to be a number
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
                for(var i = 7; i <= 22; i++) {
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
