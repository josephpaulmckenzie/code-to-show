const serverless = require('serverless-http');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require('cors');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(fileUpload());
app.use('/public', express.static(__dirname + '/public'));


app.post('/upload', (req, res, next) => {
  console.log(req);
  let imageFile = req.files.file;
  let imageFileName = req.files.file.name;
console.log("ImageFileData",imageFile.data)
  var AWS = require('aws-sdk');
  var fs = require('fs');

  var s3 = new AWS.S3();
  var myBucket = 'transcode-videos-joseph';
  var myKey = imageFileName;

  fs.readFile(`/tmp/${imageFile}`, function (err, data) {
    if (err) {
      throw err;
    }

    params = {
      Bucket: myBucket,
      Key: myKey,
      Body: imageFile.data
    };

    s3.putObject(params, function (err, data) {

      if (err) {
        console.log(err)
      } else {
        console.log("Successfully uploaded data to myBucket/myKey");
      }
    });
  });
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// app.listen(8000, () => {
//   console.log('8000');
// });

// module.exports = app;

// Comment out for Local
module.exports.handler = serverless(app);