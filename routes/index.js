var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect("mongodb+srv://System:utssmartparking@parkdb-fez7r.mongodb.net/carParkDB?retryWrites=true");


//schemas define what data and how the data will exist in the database. These are strict and can only be defined once.
var bookingSchema = new Schema({
    //bookingID: Number,
    userID: Number,
    spaceID: Number,
    date: String,
    timeFrom: Number,
    timeTo: Number,
    price: Number
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
    bookingID: Schema.Types.ObjectId,
    price: Number,
    date: String
});

//Models what we use to access the data in the database.
var userModel = mongoose.model('Users', userSchema);
var bookingModel = mongoose.model('Bookings', bookingSchema);
var spaceModel = mongoose.model('Spaces', spaceSchema);
var receiptModel = mongoose.model('Receipts', receiptSchema);

//get the landing page (login)
router.get('/', function(req, res, next) { //.get as it is a normal get request
  res.render('index', { layout: false }); // render the page using express - layout false to stop nav being rendered
});

//log the user out
router.get('/logout', function(req, res) {
    delete req.session.user; // delete the user in the session
    res.redirect('/'); // redirect to log in
});

// pay portal is to simulat payment - not for production - this is where the system links to a payment service
router.post('/payPortal', function(req, res) {
    res.render('pay', { layout: false, bookingID: req.body.bookingID }); // we will use the booking id to track what the user is paying
});

//pay processes the payment on our database and records the transaction then redirects to the bookings view
router.post('/pay', function(req, res) {
    let bookingID = req.body.bookingID;
    //check if thepayment was successful
    if (req.body.paymentStatus == "fail") { // if the payment failed
        res.redirect('/bookings'); // redirect to the bookings page
    } else { // otherwise update the database
        bookingModel.findOne({_id: bookingID}, function(err, booking){
            if (err){
                console.log(err); // log errors that occur
            } else if (!booking) { //if the booking doesnt exist then log system error (earlier error handling will normally catch this)
                console.log(err);
                res.redirect('/bookings');
            } else {
                //set the date and time for the database
                let todaysDate = new Date();
                let date = todaysDate.getDate().toString() + "/" + (todaysDate.getMonth() + 1).toString() + "/" + todaysDate.getFullYear().toString() + " " + (todaysDate.getHours() + 1).toString() + ":" + (todaysDate.getMinutes() + 1).toString();

                //create the receipt
                let receipt = new receiptModel(); //must create a new instance of the model when creating a user.
                receipt.bookingID = bookingID;
                receipt.price = booking.price;
                receipt.date = date;

                //add the receipt to the database
                receipt.save(function (err, addedReceipt) {
                    if (err) {
                        console.log(err);
                        res.redirect('/bookings')
                    } else {
                        console.log(addedReceipt);
                        res.redirect('/bookings')
                    }
                });
            }
        });
    }
});

//show receipt allows the user to view a digital version of their receipt to keep for their own records
router.post('/showReceipt',function(req,res) {
    console.log(req.body.receiptID);
    receiptModel.findOne({ _id: req.body.receiptID }, function (err, receipt) {
        if (err) {
            res.render('receipt', { status: "receipt not found"});
            console.log(err);
        } else {
            console.log(receipt);
            //res.render('receipt', { receipt: receipt });
            bookingModel.findOne({ _id: receipt.bookingID }, function (err, booking) {
                if (err) {
                    console.log(err);
                } else {
                    res.render('receipt', { receipt: receipt, booking: booking });
                }
            });

        }
    });

    //res.render('receipt', { receipt: receipt });
});

//dashboard is where user lands after logging in and is represresented by home in the nav
router.get('/dashboard', function(req, res, next) {
    reLogin(req, res); //check the user is logger in

    //create todays date to match the database scheme
    let date;
    let todaysDate = new Date();
    date = todaysDate.getDate().toString() + "/" + (todaysDate.getMonth()+1).toString() + "/" + todaysDate.getFullYear().toString();

    //find the logged in users bookings for today
    bookingModel.find({ date: date, userID: req.session.user.userID }, function(err, bookingsDB) {
        if(err) {
            console.log(err);
        } else {
            res.render('dashboard', {bookings: bookingsDB}); //pass bookings to handlebars to display
        }
    });
});

//manage spaces allows admins to manage the users in the database
router.get('/manageSpaces', function(req, res) {
    reLogin(req, res); // check user is logged in
    if (req.session.user.userType == "Admin") { //check that the user is an admin
        spaceModel.find({}, function (err, spacesDB) { //get all spaces
            if (err) {
                console.log(err);
            } else {
                res.render('manageSpaces', {spaces: spacesDB}); //pass spaces to handlebars
            }
        });
    } else {
        res.status(404).send(); //send 404 not found if the user is not logged in as an admin
    }
});

//update spaces processes admins requests to modify a space
router.post('/updateSpace', function(req, res) {
    //update the database
    let spaceID = req.body.spaceID;
    let spaceType = req.body.spaceType;
    spaceModel.findOneAndUpdate({spaceID: spaceID}, {spaceType: spaceType}, function(err){ // update the space in the db
        if (err){ // check for error
            console.log(err); // log the error
        } else {
            res.redirect('/manageSpaces'); //otherwise if the space successfully update -> redirect back to the manageSpaces page
        }
    });
});

