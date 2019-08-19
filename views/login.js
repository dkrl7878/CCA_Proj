const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const config = require('./config/config');
const tokenAbi = require('./config/erc20ABI')
const request = require('request');


// init web3
const Web3 = require('web3');
const web3 = new Web3(config.getConfig().httpEndpoint);

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let token_list = []
let address

app.use('/login', function(req, res) {
  var method = req.method;

  if (method == 'GET') {
    res.render('login');
  } else {
    let privateKey = req.param('private_key');
    address = req.param('address');
    let globalConfig = config.getConfig();
    globalConfig.privateKey = privateKey;
    globalConfig.address = address;

    res.redirect('/');
  }
});

module.exports = app;
