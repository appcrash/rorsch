var winston = require('winston');

var debug = winston.loggers.add('debug',{
    console: {
        level: 'debug',
        colorize : true
    }
});

exports.debug = debug;