//book spaces process a booking and saves it to the database
router.post('/bookSpace', function(req, res, next) {
    //calculate the price of the booking server side for security
    let inputHours = req.body.hours;
    let price;
    if (inputHours <= 2) {
        price = inputHours * 10;
    } else if (inputHours > 2 && inputHours < 8) {
        price = inputHours * 8;
    } else {
        price = 60;
    }

    //create a new booking from the mongoose model
    let booking = new bookingModel();
    //booking.bookingID = getID();
    booking.userID = req.session.user.userID; //user id - automatically taken from the session
    booking.spaceID = parseInt(req.body.spaceID);//space id
    booking.date = req.body.date;//date
    booking.timeFrom = parseInt(req.body.timeFrom);//time from
    booking.timeTo = parseInt(req.body.timeFrom) + parseInt(req.body.hours);//time to
    booking.price = price;
    booking.save(function(err, confirmedBooking) { //save the booking to the database
        if (err) {
            console.log(err); //log errors
        } else {
            res.redirect('/bookings'); //direct user to their bookings
        }
    });
});

//bookings allows the user to view their bookings
router.get('/bookings', function(req, res, next) {
    reLogin(req, res); // check theyre logged in
    bookingModel.find({ userID: req.session.user.userID }, function(err, userBookings) { // find the users bookings
        if(err) {
            console.log(err); // log errors
        } else {
            receiptModel.find({}, function(err, receipts) { // find theusers receipts
                if(err) {
                    console.log(err); // log errors
                } else {
                    res.render('bookings', { bookings: filterBookings(userBookings, receipts) }); // use filterBookings to return a merged and processed version of the bookings that works with handlebars
                }
            });
        }
    });
});

//cancel booking processes the users request to delete their booking
router.post('/cancelBooking', function(req, res) {
    //update the database
    let bookingID = req.body.bookingID;
    bookingModel.deleteOne({_id: bookingID}, function (err) { // delete one is the newest call to delete using mongoose and mongoDB by extension
        if (err) {
            console.log(err);
            return res.status(500).send(); // return server error if error occurred
        }
        res.redirect('/bookings'); // redirect the user to their bookings to seethe changes
    });

});

//account displays the users information and allows them to edit their details
router.get('/account', function(req, res, next) {
    reLogin(req, res);
    res.render('account', { user: req.session.user});
});

// manage users is a way for administrators to see the users in the system and make changes
router.get('/manageUsers', function(req, res) {
    reLogin(req, res);
    userModel.find({}, function(err, userDB) { // get all users
        if(err) {
            console.log(err);
        } else {
            res.render('manageUsers', { users: userDB} ) // pass users to handlebars to render out to the user
        }
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
            res.render('index', { layout: false, status: "Not valid a valid user" } )
        } else if (!user) {
            res.render('index', { layout: false, status: "Not valid a valid user" } )
        } else {
            req.session.user = user;
            if (user.userType == "Admin") {
                req.app.locals.isAdmin=true;
            } else {
                req.app.locals.isAdmin=false;
            }
            res.redirect('dashboard');
        }

    });
});

// update user processes the users edit to their profile
router.post('/updateUser', function(req, res, next) {
    //update the database
    let userID = req.session.user.userID;
    let name = req.body.name;
    let phone = req.body.phone;
    let email = req.body.email;
    let password = req.body.password;
    console.log(userID + ", " + name + ", " + phone + ", " + email + ", " + password );
    if (password.length > 0) { // if the user didnt change their password exclude it from the update
        userModel.findOneAndUpdate({userID: userID}, {
            name: name,
            phone: phone,
            email: email,
            password: password
        }, {new: true}, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/account'); // redirect the user to their account so they can see the changes
                req.session.user = user; // update the user session with the new user details
            }
        });
    } else { // otherwise update everything
        userModel.findOneAndUpdate({userID: userID}, {
            name: name,
            phone: phone,
            email: email
        }, {new: true}, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                req.session.user = user;
                res.redirect('/account');
            }
        });
    }
});

//delete user processes the administrators request to remove a user from the system.
router.post('/deleteUser', function(req, res, next) {
        let userID = req.body.deleteUserID;

        userModel.deleteOne({userID: userID}, function (err) { // delete user with the matching ID
            if (err) {
                console.log(err);
                return res.status(500).send(); // if an error occurred send a server error
            }
            res.redirect(`/manageUsers`); // redirect the admin to the manage users page to continue making changes
        });
});

//Add a new user to the data base
router.post('/addUser', function(req, res, next) {

    let newUser = new userModel(); //must create a new instance of the model when creating a user.
    newUser.userID = parseInt(req.body.userID); //according to schema this needs to be a number
    newUser.name = req.body.name;
    newUser.phone = parseInt(req.body.phone);
    newUser.email = req.body.email;
    newUser.userType = req.body.usertype;
    newUser.password = req.body.password;

    newUser.save(function(err, addedUser) { // save the user using mongoose
        if (err) {
            console.log(err);
            res.status(500).send(); // if there was an error send a server error
        } else {
            //console.log('User added: ' + addedUser.name())
            res.redirect('/manageUsers');
        }
    });
});

