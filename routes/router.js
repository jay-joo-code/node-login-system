var router = require('express').Router();
var mongoClient = require('mongodb').MongoClient;
var config = require('./../config');
var bcrypt = require('bcrypt');
var Auth = require('./../modules/Authentication');
const saltRounds = 10;

const { check, validationResult, checkSchema } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

var auth = function(req, res, next) {
    console.log('authenticating: ' + req.url);
    console.log(req.session);

    if (!req.session || !req.session.authenticated) {
        console.log('request reject');
        res.redirect('/');
        return
    } else {
        next();
    }
};

router.get('/', function(req, res) {
    res.render('login');
});

router.get('/register', function(req, res) {
    res.render('register');
});

router.get('/profile', auth, function(req, res) {
    res.render('profile');
});

router.post('/login-request', function(req, res) {
    mongoClient.connect(config.db.url, function(err, client) {
        if (err) throw err;
        client.db('loginsystem').collection('user', function(err, collection) {
            if (err) throw err;
            collection.findOne({email: req.body.email }, function(err, user) {
                if(err) throw err;
                console.log(user);
                bcrypt.compare(req.body.password, user.password, function(err, result) {
                    if (err) throw err;
                    if (result) {
                        // login success
                        req.session.authenticated = true;
                        req.session.userId = user._id;
                        res.redirect('/profile');
                    } else {
                        // login fail
                        res.redirect('/');
                    }
                });
            });
        });
        client.close();
    });
});

router.post('/logout-request', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

router.post('/register-request', [
    check('name')
        .exists().withMessage('name cannot be empty')
        .isLength({ min: 1 }).withMessage('name cannot be empty')
        .trim(),
    check('email')
        .exists()
        .isEmail()
        .trim()
        .normalizeEmail(),
    check('password')
        .exists()
        .isLength({ min: 5 }).withMessage('password must be at least 5 characters long'),
    check('confirmPassword')
        .exists()
        .custom((value, { req }) => value === req.body.password)],
    function(req, res) {
        // check form validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors.mapped());
            return res.redirect('/register');
        } else {
            // hash password
            bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                if (err) throw err;
                console.log(hash);
                var hashPassword = hash;

                // insert new user record
                var newUser = {
                    name: req.body.name,
                    email: req.body.email,
                    password: hashPassword
                };

                mongoClient.connect(config.db.url, function (err, client) {
                    if (err) throw err;
                    client.db('loginsystem').collection('user', function (err, collection) {
                        if (err) throw err;
                        collection.insertOne(newUser, function (err, result) {
                            if (err) throw err;
                            console.log('[DB] insert status:');
                            console.log(result.result.ok);
                        })
                    });
                    client.close();
                });
            });
            res.redirect('/');
        }
});


module.exports = router;