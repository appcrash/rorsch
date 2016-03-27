var url = require('url');

exports.proxyUrl = (host,href) => {
    var encoded_href = encodeURIComponent(href);
    return url.format({
        host : host,
        protocol : 'http',
        pathname : `browse/${encoded_href}`
    });
};