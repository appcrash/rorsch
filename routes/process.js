var express = require('express');
var router = express.Router();
var http = require('http');
var common = require('../common');
var url = require('url');
var logger = require('../log').debug;

router.get('/',function(req,res) {
    // console.log(req.headers);

    var loc = req.query.loc;
    loc = loc.replace(/^(https?:\/\/)?/,(_,p1) => {
        if (p1 === undefined) {
            return 'http://';
        }
        return p1;
    });

    loc = url.parse(loc.trim());

    var srv_req = http.request({
        host : loc.host,
        port : loc.port,
        path : loc.path,
        protocol : loc.protocol,
        method : 'GET'
    },(srv_res) => {

        var data = '';

        srv_res.setEncoding('binary');
        srv_res.on('data',(chunk) => {
            data += chunk;
        });
        srv_res.on('end',() => {
            res.contentType = srv_res.headers['content-type'];

            var sc = srv_res.statusCode;
            if (sc === 301 || sc === 302) {
                var new_loc = srv_res.headers['location'];
                res.redirect(sc,common.proxyUrl(req.headers.host,new_loc));
                return;
            }

            res.writeHead(200);

            var newdata = data.replace(/(href|src)\s*=\s*['"]?([^'"]{1,1000})['"]?/mg,
                (match,p1,p2) => {
                    // logger.debug('url is ' + p2);
                    var new_url = common.proxyUrl(req.headers.host,p2);
                    return `${p1}=${new_url}`;
                });

            res.write(newdata,'binary');

            res.end();
        });
    });

    srv_req.on('error',(e) => {
        console.log(e.message);
    });
    srv_req.end();
});


module.exports = router;