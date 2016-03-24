var express = require('express');
var router = express.Router();
var http = require('http');
var common = require('../common');
var url = require('url');
var logger = require('../log').debug;


router.get(/.*/,function(req,res) {
    var loc = req.query.loc;

    var redirect_to = '/browse/' + encodeURIComponent(loc);
    logger.debug('redirect to   ' + redirect_to);
    res.redirect(302,redirect_to);

    return;
});


module.exports = router;