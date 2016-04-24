var logger = require('./log').parse_debug;
var common = require('./common');


var parse_mapping = {
    'text/javascript' : js,
    'application/javascript' : js,
    'application/x-javascript' : js,
    'application/xhtml+xml' : html,
    'text/html' : html,
    'text/css' : css
};


function get_parser(content_type) {
    return parse_mapping[content_type];
}


function html(option,data) {
    return data.replace(/(action|href|src)\s*=\s*['"]?([^'"]{1,1000})['"]?/mg,
                (match,p1,p2) => {
                    // var replaced_url = p2;
                    // if (!/^\s*https?/.test(replaced_url)) {
                    //     replaced_url = replaced_url.replace(/^\s*(\.\/)?/,() => {
                    //         // prepend '/' if missing
                    //         return '/';
                    //     });

                    //     replaced_url = `${option.proxied_host}${replaced_url}`;
                    //     logger.debug('%s replaced to %s',p2,replaced_url);
                    // }
                    var new_url = common.proxyUrl(option,p2);
                    return `${p1}=${new_url} `;
                });

}

function css(option,data) {
    return data.replace(/\burl\s*\(\s*[\\\'"]?([^\\\'"\)]+)[\\\'"]?\s*\)/img,
        (match,p1) => {
            if (p1.length < 200) {
                logger.debug('css: replace url() ' + p1);
            }

            var new_url = common.proxyUrl(option,p1);
            return `url(${new_url})`;
        })
        .replace(/@import\s*[\\\'"]([^\\\'"\(\)]+)[\\\'"]/img,
        (match,p1) => {
            logger.debug('css: replace @import ' + p1);
            var new_url = common.proxyUrl(option,p1);
            return `@import "${new_url}"`;
        })
        .replace(/\bsrc\s*=\s*([\\\'"])?([^)\\\'"]+)\1/,
        (match,p1,p2) => {
            logger.debug('css: replace src= ' + p2);
            var new_url = common.proxyUrl(option,p2);
            return `src="${new_url}"`;
        });

}

function js(option,data) {
    return data;
}

exports.get_parser = get_parser;
