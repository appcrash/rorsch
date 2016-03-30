var express = require('express');
var router = express.Router();
var http = require('http');
var https = require('https');
var common = require('../lib/common');
var url = require('url');
var logger = require('../lib/log').debug;
var cookie = require('cookie');
var parse = require('../lib/parse');
var zlib = require('zlib');



router.get(/.*/,function(req,res) {
    var pathname = req.path;

    if (pathname === undefined) {
        res.redirect(302,'/');
        return;
    }

    // remove prefix '/' if any
    pathname = pathname.replace(/^\//,'');

    var loc = decodeURIComponent(pathname);
    var origin_loc = loc;

    loc = loc.replace(/^\s*(https?:\/\/)?/,(_,p1) => {
        if (p1 === undefined) {
            return 'http://';
        }
        return p1;
    });


    loc = url.parse(loc.trim());

    // logger.info('origin loc is %s',origin_loc);
    // logger.info('http.request with host: %s,  path: %s',loc.host,loc.path);


    var option = {
        app_host : req.headers.host,  // the domain name of this proxy app
        proxied_host : loc.host,  // all relative links should relative to this host
        proxied_path : loc.pathname
    };


    var request = loc.protocol === 'https:' ? https.request : http.request;

    var srv_req = request({
        host : loc.host,
        port : loc.port,
        path : loc.path,
        method : 'GET'
    },(srv_res) => {
        var all_chunk = [];



        var sc = srv_res.statusCode;
        if (sc === 301 || sc === 302 || sc === 303) {
            var new_loc = srv_res.headers['location'];
            // if (!/^https?/.test(new_loc)) {
            //     // relative path
            //     new_loc = `${loc.host}${new_loc}`;
            // }

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
            var set_cookie = srv_res.headers['set-cookie'];
            var parsed_cookie;
            if (!!set_cookie) {
                set_cookie = set_cookie.join(';');
                parsed_cookie = cookie.parse(set_cookie,{});
                // logger.warn(JSON.stringify(parsed_cookie,null,2));
            }

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
    srv_req.end();
});


module.exports = router;