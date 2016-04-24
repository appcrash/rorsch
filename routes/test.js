var express = require('express');
var router = express.Router();
var logger = require('../lib/log').debug;


router.get('/',function(req,res) {
    res.render('test',{message : 'hello'});
});


module.exports = router;