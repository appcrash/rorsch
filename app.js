var process = require('process');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var go = require('./routes/go');
var browse = require('./routes/browse');
var test = require('./routes/test');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/go',go);
app.use('/browse',browse);
app.use('/test',test);
app.get('/',function(req,res){
  res.render('index',{message : 'input url'});
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error(`Not Found\n request path:\n ${req.path}`);
  err.status = 404;
  next(err);
});


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


app.set('port', (process.env.PORT || 5000));


app.listen(app.get('port'),function() {
  console.log('app started');
});