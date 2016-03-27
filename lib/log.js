var winston = require('winston');

var debug = winston.loggers.add('debug',{
    console: {
        level: 'debug',
        colorize : true
    }
});

var parse_debug = winston.loggers.add('parse_debug',{
    console : {
        level : 'debug',
        colorize : true
    }
});

exports.debug = debug;
exports.parse_debug = parse_debug;
