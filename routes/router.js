var router = require('express').Router();

router.get('/', function(req, res) {
    res.render('login');
});

router.get('/register', function(req, res) {
    res.render('register');
});

module.exports = router;