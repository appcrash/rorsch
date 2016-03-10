var express = require('express');
var router = express.Router();
var http = require('http');

router.post('/',function(req,res) {
    // console.log(req.headers);
    // console.log(req.body.loc);

    var loc = req.body.loc;

    var srv_req = http.request({
        host : loc,
        port : 80,
        path : '/',
        method : 'GET'
    },(srv_res) => {
        console.log(srv_res.statusCode);
        var data = '';

        srv_res.on('data',(chunk) => {
            data += chunk;
        });
        srv_res.on('end',() => {
            res.writeHead(200,{
                'Content-Type' : 'text/html;',
            });
            res.write(data);
            res.end();
        });
    });

    srv_req.on('error',(e) => {
        console.log(e.message);
    });
    srv_req.end();
});


module.exports = router;