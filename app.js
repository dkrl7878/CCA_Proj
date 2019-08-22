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
let abi = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "a",
				"type": "uint256"
			},
			{
				"name": "b",
				"type": "uint256"
			}
		],
		"name": "add",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
			
				"name": "a",
				"type": "uint256"
			},
			{
				"name": "b",
				"type": "uint256"
			}
		],
		"name": "div",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "a",
				"type": "uint256"
			},
			{
				"name": "b",
				"type": "uint256"
			}
		],
		"name": "mod",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "a",
				"type": "uint256"
			},
			{
				"name": "b",
				"type": "uint256"
			}
		],
		"name": "mul",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "a",
				"type": "uint256"
			},
			{
				"name": "b",
				"type": "uint256"
			}
		],
		"name": "sub",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]

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
let privateKey

// login
app.use('/login', function(req, res) {
  var method = req.method;

  if (method == 'GET') {
    res.render('login');
  } else {
    privateKey = req.param('private_key');
    address = req.param('address');
    let globalConfig = config.getConfig();
    globalConfig.privateKey = privateKey;
    globalConfig.address = address;

    res.redirect('/');
  }
});

// auction
app.get('/auction', function(req, res) {
    res.render('auction');
});

app.get('/upload', function(req, res) {
  res.render('upload');
});

app.get('/', function(req, res) {
  res.render('index');
});

/*
app.post('/api/setproduct', function(req, res) {
  contract = new web3.eth.Contract(abi, address);
  contract.methods.setProduct(fdfdfdf).send();
  res.render('index');
});
*/
app.post('/api/add', async function(req,res){
  var a = req.param('a');
  var b = req.param('b');
  var contractAddress = req.param('contract');
  contract = new web3.eth.Contract(abi, contractAddress);
  var result = await contract.methods.add(a, b).call();
  console.log(result);
})


app.get('/api/get_info', async function(req, res) {
  const address = config.getConfig().address;
  const result = await web3.eth.getBalance(address);
  const ether = web3.utils.fromWei(result, 'ether');
  res.json( { balance: ether, address: address});
});


app.post('/api/transfer', async function(req, res) {
  let fromAddress = config.getConfig().address;
  let privateKey = config.getConfig().privateKey;
  let contractAddress = req.param('contract');
  let toAddress = req.param('to_address');
  let amount = req.param('amount');
  let etherToWei = web3.utils.toWei(amount, 'ether');

  let rawTx = {}
  let nonce = web3.eth.getTransactionCount(fromAddress, 'pending');
  if(contractAddress) {
    let tokenContract = new web3.eth.Contract(tokenAbi, contractAddress);
    let inputData = tokenContract.methods.transfer(toAddress, amount).encodeABI();
    rawTx = {
      to: contractAddress,
      value: 0,
      gasPrice: '30000000000',
      gas: '210000',      
      data: inputData,
      nonce: nonce
    };
  } else {
    rawTx = {
      from: fromAddress,
      to: toAddress,
      value: etherToWei,
      gasPrice: '30000000000',
      gas: '21000',
      nonce: nonce
    };
  }
    
  let account = web3.eth.accounts.privateKeyToAccount(privateKey)
  let signedTx = await account.signTransaction(rawTx)

  let data = {}

  let txInfo = await web3.eth.sendSignedTransaction(signedTx.rawTransaction, (err, txHash) => {
    if (err) {
      console.log('========== transaction 발생 중 에러 ===========')
      data.result = 'fail'
      res.json(data)
      return
    }
    console.log('========== transaction 발생 ===========')
  })
  console.log('========== transaction 처리완료 ===========')
  data.result = 'success'
  data.txInfo = txInfo
  res.json(data)
})


app.get('/api/get_history', async function(req, res) {
  var my_address = config.getConfig().address;
  console.log(my_address)

  let options = {
    uri: "http://api-ropsten.etherscan.io/api",
    qs: {
      module: "account",
      action: "txlist",
      address: my_address,
      startblock: 0,
      endblock: 99999999,
      sort: "asc",
      apikey: config.getConfig().etherscan_api_key
    }
  }

  request(options, (error, response, result) => {
    if(error) {
      console.log(error);
    } else {
      res.json(JSON.parse(result))
    }
  })
})

app.get('/api/get_token', async function(req, res) {
  var data = {}
  for(var i = 0; i < token_list.length; i++) {
    console.log(token_list[i])
    var token_Contract = new web3.eth.Contract(tokenAbi, token_list[i]);
    var token_symbol = await token_Contract.methods.symbol().call();
    var token_balance = await token_Contract.methods.balanceOf(address).call();
    data[i] = {
      symbol: token_symbol,
      balance: token_balance
    }
  }
  res.json(data);
})

app.post('/api/add_token', async function(req, res) {
  var contract_Address = req.param('token_contract');
  token_list.push(contract_Address)
})


module.exports = app;


