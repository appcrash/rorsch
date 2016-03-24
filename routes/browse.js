var express = require('express');
var router = express.Router();
var http = require('http');
var common = require('../common');
var url = require('url');
var logger = require('../log').debug;
var cookie = require('cookie');


var prefix = require('path').basename(__filename,'.js');

router.get(/.*/,function(req,res) {
    var pathname = req.path;

    if (pathname === undefined) {
        res.redirect(302,'/');
        return;
    }

    // remove prefix '/' if any
    pathname = pathname.replace(/^\//,'');

    var loc = decodeURIComponent(pathname);
    loc = loc.replace(/^(https?:\/\/)?/,(_,p1) => {
        if (p1 === undefined) {
            return 'http://';
        }
        return p1;
    });


    logger.info('origin loc is ' + loc);

    loc = url.parse(loc.trim());

    logger.info('http.request with host: ' + loc.host);

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
                if (!/^https?/.test(new_loc)) {
                    // relative path
                    new_loc = `${loc.host}${new_loc}`;
                }
                logger.debug('redirect with origin loc %s%s  <==> new loc %s',
                    loc.host,loc.path,new_loc);
                res.redirect(sc,common.proxyUrl(req.headers.host,new_loc));
                return;
            }

            var set_cookie = srv_res.headers['set-cookie'];
            var parsed_cookie;
            if (!!set_cookie) {
                set_cookie = set_cookie.join(';');
                parsed_cookie = cookie.parse(set_cookie,{});
                // logger.debug(JSON.stringify(parsed_cookie,null,2));
            }

            res.writeHead(200);

            var newdata = data.replace(/(href|src)\s*=\s*['"]?([^'"]{1,1000})['"]?/mg,
                (match,p1,p2) => {
                    var replaced_url = p2;
                    if (!/^https?/.test(replaced_url)) {
                        replaced_url = replaced_url.replace(/^(\/)/,() => {
                            // prepend '/' if missing
                            return '/';
                        });

                        // relative to absolute url
                        replaced_url = `${loc.host}${replaced_url}`;
                        logger.debug('%s replaced to %s',p2,replaced_url);
                    }
                    var new_url = common.proxyUrl(req.headers.host,replaced_url);
                    return `${p1}=${new_url}`;
                });

            res.write(newdata,'binary');

            res.end();
        });
    });

    srv_req.on('error',(e) => {
        logger.error(e.message);
    });
    srv_req.end();
});


module.exports = router;