//get user data is used by the manage users page to get user data when the admin opts to view the user
router.post('/getUserData', function(req, res) {
    userID = req.body.userID;
    userModel.findOne({ userID: parseInt(userID)}, function(err, user) {
        if (err) {
            //error occurred
            console.log(err);
            res.render('manageUsers', { status: "An error occurred"} )
        }
        if (!user) {
            //No valid user found
            res.render('manageUsers', { status: "An error occurred"} )
        } else {
            res.send({user: user});
        }
    });
});

//returns the information about the space requested
router.post('/getSpaceData', function(req, res) {
    spaceID = req.body.spaceID;
    spaceModel.findOne({ spaceID: spaceID}, function(err, space) {
        if (err) {
            //error occurred
            console.log(err);
            res.render('manageSpaces', { status: "An error occurred"} )
        } else if (!space) {
            //error occurred
            console.log("Space not found");
            res.render('manageSpaces', {status: "An error occurred"})
        } else {
            res.send({space: space});
        }
    });
});

router.get('/showSpaces', function(req, res) {
    reLogin(req, res);
    res.render('altBookSpace');
});

router.post('/getUserBookings', function(req, res) {
    let userID = req.body.userID;
    let todaysDate = new Date();
    let date1 = todaysDate.getDate().toString() + "/" + (todaysDate.getMonth()+1).toString() + "/" + todaysDate.getFullYear().toString();
    let date2 = (todaysDate.getDate()+1).toString() + "/" + (todaysDate.getMonth()+1).toString() + "/" + todaysDate.getFullYear().toString();
    let date3 = (todaysDate.getDate()+2).toString() + "/" + (todaysDate.getMonth()+1).toString() + "/" + todaysDate.getFullYear().toString();
    console.log(date1 + " " + date2 + " " + date3);
    bookingModel.find({ userID: userID, date: date1 }, function(err, bookings1) {
        if (err) {
            console.log(err);
        } else {
            console.log(1);
            bookingModel.find({ userID: userID, date: date2 }, function(err, bookings2) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(2);
                    bookingModel.find({userID: userID, date: date3}, function (err, bookings3) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(3);
                            let bookings = bookings1.concat(bookings2, bookings3);
                            console.log(bookings);
                            res.send({ bookings: bookings });
                        }
                    });
                }
            });
        }
    });
});

router.post('/getSpaces', function(req, res) {
    let spaces = [];
    let bookings = [];
    let filteredSpaces = [];

    let date;
    let todaysDate = new Date();
    if (req.body.day == "Today") {
        date = todaysDate.getDate().toString() + "/" + (todaysDate.getMonth()+1).toString() + "/" + todaysDate.getFullYear().toString();
    }
    else if (req.body.day == "Tomorrow") {
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
            bookings = bookingsDB;
            spaceModel.find({}, function(err, spaceDB) {
                if(err) {
                    console.log(err);
                } else {
                    spaces = spaceDB;
                }
                filteredSpaces = filterSpaces(spaces, bookings);
                console.log(filteredSpaces);
                res.send(filterSpaces(spaces, bookings)); //may need some sequential support
            });
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
        for(var i = 0; i <= 15; i++) { timeSlots.push(true); }
        bookings.forEach(function(booking) {
            if (booking.spaceID == space.spaceID){
                for(var i = 0; i <= 15; i++) {
                    if (i >= booking.timeFrom-7 && i <= booking.timeTo-7 ) {
                        timeSlots[i] = false;
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

// filter bookings checks to see if bookings are past or paid to determine which options the user needs
// on the bookings page, it returns it in an object that works well with the templating engine.
function filterBookings(bookings, receipts) {
    let newBookings = [];
    bookings.forEach(function(booking) {
        let isPaid = false;
        let isPast = true;
        let receiptID = null;
        receipts.forEach(function(receipt) {
            if ((receipt.bookingID).toString() == (booking._id).toString()){
                isPaid = true;
                receiptID = receipt._id;
            }
        });

        let date = new Date();
        let bookingDate = (booking.date).split("/");
        if (bookingDate[1] > date.getMonth()+1) {
            isPast = false;
        } else if (bookingDate[1] == date.getMonth()+1 && bookingDate[0] > date.getDate()) {
            isPast = false;
        }
        let newBooking = {
            bookingID: booking._id,
            spaceID: booking.spaceID,
            date: booking.date,
            timeFrom: booking.timeFrom,
            timeTo: booking.timeTo,
            price: booking.price,
            isPaid: isPaid,
            receipt: receiptID,
            isPast: isPast
        };
        newBookings.push(newBooking);

    });
    return newBookings;
  }

  function reLogin(req, res){
    if (!req.session.user) {
      res.render('index', { layout: false });
    }
  }

//module.data = filterSpaces();
//module.data = filterBookings();
module.exports = router;
