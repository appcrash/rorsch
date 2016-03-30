var url = require('url');
var normalizeUrl = require('normalizeurl');
var logger = require('./log').debug;


exports.proxyUrl = (option,proxy_url) => {
    var orig = proxy_url;

    if (!/^\s*https?:/.test(proxy_url)) {
        // not absolute url, convert it to absolute
        var path = option.proxied_path;
        if (path !== undefined && path.length > 1) {
            // if this is not root path
            proxy_url = `${option.proxied_host}/${option.proxied_path}/../${proxy_url}`;
        } else {
            proxy_url = `${option.proxied_host}/${proxy_url}`;
        }
    }
    proxy_url = normalizeUrl(proxy_url);

    // logger.debug('url proxied:  %s ==>  %s',orig,proxy_url);

    var encoded_url = encodeURIComponent(proxy_url);
    return url.format({
        host : option.app_host,
        protocol : 'https',  // always use https
        pathname : `browse/${encoded_url}`
    });
};


