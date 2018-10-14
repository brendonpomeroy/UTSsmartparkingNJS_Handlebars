var assert = require('assert');

function testFilterSpaces() {
    let bookings = [{
        _id: "29y876tyu8765tyu76",
        userID: 12345678,
        spaceID: 1,
        date: "12/10/2018",
        timeFrom: 10,
        timeTo: 14,
        price: 22
    }, {
        _id: "8765rtyu765tyui987y",
        userID: 12345679,
        spaceID: 1,
        date: "12/10/2018",
        timeFrom: 15,
        timeTo: 16,
        price: 10
    }];

    let spaces = [{
        spaceID: 1,
        locationID: 1,
        spaceType: "Regular"
    }];
    return filterSpaces(spaces, bookings);
}

function testFilterBookings() {
    let bookings = [{
        _id: "29y876tyu8765tyu76",
        userID: 12345678,
        spaceID: 1,
        date: "12/10/2018",
        timeFrom: 10,
        timeTo: 14,
        price: 22
    }, {
        _id: "8765rtyu765tyui987y",
        userID: 12345678,
        spaceID: 1,
        date: "12/10/2018",
        timeFrom: 15,
        timeTo: 16,
        price: 10
    }];

    let receipts = [];

    return filterBookings(bookings, receipts);
}

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
        let newSpace = {
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
    bookings.forEach(function (booking) {
        let isPaid = false;
        let isPast = true;
        let receiptID = null;
        receipts.forEach(function (receipt) {
            if ((receipt.bookingID).toString() == (booking._id).toString()) {
                isPaid = true;
                receiptID = receipt._id;
            }
        });

        let date = new Date();
        let bookingDate = (booking.date).split("/");
        if (bookingDate[1] > date.getMonth() + 1) {
            isPast = false;
        } else if (bookingDate[1] == date.getMonth() + 1 && bookingDate[0] > date.getDate()) {
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

var filterBookingsExpectedOutput = [{
    bookingID: '29y876tyu8765tyu76',
    spaceID: 1,
    date: '12/10/2018',
    timeFrom: 10,
    timeTo: 14,
    price: 22,
    isPaid: false,
    receipt: null,
    isPast: true
}, {
    bookingID: '8765rtyu765tyui987y',
    spaceID: 1,
    date: '12/10/2018',
    timeFrom: 15,
    timeTo: 16,
    price: 10,
    isPaid: false,
    receipt: null,
    isPast: true
}];

var filterSpacesExpectedOutput = [{
    spaceID: 1,
    spaceType: "Regular",
    bookings: [ true, true, true, false, false, false, false, false, true, false, true, true, true, true, true, true ]
}];


describe('Filter Bookings Function', function () {
    describe('#filterBookings()', function () {
        it('bookingID should be 29y876tyu8765tyu76', function () {
            assert.equal(testFilterBookings()[0].bookingID, filterBookingsExpectedOutput[0].bookingID);
        });
        it('spaceID should be 1', function () {
            assert.equal(testFilterBookings()[0].spaceID, 1);
        });
        it('date should be 12/10/2018', function () {
            assert.equal(testFilterBookings()[0].date, "12/10/2018");
        });
        it('timeFrom should be 10', function () {
            assert.equal(testFilterBookings()[0].timeFrom, 10);
        });
        it('timeTo should be 14', function () {
            assert.equal(testFilterBookings()[0].timeTo, 14);
        });
        it('price should be 22', function () {
            assert.equal(testFilterBookings()[0].price, 22);
        });
        it('isPaid should be false', function () {
            assert.equal(testFilterBookings()[0].isPaid, false);
        });
        it('receipt should be null', function () {
            assert.equal(testFilterBookings()[0].receipt, null);
        });
        it('isPast should be true', function () {
            assert.equal(testFilterBookings()[0].isPast, true);
        });

    });
});

describe('Filter spaces Function', function () {
    describe('#filterSpaces()', function () {
        it('spaceID should be 1', function () {
            assert.equal(testFilterSpaces()[0].spaceID, 1);
        });
        it('spaceType should be Regular', function () {
            assert.equal(testFilterBookings()[0].spaceType, filterSpacesExpectedOutput[0].spaceType);
        });
        it('bookings arrays are equal', function () {
            assert.equal(testFilterBookings()[0].bookings, filterSpacesExpectedOutput[0].bookings);
        });

    });
});


//module.exports = filterSpaces;