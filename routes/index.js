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
    bookingID: Schema.Types.ObjectId,
    date: String
});

//Models what we use to access the data in the database.
var userModel = mongoose.model('Users', userSchema);
var bookingModel = mongoose.model('Bookings', bookingSchema);
var spaceModel = mongoose.model('Spaces', spaceSchema);
var receiptModel = mongoose.model('Receipts', receiptSchema);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { layout: false });
});

router.post('/payPortal', function(req, res) {
    res.render('pay', { layout: false, bookingID: req.body.bookingID });
});

router.post('/pay', function(req, res) {
    //check if thepayment was successful
    if (req.body.paymentStatus == "fail") {
        res.render('bookings', { status: "Payment Failed"} )
    } else {
        //set the date and time for the database
        let todaysDate = new Date();
        let date = todaysDate.getDate().toString() + "/" + (todaysDate.getMonth() + 1).toString() + "/" + todaysDate.getFullYear().toString() + " " + (todaysDate.getHours() + 1).toString() + ":" + (todaysDate.getMinutes() + 1).toString();

        //create the receipt
        let receipt = new receiptModel(); //must create a new instance of the model when creating a user.
        receipt.bookingID = req.body.bookingID;
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


router.get('/dashboard', function(req, res, next) {
    res.render('dashboard');
});

router.get('/manageSpaces', function(req, res) {
    if (req.session.user.userType == "Admin") {
        spaceModel.find({}, function (err, spacesDB) {
            if (err) {
                console.log(err);
            } else {
                res.render('manageSpaces', {spaces: spacesDB});
            }
        });
    } else {
        res.status(404).send();
    }
});

router.post('/updateSpace', function(req, res) {
    //update the database
    let spaceID = req.body.spaceID;
    let spaceType = req.body.spaceType;
    spaceModel.findOneAndUpdate({spaceID: spaceID}, {spaceType: spaceType}, function(err){
        if (err){
            console.log(err);
        } else {
            res.redirect('/manageSpaces');
        }
    });
});

router.post('/bookSpace', function(req, res, next) {
    //function()
    console.log(req.body.spacesID);
    console.log(req.body.date);
    console.log(req.body.timeFrom);
    console.log(req.body.hours);
    let booking = new bookingModel();
    //booking.bookingID = getID();
    booking.userID = req.session.user.userID; //user id - automatically taken from the session
    booking.spaceID = parseInt(req.body.spaceID);//space id
    booking.date = req.body.date;//date
    booking.timeFrom = parseInt(req.body.timeFrom);//time from
    booking.timeTo = parseInt(req.body.timeFrom) + parseInt(req.body.hours);//time to
    console.log(booking);
    booking.save(function(err, confirmedBooking) {
        if (err) {
            console.log(err);
        } else {
            console.log('Booking: ' + confirmedBooking);
            res.redirect('/bookings');
        }
    });
});

router.get('/bookings', function(req, res, next) {
    let bookings;
    bookingModel.find({ userID: req.session.user.userID }, function(err, userBookings) {
        if(err) {
            console.log(err);
        } else {
                //res.render('bookings', { bookings: userBookings } );
            //bookings = userBookings;
            receiptModel.find({}, function(err, receipts) {
                if(err) {
                    console.log(err);
                } else {
                    res.render('bookings', { bookings: filterBookings(userBookings, receipts) });
                }
            });
        }
    });



});

router.post('/cancelBooking', function(req, res) {
    //update the database

    let bookingID = req.body.bookingID;

    bookingModel.deleteOne({_id: bookingID}, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send();
        }
        res.redirect(`/bookings`);
    });

});

router.get('/account', function(req, res, next) {
    if (!req.session.user) {
        res.render('index');
    }

    res.render('account', { user: req.session.user});
});

router.get('/manageUsers', function(req, res) {
    userModel.find({}, function(err, userDB) {
        if(err) {
            console.log(err);
        } else {
            res.render('manageUsers', { users: userDB} )
        }
    });
});


//Get spaces is triggered by a user clicking the day options, the function then
//opens the database Spaces collection and stores it in a list temporarily
//the Bookings are then queried with the .find() function ***this will need the correct date added***
//the booking collection is also stored in a temporary list and sent filterSpaces() to remove private data.
router.get('/altgetSpaces', function(req, res) {
    let spaces = [];
    let bookings = [];
    let filteredSpaces = [];

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
            bookings = bookingsDB;
        }
    });
    spaceModel.find({}, function(err, spaceDB) {
        if(err) {
            console.log(err);
        } else {
           spaces = spaceDB;
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
        } else if (!user) {
            res.render('index', { layout: false, status: "Not valid a valid user" } )
        } else {
            req.session.user = user;
            res.render('dashboard');
        }

    });
});

router.post('/updateUser', function(req, res, next) {

});

router.post('/deleteUser', function(req, res, next) {
        let userID = req.body.deleteUserID;

        userModel.deleteOne({userID: userID}, function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send();
            }
            res.redirect(`/manageUsers`);
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
            res.redirect('/manageUsers');
        }
    });
});

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
            //user found
            bookingModel.findOne({ userID: parseInt(userID)}, function(err, bookings) {
                if (err) {
                    //error occurred
                    console.log(err);
                    res.render('manageUsers', { status: "An error occurred"} )
                } else {
                    //user found
                    //res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.send({user: user, bookings: bookings});
                }
            });
        }
    });
});

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
    res.render('altBookSpace');
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
            isPaid: isPaid,
            receipt: receiptID,
            isPast: isPast
        };
        newBookings.push(newBooking);

    });
    return newBookings;
}

module.exports = router;
