var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.connect("mongodb+srv://System:utssmartparking@parkdb-fez7r.mongodb.net/");

var userSchema = mongoose.schema({
    userID: Number,
    name: String,
    phone: Number,
    email: String,
    userType: String,
    password: String
});

var userModel = mongoose.model('Users', userSchema);

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('/dashboard', { status: "users router."});
});

router.post('/addUser', function(req, res, next) {

    var newUser = new userModel();
    newUser.userID = parseInt(req.body.userID);
    newUser.name = req.body.name;
    newUser.phone = parseInt(req.body.phone);
    newUser.email = req.body.email;
    newUser.userType = req.body.userType;
    newUser.password = req.body.password;

    newUser.save(function(err, addedUser) {
        if (err) {
            console.log(err);
            res.status(500).send();
        } else {
            res.render('/dashboard', { status: "success"} )
        }
    });
});

module.exports = router;
