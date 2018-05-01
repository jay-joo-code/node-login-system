module.exports.manualLogin = function(emailInput, passwordInput, callback) {
    mongoClient.connect(config.db.url, function(err, client) {
        if (err) throw err;
        client.db('loginsystem').collection('user', function(err, collection) {
            if (err) throw err;
            collection.findOne({email: emailInput }, function(err, user) {
                if(err) throw err;
                bcrypt.compare(passwordInput, user.password, function(err, result) {
                    if (err) throw err;
                    if (result) {
                        // login success
                        return callback(null, user)
                    } else {
                        // login fail
                        return callback('incorrect password');
                    }
                });
            });
        });
        client.close();
    });
};