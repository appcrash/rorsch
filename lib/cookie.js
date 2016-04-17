var logger = require('./log').debug;

// parse *set-cookie* header, return object like
// {
//   { attr1 : {value : v, domain : d, expire : e},
//   { attr2 : ... }
// }
function parse_set_cookie(cookie_str) {
    if (!cookie_str || typeof cookie_str !== 'string') {
        return {};
    }

    // some sites send set-cookie header with multiple attribute, so parse it carefully
    var obj = {};
    var current_attr = null;
    var match = /([^=;]+)=([^;]+)(?:;|$)/g;
    var pde = /\s*(path|domain|expires)\s*/i;
    var result;

    logger.debug('parse set cookie ' + cookie_str);
    while((result = match.exec(cookie_str)) !== null) {
        var key = result[1];
        var value = result[2];

        if (key === '' || value === '') {
            continue;
        }

        // logger.debug(`${key} => ${value}`);
        if (pde.test(key) === false) {
            // it is a new attribute
            obj[key] = current_attr = {
                value : value
            };
        } else {
            // append path/domain/expires  to current attribute
            if (!!current_attr) {
                current_attr[key.trim().toLowerCase()] = value;
            }
        }
    }

    return obj;
}


exports.parse_set_cookie = parse_set_cookie;
