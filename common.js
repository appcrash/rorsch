var url = require('url');

exports.proxyUrl = (host,href) => {
    var encoded_href = encodeURIComponent(href);
    return url.format({
        host : host,
        protocol : 'http',
        pathname : 'process',
        search : `loc=${encoded_href}`
    });
};