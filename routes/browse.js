var express = require('express');
var router = express.Router();
var http = require('http');
var https = require('https');
var common = require('../lib/common');
var url = require('url');
var logger = require('../lib/log').debug;
var cookie = require('../lib/cookie');
var parse = require('../lib/parse');
var zlib = require('zlib');



router.all(/.*/,function(req,res) {
    var pathname = req.path;
    var query = common.parse_query(req.originalUrl).query;
    var method = req.method;

    if (!(method === 'GET' || method == 'POST')) {
        res.render('error', {
            message: `method ${method} not supported yet`,
            error: {}
        });
        return;
    }

    if (pathname === undefined) {
        res.redirect(302,'/');
        return;
    }

    // remove prefix '/' if any
    pathname = pathname.replace(/^\//,'');

    var loc = decodeURIComponent(pathname);
    var origin_path = loc;

    loc = loc.replace(/^\s*(https?:\/\/)?/,(_,p1) => {
        if (p1 === undefined) {
            return 'http://';
        }
        return p1;
    });


    loc = url.parse(loc.trim());

    // logger.info('origin path is %s',origin_path);
    // logger.info('http.request with host: %s,  path: %s, pathname: %s',loc.host,loc.path,loc.pathname);


    var option = {
        app_host : req.headers.host,  // the domain name of this proxy app
        proxied_host : loc.host,  // all relative links should relative to this host
        proxied_path : loc.pathname
    };


    var req_headers = {};
    var request = loc.protocol === 'https:' ? https.request : http.request;

    // decode cookie string if any, and forward all cookies to real server
    var enc_cookie_str = req.cookies['!!K'];
    if (!!enc_cookie_str) {
        var dec_cookie_str = new Buffer(enc_cookie_str,'base64').toString('ascii');
        var decoded_cookie = JSON.parse(dec_cookie_str);
        // logger.info(logger.pretty(decoded_cookie));
        var cookie_str = '';

        for (var k in decoded_cookie) {
            var v = decoded_cookie[k].value;
            cookie_str += `${k}=${v};`;
        }

        // forward cookies to real server
        // logger.info(cookie_str);
        req_headers['cookie'] = cookie_str;
    }

    var srv_req;

    if (method === 'POST') {
        for (var h in req.headers) {
            if (h !== 'cookie') {
                logger.debug(`set header ${h} for post request`);
                req_headers[h] = req.headers[h];
            }
        }
    }

    var srv_req_path = loc.path;
    if (!!query) {
        // append query string without encoding it
        srv_req_path += '?' + query;
        // logger.info('srv_req_path is ',srv_req_path);
    }

    srv_req = request({
        host : loc.host,
        port : loc.port,
        path : srv_req_path,
        method : method,
        headers : req_headers
    });

    srv_req.on('response',(srv_res) => {
        var all_chunk = [];

        var sc = srv_res.statusCode;
        if (sc === 301 || sc === 302 || sc === 303) {
            var new_loc = srv_res.headers['location'];
            var redirect = common.proxyUrl(option,new_loc)

            logger.debug('redirect is ' + redirect);
            res.redirect(sc,redirect);
            return;
        }

        var ct_str = srv_res.headers['content-type'];
        if (ct_str === undefined) {
            var err = `undefined content-type, loc: ${origin_loc}`;
            res.status(404).send(err);
            return;
        }

        var ct = ct_str.split(';')[0];
        var parser = parse.get_parser(ct);
        var ce_str = srv_res.headers['content-encoding'];
        res.setHeader('content-type',ct_str);
        // res.set('Content-Encoding',ce_str);

        var set_cookie = srv_res.headers['set-cookie'];
        if (!!set_cookie) {
            var parsed_cookie = cookie.parse_set_cookie(set_cookie.join(''));
            // logger.warn(JSON.stringify(parsed_cookie,null,2));

            var encoded_cookie = new Buffer(JSON.stringify(parsed_cookie)).toString('base64');
            // var cookie_str = `!!K=${encoded_cookie}; Path=/browse${req.path}`;
            var cookie_str = `!!K=${encoded_cookie};`;

            // logger.debug('cookie_str');
            // logger.debug(cookie_str);

            res.setHeader('set-cookie',cookie_str);
        }

        res.writeHead(sc);

        if (!parser) {
            // just stream data as it goes
            srv_res.pipe(res);
        } else {
            // keep all data until it finished
            srv_res.on('data',(chunk) => {
                all_chunk.push(chunk);
            });
        }

        srv_res.on('end',() => {
            if (parser) {
                var data = Buffer.concat(all_chunk);
                if (ce_str) {
                    var ce = ce_str.trim();

                    var defunc;
                    switch(ce) {
                        case 'gzip':
                            defunc = zlib.gunzipSync;
                            break;
                        case 'deflate':
                            defunc = zlib.inflateSync;
                            break;
                        default:
                            defunc = (d) => {return d;};
                            logger.info('do not do any thing with encoding ' + ce);
                    }

                    data = defunc(data);
                }

                data = data.toString('binary');



                var newdata = parser(option,data);

                try {
                    res.write(newdata,'binary');
                } catch(e) {
                    logger.error(e);
                }
            }

            res.end();
        });
    });

    srv_req.on('error',(e) => {
        logger.error(e.message);
    });

    // forward post data to server intactly
    if (method === 'POST') {
        req.pipe(srv_req);
    } else {
        srv_req.end();
    }
});


module.exports = router;