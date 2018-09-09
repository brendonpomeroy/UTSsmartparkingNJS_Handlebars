var MongoClient = require('mongodb').MongoClient;

var uri = "mongodb+srv://System:utssmartparking@parkdb-fez7r.mongodb.net/test?retryWrites=true";
MongoClient.connect(uri, function(err, client) {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object

    client.close();
});