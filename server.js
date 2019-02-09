'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()
var cors = require('cors');
const url = require('url');
const dns = require('dns');
var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

var Schema = mongoose.Schema;
var urlSchema = new Schema({
  _id: { type: Number, unique: true },
  original_url: String,
}, { _id: false });
var Url = mongoose.model('Url', urlSchema);

app.get('/api/shorturl/:id', (req, res) => {
  Url.findOne({ _id: req.params.id }, (err, data) => {
    if (err && err.message.indexOf('Cast to ObjectId failed') !== -1) {
      res.send("No url found");
    } else {
      if (err) console.log(err.message);
      res.redirect(data.original_url);
    }
  });
});

app.post('/api/shorturl/new', (req, res) => {
  const exp = "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})";
  var test = new RegExp(exp);
  if (req.body.url.match(test)) {
    const host = new URL(req.body.url).host;
    dns.lookup(host, (err, address) => {
      if (err) {
        res.json({ "error": "invalid URL" });
      } else {
        Url.find({}).sort({ _id: '-1' }).limit(1).exec((err, data) => {
          if (err) console.log(err.message);
          data = data[0];
          if (!data._id || data._id === 0) {
            const url = new Url({ _id: 1, original_url: req.body.url });
            url.save((err, data) => {
              res.json({ original_url: data.original_url, short_url: data._id });
            });
          } else {
            data._id = data._id + 1;
            const url = new Url({ _id: data._id, original_url: req.body.url });
            url.save((err, data) => {
              res.json({ original_url: data.original_url, short_url: data._id });
            });
          }
        });
      }
    });
  } else {
    res.json({ "error": "invalid URL" });
  }
});
// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
