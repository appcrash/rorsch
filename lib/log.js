var winston = require('winston');

var debug = winston.loggers.add('debug',{
    console: {
        level: 'debug',
        colorize : true
    }
});

var parse_debug = winston.loggers.add('parse_debug',{
    console : {
        level : 'info',
        colorize : true
    }
});

exports.pretty = function(str) {
    return JSON.stringify(str,null,2);
}

exports.debug = debug;
exports.parse_debug = parse_debug;
