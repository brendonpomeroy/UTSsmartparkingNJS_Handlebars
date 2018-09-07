var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/bookSpace', function(req, res, next) {
    res.render('bookSpace.hbs', { title: 'Book Space' });
});

module.exports = router;