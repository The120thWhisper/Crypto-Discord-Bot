const Discord = require("discord.js");
const client = new Discord.Client();
const logger = require("winston");
const config = require("./config.json");
const getJSON = require('get-json');
const fs = require("fs");
const gm = require("gm");
const PNG = require('png-js');
const path = require('path');
const getColors = require('get-image-colors');
const blockcypher = require('blockcypher');
const request = require('request');

var coinMarketCapApiCall = [];
var origTime = (new Date).getTime();
var BTCData = [];
var DashData = [];
var LTCData = [];
var tempData = [];
var tempTopData = [];
var tempBlockData = [];
var tempGlobalEmbed = [];
var prevBlockProper = "";

function sleep (time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

var coinColors = [];

function numberWithCommas(x) {
	if (x === null || x.length == 0) {
		return "Null";
	}
	var parts = x.split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}

function grabColors (coinArray) {
	for (var i = 0; i < coinArray.length; i++) {
		var fileName = "/coins/" + coinArray[i] + ".png";
		setCoinColorValue(fileName, coinArray[i]);
	}
}

function distanceColorComp(x, y) {
	var z = ((Math.max(x,y) - Math.min(x,y)) < 20);
	return z;
}

function padColorHex(c) {
	if (color.length < 2) {
		return "0" + c;
	}
	else {
		return c;
	}
}

function convertMonths(x) {
	var tempTime = x;
	var y = tempTime.split("-").join("T").split("T").join(":").split(":")[0];
	var m = tempTime.split("-").join("T").split("T").join(":").split(":")[1];
	var d = tempTime.split("-").join("T").split("T").join(":").split(":")[2];
	var h = tempTime.split("-").join("T").split("T").join(":").split(":")[3];
	var min = tempTime.split("-").join("T").split("T").join(":").split(":")[4];
	switch (m) {
		case "01":
			m = "January";
			break;
		case "02":
			m = "February";
			break;
		case "03":
			m = "March";
			break;
		case "04":
			m = "April";
			break;
		case "05":
			m = "May";
			break;
		case "06":
			m = "June";
			break;
		case "07":
			m = "July";
			break;
		case "08":
			m = "August";
			break;
		case "09":
			m = "September";
			break;
		case "10":
			m = "October";
			break;
		case "11":
			m = "November";
			break;
		case "12":
			m = "December";
			break;
	}
	tempTime = m + " " + d + ", " + y + " at " + d + ":" + min + " UTC";
	return tempTime;
}

function getData(x, coin, message) {
	var y = x;
	var urlLoc = JSON.parse(x).latest_url + "?limit=5";
	var dataColor = 0;
	switch (coin) {
		case "Bitcoin":
			dataColor = 16424497;
			break;
		case "Litecoin":
			dataColor = 8684676;
			break;
		case "Dash":
			dataColor = 292020;
			break;
	}
	request(urlLoc, function(err, response, body) {
		tempBlockData = body;
		var blockHashLinkString = "[" + JSON.parse(x).hash + "](https://live.blockcypher.com/" + (JSON.parse(x).name).split(".")[0].toLowerCase() + "/block/" + JSON.parse(x).hash  + "/)";
		var prevBlockHashString = "[" + JSON.parse(x).previous_hash + "](https://live.blockcypher.com/" + (JSON.parse(x).name).split(".")[0].toLowerCase() + "/block/" + JSON.parse(x).previous_hash + "/)";
		message.channel.send({
			"embed": {
				"color": dataColor,
				"author":
				{
					"name": coin + " ",
					"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/" + coin.toLowerCase() + ".png"
				},
				"description": "Current blockchain status for " + coin,
				"fields":
				[
					{
						"name": "Height",
						"value": numberWithCommas((JSON.parse(x).height).toString())
					},
					{
						"name": "Block Hash",
						"value": blockHashLinkString
					},
					{
						"name": "Previous Block Hash",
						"value": prevBlockHashString
					},
					{
						"name": "Merkle Root",
						"value": JSON.parse(tempBlockData).mrkl_root
					},
					{
						"name": "Number of Transactions",
						"value": numberWithCommas((JSON.parse(tempBlockData).n_tx).toString()),
						"inline": true
					},
					{
						"name": "Block Size",
						"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
						"inline": true
					},
					{
						"name": "Total Transacted",
						"value": "\₿" + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toString()),
						"inline": true
					},
					{
						"name": "Total Fees",
						"value": "\₿" + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toString()),
						"inline": true
					},
					{
						"name": "Avg Fee per Byte",
						"value": (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
						"inline": true
					},
					{
						"name": "Avg Fee per Transaction",
						"value": "\₿" + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).n_tx*0.00000001).toFixed(8),
						"inline": true
					},
					{
						"name": "High Fee per KB",
						"value": "\₿" + (parseFloat(JSON.parse(x).high_fee_per_kb)*0.00000001).toFixed(8).toString(),
						"inline": true
					},
					{
						"name": "Medium Fee per KB",
						"value": "\₿" + (parseFloat(JSON.parse(x).medium_fee_per_kb)*0.00000001).toFixed(8).toString(),
						"inline": true
					},
					{
						"name": "Low Fee per KB",
						"value": "\₿" + (parseFloat(JSON.parse(x).low_fee_per_kb)*0.00000001).toFixed(8).toString(),
						"inline": true
					},
					{
						"name": "Mined on",
						"value": convertMonths(JSON.parse(x).time)
					}
				],
				"timestamp": new Date(),
				"footer": {
					"icon_url": client.user.avatarURL,
					"text": "Cryptocurrency Information Bot"
				}
				}
			});
		}
	);
};

function setCoinColorValue(name, CoinIdForArray) {
	if (!fs.existsSync(path.join(__dirname, name))) {return}
	var buffer = fs.readFileSync(path.join(__dirname, name));
	getColors(buffer, "image/png").then(colors => {
		var r = 0;
		var g = 0;
		var b = 0;
		var greySol = 1;
		var brightestColor = 0;
		var totalColorPoint = parseInt((r + g + b), 16);
		for (var j = 0; j < colors.length; j++){
			var r = colors[j]["_rgb"][0];
			var g = colors[j]["_rgb"][1];
			var b = colors[j]["_rgb"][2];
			if (Math.abs(r-b) > 20 && Math.abs(g-b) > 20 && Math.abs(r-g) > 20) {
				j = colors.length + 1;
				greySol = 0;
			}
		}
		if (greySol == 1) {
			var brightestColor = 0;
			r = colors[2]["_rgb"][0];
			g = colors[2]["_rgb"][1];
			b = colors[2]["_rgb"][2];
		}
		r = r.toString(16);
		g = g.toString(16);
		b = b.toString(16);
		if (r.length < 2) {
			r = "0" + r;
		}
		if (g.length < 2) {
			g = "0" + g;
		}
		if (b.length < 2) {
			b = "0" + b;
		}
		var totalColorPoint = parseInt((r + g + b), 16);
		var temp = [];
		temp.push(CoinIdForArray);
		temp.push(totalColorPoint);
		coinColors.push(temp);
	});
}

function CMCCallRepeat() {
	setInterval(function() {
		logger.info("Updating coin market cap info");
		getJSON("https://api.coinmarketcap.com/v1/ticker/?limit=2000&convert=USD", function(error, response) {
			while (coinMarketCapApiCall.length > 0) {
				coinMarketCapApiCall.shift();
			}
			for (var i = 0; i < response.length; i++) {
				coinMarketCapApiCall.push(JSON.stringify(response[i]));
			}
		});
	}, 300000);
}

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
	colorize: true
});
logger.level = 'debug';

client.on("ready", () => {
	logger.info("I am Ready!");
	client.user.setActivity(`Hodling my alts`);
	logger.info('Ready to serve on ' + client.guilds.size + ' servers, for ' + (client.users.size-2).toString() + ' users.');
	client.guilds.forEach((item, index) => {
		let channelTemp = item.channels.find('name', 'bot-commands');
		if ( channelTemp ) {
			channelTemp.fetchMessages()
			.then(function(list){
				channelTemp.bulkDelete(list);
				channelTemp.send("\`\`\`asciidoc\n= Back Online And Ready To Go! =\n= Can accept any Coin name or symbol on CoinMarketCap = \n= Just put !\{coinName\/Symbol\} = \n= Such as !VTC or !Monero =\`\`\`");
			});
		}
	});
	getJSON("https://api.coinmarketcap.com/v1/ticker/?limit=2000&convert=USD", function(error, response) {
		for (var i = 0; i < response.length; i++) {
			coinMarketCapApiCall.push(JSON.stringify(response[i]));
		}
		coinData = [];
		for (var i = 0; i < coinMarketCapApiCall.length; i++) {
			coinData.push(JSON.parse(coinMarketCapApiCall[i]).id);
		}
		grabColors(coinData);
	});
	CMCCallRepeat();
});

client.on("message", (message) => {
	logger.info(message.author.username + ": " + message.content);
	if (!message.content.startsWith(config.prefix) || !message.content.startsWith(config.prefixB) || !message.content.startsWith(config.prefixL) || !message.content.startsWith(config.prefixD)) {
		if (message.author.bot)
		{
			return;
		}
	}

	if (message.content.startsWith(config.prefixB) && message.member.hasPermission("MANAGE_MESSAGES")) {
		var args = message.content.slice(config.prefixB.length).trim().split(/ +/g);
		var command = args.shift().toLowerCase();
		try {
			switch (command) {
				case "summary" :
					request("https://api.blockcypher.com/v1/btc/main", function(err, response, body) {
						tempData = body;
						getData(tempData, "Bitcoin", message);
					});
					break;
				case "block" :
					if (args[0] !== null && args.length > 0) {
						request(("https://api.blockcypher.com/v1/btc/main/blocks/" + args[0]), function(err, response, body) {
							if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
								logger.error(err);
								message.channel.send("Could not find a Bitcoin block with that hash, or height.")
								return;
							}
							tempBlockData = body;
							message.channel.send({
								"embed": {
									"color": 16424497,
									"author":
									{
										"name": "Bitcoin ",
										"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/bitcoin.png"
									},
									"description": "Bitcoin block data for [block #" + numberWithCommas(JSON.parse(tempBlockData).height.toString()) + "](https://live.blockcypher.com/btc/block/" + JSON.parse(tempBlockData).height + ")",
									"fields":
									[
										{
											"name": "Height",
											"value": numberWithCommas((JSON.parse(body).height).toString())
										},
										{
											"name": "Block Hash",
											"value": JSON.parse(tempBlockData).hash
										},
										{
											"name": "Merkle Root",
											"value": JSON.parse(tempBlockData).mrkl_root
										},
										{
											"name": "Number of Transactions",
											"value": numberWithCommas((JSON.parse(tempBlockData).n_tx).toString()),
											"inline": true
										},
										{
											"name": "Block Size",
											"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
											"inline": true
										},
										{
											"name": "Total Transacted",
											"value": "\₿" + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
											"inline": true
										},
										{
											"name": "Total Fees",
											"value": "\₿" + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
											"inline": true
										},
										{
											"name": "Avg Fee per Byte",
											"value": (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
											"inline": true
										},
										{
											"name": "Avg Fee per Transaction",
											"value": "\₿" + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).n_tx*0.00000001).toFixed(8),
											"inline": true
										},
										{
											"name": "Mined on",
											"value": convertMonths(JSON.parse(tempBlockData).time)
										},
										{
											"name": "Depth",
											"value": numberWithCommas((JSON.parse(body).depth).toString()),
											"inline": true
										}
									],
									"timestamp": new Date(),
									"footer": {
										"icon_url": client.user.avatarURL,
										"text": "Cryptocurrency Information Bot"
									}
									}
								});
						});
					}
					break;
				case "tx" :
					if (args[0] !== null && args.length > 0) {
						request(("https://api.blockcypher.com/v1/btc/main/txs/" + args[0]), function(err, response, body) {
							if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
								logger.error(err);
								message.channel.send("Could not find a Transaction with that identifier.")
								return;
							}
							tempBlockData = body;
							if (JSON.parse(body).confirmations == 0) {
								message.channel.send({
									"embed": {
										"color": 16424497,
										"author":
										{
											"name": "Bitcoin ",
											"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/bitcoin.png"
										},
										"description": "Transaction data for transaction [" + JSON.parse(tempBlockData).hash + "](https://live.blockcypher.com/btc/tx/" + JSON.parse(tempBlockData).hash + ")",
										"fields":
										[
											{
												"name": "Block Height",
												"value": numberWithCommas((JSON.parse(body).block_height).toString()),
												"inline": true
											},
											{
												"name": "Block Position",
												"value": numberWithCommas((JSON.parse(body).block_index).toString()),
												"inline": true
											},
											{
												"name": "TxID",
												"value": args[0].toUpperCase()
											},
											{
												"name": "Number of Inputs",
												"value": numberWithCommas((JSON.parse(tempBlockData).vin_sz).toString()),
												"inline": true
											},
											{
												"name": "Number of Outputs",
												"value": numberWithCommas((JSON.parse(tempBlockData).vout_sz).toString()),
												"inline": true
											},
											{
												"name": "Tx Size",
												"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
												"inline": true
											},
											{
												"name": "Total Exchanged",
												"value": "\₿" + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
												"inline": true
											},
											{
												"name": "Miner Fee",
												"value": "\₿" + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
												"inline": true
											},
											{
												"name": "Avg Fee per Byte",
												"value": "\₿" + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
												"inline": true
											},
											{
												"name": "Sent",
												"value": convertMonths(JSON.parse(tempBlockData).received)
											},
										],
										"timestamp": new Date(),
										"footer": {
											"icon_url": client.user.avatarURL,
											"text": "Cryptocurrency Information Bot"
										}
										}
									});
							}
							else {
								message.channel.send({
									"embed": {
										"color": 16424497,
										"author":
										{
											"name": "Bitcoin ",
											"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/bitcoin.png"
										},
										"description": "Transaction data for transaction [" + JSON.parse(tempBlockData).hash + "](https://live.blockcypher.com/btc/tx/" + JSON.parse(tempBlockData).hash + ")",
										"fields":
										[
											{
												"name": "Block Height",
												"value": numberWithCommas((JSON.parse(body).block_height).toString()),
												"inline": true
											},
											{
												"name": "Block Position",
												"value": numberWithCommas((JSON.parse(body).block_index).toString()),
												"inline": true
											},
											{
												"name": "TxID",
												"value": args[0].toUpperCase()
											},
											{
												"name": "Number of Inputs",
												"value": numberWithCommas((JSON.parse(tempBlockData).vin_sz).toString()),
												"inline": true
											},
											{
												"name": "Number of Outputs",
												"value": numberWithCommas((JSON.parse(tempBlockData).vout_sz).toString()),
												"inline": true
											},
											{
												"name": "Tx Size",
												"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
												"inline": true
											},
											{
												"name": "Total Exchanged",
												"value": "\₿" + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
												"inline": true
											},
											{
												"name": "Miner Fee",
												"value": "\₿" + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
												"inline": true
											},
											{
												"name": "Avg Fee per Byte",
												"value": "\₿" + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
												"inline": true
											},
											{
												"name": "Confirmed on",
												"value": convertMonths(JSON.parse(tempBlockData).confirmed)
											},
										],
										"timestamp": new Date(),
										"footer": {
											"icon_url": client.user.avatarURL,
											"text": "Cryptocurrency Information Bot"
										}
										}
									});
								}
						});
					}
					break;
				case "address" :
				if (args[0] !== null && args.length > 0) {
					request(("https://api.blockcypher.com/v1/btc/main/addrs/" + args[0]), function(err, response, body) {
						if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
							logger.error(err);
							message.channel.send("Could not find a Transaction with that identifier.")
							return;
						}
						tempBlockData = body;
						message.channel.send({
							"embed": {
								"color": 16424497,
								"author":
								{
									"name": "Bitcoin ",
									"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/bitcoin.png"
								},
								"description": "Information about the Bitcoin address [" + JSON.parse(tempBlockData).address + "](https://live.blockcypher.com/btc/address/" + JSON.parse(tempBlockData).address + ")",
								"fields":
								[
									{
										"name": "Confirmed Transaction Count",
										"value": numberWithCommas((JSON.parse(body).n_tx).toString()),
										"inline": true
									},
									{
										"name": "Unconfirmed Transaction Count",
										"value": numberWithCommas((JSON.parse(body).unconfirmed_n_tx).toString()),
										"inline": true
									},
									{
										"name": "Final Transaction Count",
										"value": numberWithCommas((JSON.parse(body).final_n_tx).toString()),
										"inline": true
									},
									{
										"name": "Total Received",
										"value": "\₿" + numberWithCommas((JSON.parse(body).total_received*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Total Sent",
										"value": "\₿" + numberWithCommas((JSON.parse(body).total_sent*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Confirmed Balance",
										"value": "\₿" + numberWithCommas((JSON.parse(body).balance*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Unconfirmed Balance",
										"value": "\₿" + numberWithCommas((JSON.parse(body).unconfirmed_balance*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Final Balance",
										"value": "\₿" + numberWithCommas((JSON.parse(body).final_balance*0.00000001).toFixed(8)),
										"inline": true
									}
								],
								"timestamp": new Date(),
								"footer": {
									"icon_url": client.user.avatarURL,
									"text": "Cryptocurrency Information Bot"
								}
								}
							});
					});
				}
				break;
			}
		} catch(e) {
		logger.error(e);
	}
	}
	else if (message.content.startsWith(config.prefixL) && message.member.hasPermission("MANAGE_MESSAGES")) {
		var args = message.content.slice(config.prefixL.length).trim().split(/ +/g);
		var command = args.shift().toLowerCase();
		try {
		switch (command) {
			case "summary" :
				request("https://api.blockcypher.com/v1/ltc/main", function(err, response, body) {
					tempData = body;
					getData(tempData, "Litecoin", message);
				});
				break;
			case "block" :
				if (args[0] != null && args.length > 0) {
					request(("https://api.blockcypher.com/v1/ltc/main/blocks/" + args[0]), function(err, response, body) {
						if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
							logger.info(err);
							message.channel.send("Could not find a Litecoin block with that hash, or height.");
							return;
						}
						tempBlockData = body;
						message.channel.send({
							"embed": {
								"color": 8684676,
								"author":
								{
									"name": "Litecoin ",
									"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/litecoin.png"
								},
								"description": "Litecoin block data for [block #" + numberWithCommas(JSON.parse(tempBlockData).height.toString()) + "](https://live.blockcypher.com/ltc/block/" + JSON.parse(tempBlockData).height + ")",
								"fields":
								[
									{
										"name": "Height",
										"value": numberWithCommas((JSON.parse(body).height).toString())
									},
									{
										"name": "Block Hash",
										"value": JSON.parse(tempBlockData).hash
									},
									{
										"name": "Merkle Root",
										"value": JSON.parse(tempBlockData).mrkl_root
									},
									{
										"name": "Number of Transactions",
										"value": numberWithCommas((JSON.parse(tempBlockData).n_tx).toString()),
										"inline": true
									},
									{
										"name": "Block Size",
										"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
										"inline": true
									},
									{
										"name": "Total Transacted",
										"value": "\Ł" + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Total Fees",
										"value": "\Ł" + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Avg Fee per Byte",
										"value": (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
										"inline": true
									},
									{
										"name": "Avg Fee per Transaction",
										"value": "\Ł" + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).n_tx*0.00000001).toFixed(8),
										"inline": true
									},
									{
										"name": "Mined on",
										"value": convertMonths(JSON.parse(tempBlockData).time)
									},
									{
										"name": "Depth",
										"value": numberWithCommas((JSON.parse(body).depth).toString()),
										"inline": true
									}
								],
								"timestamp": new Date(),
								"footer": {
									"icon_url": client.user.avatarURL,
									"text": "Cryptocurrency Information Bot"
								}
								}
							});
					});
				}
				break;
			case "tx" :
				if (args[0] !== null && args.length > 0) {
					request(("https://api.blockcypher.com/v1/ltc/main/txs/" + args[0]), function(err, response, body) {
						if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
							logger.error(err);
							message.channel.send("Could not find a Transaction with that identifier.")
							return;
						}
						tempBlockData = body;
						if (JSON.parse(body).confirmations == 0)
						{
							message.channel.send({
								"embed": {
									"color": 8684676,
									"author":
									{
										"name": "Litecoin ",
										"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/litecoin.png"
									},
									"description": "Transaction data for transaction [" + JSON.parse(tempBlockData).hash + "](https://live.blockcypher.com/ltc/tx/" + JSON.parse(tempBlockData).hash + ")",
									"fields":
									[
										{
											"name": "Block Height",
											"value": numberWithCommas((JSON.parse(body).block_height).toString()),
											"inline": true
										},
										{
											"name": "Block Position",
											"value": numberWithCommas((JSON.parse(body).block_index).toString()),
											"inline": true
										},
										{
											"name": "TxID",
											"value": args[0].toUpperCase()
										},
										{
											"name": "Number of Inputs",
											"value": numberWithCommas((JSON.parse(tempBlockData).vin_sz).toString()),
											"inline": true
										},
										{
											"name": "Number of Outputs",
											"value": numberWithCommas((JSON.parse(tempBlockData).vout_sz).toString()),
											"inline": true
										},
										{
											"name": "Tx Size",
											"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
											"inline": true
										},
										{
											"name": "Total Exchanged",
											"value": "\Ł" + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
											"inline": true
										},
										{
											"name": "Miner Fee",
											"value": "\Ł" + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
											"inline": true
										},
										{
											"name": "Avg Fee per Byte",
											"value": "\Ł" + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
											"inline": true
										},
										{
											"name": "Sent",
											"value": convertMonths(JSON.parse(tempBlockData).received)
										},
									],
									"timestamp": new Date(),
									"footer": {
										"icon_url": client.user.avatarURL,
										"text": "Cryptocurrency Information Bot"
									}
									}
								});
							}
							else {
								message.channel.send({
									"embed": {
										"color": 8684676,
										"author":
										{
											"name": "Litecoin ",
											"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/litecoin.png"
										},
										"description": "Transaction data for transaction [" + JSON.parse(tempBlockData).hash + "](https://live.blockcypher.com/ltc/tx/" + JSON.parse(tempBlockData).hash + ")",
										"fields":
										[
											{
												"name": "Block Height",
												"value": numberWithCommas((JSON.parse(body).block_height).toString()),
												"inline": true
											},
											{
												"name": "Block Position",
												"value": numberWithCommas((JSON.parse(body).block_index).toString()),
												"inline": true
											},
											{
												"name": "TxID",
												"value": args[0].toUpperCase()
											},
											{
												"name": "Number of Inputs",
												"value": numberWithCommas((JSON.parse(tempBlockData).vin_sz).toString()),
												"inline": true
											},
											{
												"name": "Number of Outputs",
												"value": numberWithCommas((JSON.parse(tempBlockData).vout_sz).toString()),
												"inline": true
											},
											{
												"name": "Tx Size",
												"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
												"inline": true
											},
											{
												"name": "Total Exchanged",
												"value": "\Ł" + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
												"inline": true
											},
											{
												"name": "Miner Fee",
												"value": "\Ł" + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
												"inline": true
											},
											{
												"name": "Avg Fee per Byte",
												"value": "\Ł" + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
												"inline": true
											},
											{
												"name": "Confirmed on",
												"value": convertMonths(JSON.parse(tempBlockData).confirmed)
											},
										],
										"timestamp": new Date(),
										"footer": {
											"icon_url": client.user.avatarURL,
											"text": "Cryptocurrency Information Bot"
										}
										}
									});
								}
					});
				}
				break;
			case "address" :
				if (args[0] !== null && args.length > 0) {
					request(("https://api.blockcypher.com/v1/ltc/main/addrs/" + args[0]), function(err, response, body) {
						if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
							logger.error(err);
							message.channel.send("Could not find a Transaction with that identifier.")
							return;
						}
						tempBlockData = body;
						message.channel.send({
							"embed": {
								"color": 8684676,
								"author":
								{
									"name": "Litcoin ",
									"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/litecoin.png"
								},
								"description": "Information about the Litcoin address [" + JSON.parse(tempBlockData).address + "](https://live.blockcypher.com/ltc/address/" + JSON.parse(tempBlockData).address + ")",
								"fields":
								[
									{
										"name": "Confirmed Transaction Count",
										"value": numberWithCommas((JSON.parse(body).n_tx).toString()),
										"inline": true
									},
									{
										"name": "Unconfirmed Transaction Count",
										"value": numberWithCommas((JSON.parse(body).unconfirmed_n_tx).toString()),
										"inline": true
									},
									{
										"name": "Final Transaction Count",
										"value": numberWithCommas((JSON.parse(body).final_n_tx).toString()),
										"inline": true
									},
									{
										"name": "Total Received",
										"value": "\Ł" + numberWithCommas((JSON.parse(body).total_received*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Total Sent",
										"value": "\Ł" + numberWithCommas((JSON.parse(body).total_sent*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Confirmed Balance",
										"value": "\Ł" + numberWithCommas((JSON.parse(body).balance*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Unconfirmed Balance",
										"value": "\Ł" + numberWithCommas((JSON.parse(body).unconfirmed_balance*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Final Balance",
										"value": "\Ł" + numberWithCommas((JSON.parse(body).final_balance*0.00000001).toFixed(8)),
										"inline": true
									}
								],
								"timestamp": new Date(),
								"footer": {
									"icon_url": client.user.avatarURL,
									"text": "Cryptocurrency Information Bot"
								}
								}
							});
					});
				}
				break;
		}
	} catch(e) {
		logger.error(e);
	}
	}
	else if (message.content.startsWith(config.prefixD) && message.member.hasPermission("MANAGE_MESSAGES")) {
		var args = message.content.slice(config.prefixD.length).trim().split(/ +/g);
		var command = args.shift().toLowerCase();
		try {
		switch (command) {
			case "summary" :
				request("https://api.blockcypher.com/v1/dash/main", function(err, response, body) {
					tempData = body;
					getData(tempData, "Dash", message);
				});
				break;
			case "block" :
				if (args[0] !== null && args.length > 0) {
					request(("https://api.blockcypher.com/v1/dash/main/blocks/" + args[0]), function(err, response, body) {
						if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
							logger.error(err);
							message.channel.send("Could not find a Dash block with that hash, or height.")
							return;
						}
						tempBlockData = body;
						message.channel.send({
							"embed": {
								"color": 292020,
								"author":
								{
									"name": "Dash ",
									"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/dash.png"
								},
								"description": "Dash block data for [block #" + numberWithCommas(JSON.parse(tempBlockData).height.toString()) + "](https://live.blockcypher.com/dash/block/" + JSON.parse(tempBlockData).height + ")",
								"fields":
								[
									{
										"name": "Height",
										"value": numberWithCommas((JSON.parse(body).height).toString())
									},
									{
										"name": "Block Hash",
										"value": JSON.parse(tempBlockData).hash
									},
									{
										"name": "Merkle Root",
										"value": JSON.parse(tempBlockData).mrkl_root
									},
									{
										"name": "Number of Transactions",
										"value": numberWithCommas((JSON.parse(tempBlockData).n_tx).toString()),
										"inline": true
									},
									{
										"name": "Block Size",
										"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
										"inline": true
									},
									{
										"name": "Total Transacted",
										"value": "DASH " + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Total Fees",
										"value": "DASH " + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Avg Fee per Byte",
										"value": (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
										"inline": true
									},
									{
										"name": "Avg Fee per Transaction",
										"value": "DASH " + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).n_tx*0.00000001).toFixed(8),
										"inline": true
									},
									{
										"name": "Mined on",
										"value": convertMonths(JSON.parse(tempBlockData).time)
									},
									{
										"name": "Depth",
										"value": numberWithCommas((JSON.parse(body).depth).toString()),
										"inline": true
									}
								],
								"timestamp": new Date(),
								"footer": {
									"icon_url": client.user.avatarURL,
									"text": "Cryptocurrency Information Bot"
								}
								}
							});
					});
				}
				break;
			case "tx" :
				if (args[0] !== null && args.length > 0) {
					request(("https://api.blockcypher.com/v1/dash/main/txs/" + args[0]), function(err, response, body) {
						if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
							logger.error(err);
							message.channel.send("Could not find a Transaction with that identifier.")
							return;
						}
						tempBlockData = body;
						if (JSON.parse(body).confirmations == 0)
						{
							message.channel.send({
								"embed": {
									"color": 292020,
									"author":
									{
										"name": "Dash ",
										"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/dash.png"
									},
									"description": "Transaction data for transaction [" + JSON.parse(tempBlockData).hash + "](https://live.blockcypher.com/dash/tx/" + JSON.parse(tempBlockData).hash + ")",
									"fields":
									[
										{
											"name": "Block Height",
											"value": numberWithCommas((JSON.parse(body).block_height).toString()),
											"inline": true
										},
										{
											"name": "Block Position",
											"value": numberWithCommas((JSON.parse(body).block_index).toString()),
											"inline": true
										},
										{
											"name": "TxID",
											"value": args[0].toUpperCase()
										},
										{
											"name": "Number of Inputs",
											"value": numberWithCommas((JSON.parse(tempBlockData).vin_sz).toString()),
											"inline": true
										},
										{
											"name": "Number of Outputs",
											"value": numberWithCommas((JSON.parse(tempBlockData).vout_sz).toString()),
											"inline": true
										},
										{
											"name": "Tx Size",
											"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
											"inline": true
										},
										{
											"name": "Total Exchanged",
											"value": "DASH " + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
											"inline": true
										},
										{
											"name": "Miner Fee",
											"value": "DASH " + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
											"inline": true
										},
										{
											"name": "Avg Fee per Byte",
											"value": "DASH " + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
											"inline": true
										},
										{
											"name": "Sent",
											"value": convertMonths(JSON.parse(tempBlockData).received)
										},
									],
									"timestamp": new Date(),
									"footer": {
										"icon_url": client.user.avatarURL,
										"text": "Cryptocurrency Information Bot"
									}
								}
							});
						}
						else {
							message.channel.send({
								"embed": {
									"color": 292020,
									"author":
									{
										"name": "Dash ",
										"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/dash.png"
									},
									"description": "Transaction data for transaction [" + JSON.parse(tempBlockData).hash + "](https://live.blockcypher.com/dash/tx/" + JSON.parse(tempBlockData).hash + ")",
									"fields":
									[
										{
											"name": "Block Height",
											"value": numberWithCommas((JSON.parse(body).block_height).toString()),
											"inline": true
										},
										{
											"name": "Block Position",
											"value": numberWithCommas((JSON.parse(body).block_index).toString()),
											"inline": true
										},
										{
											"name": "TxID",
											"value": args[0].toUpperCase()
										},
										{
											"name": "Number of Inputs",
											"value": numberWithCommas((JSON.parse(tempBlockData).vin_sz).toString()),
											"inline": true
										},
										{
											"name": "Number of Outputs",
											"value": numberWithCommas((JSON.parse(tempBlockData).vout_sz).toString()),
											"inline": true
										},
										{
											"name": "Tx Size",
											"value": numberWithCommas((JSON.parse(tempBlockData).size).toString()) + " Bytes",
											"inline": true
										},
										{
											"name": "Total Exchanged",
											"value": "DASH " + numberWithCommas(((JSON.parse(tempBlockData).total)*0.00000001).toFixed(8)),
											"inline": true
										},
										{
											"name": "Miner Fee",
											"value": "DASH " + numberWithCommas(((JSON.parse(tempBlockData).fees)*0.00000001).toFixed(8)),
											"inline": true
										},
										{
											"name": "Avg Fee per Byte",
											"value": "DASH " + (JSON.parse(tempBlockData).fees/JSON.parse(tempBlockData).size).toFixed(2) + " s/B",
											"inline": true
										},
										{
											"name": "Confirmed on",
											"value": convertMonths(JSON.parse(tempBlockData).confirmed)
										},
									],
									"timestamp": new Date(),
									"footer": {
										"icon_url": client.user.avatarURL,
										"text": "Cryptocurrency Information Bot"
									}
									}
								});
						}
					});
				}
				break;
			case "address" :
				if (args[0] !== null && args.length > 0) {
					request(("https://api.blockcypher.com/v1/dash/main/addrs/" + args[0]), function(err, response, body) {
						if (err || body.indexOf("Endpoint") != -1 || body.indexOf("error") != -1) {
							logger.error(err);
							message.channel.send("Could not find a Transaction with that identifier.")
							return;
						}
						tempBlockData = body;
						message.channel.send({
							"embed": {
								"color": 292020,
								"author":
								{
									"name": "Dash ",
									"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/dash.png"
								},
								"description": "Information about the Dash address [" + JSON.parse(tempBlockData).address + "](https://live.blockcypher.com/dash/address/" + JSON.parse(tempBlockData).address + ")",
								"fields":
								[
									{
										"name": "Confirmed Transaction Count",
										"value": numberWithCommas((JSON.parse(body).n_tx).toString()),
										"inline": true
									},
									{
										"name": "Unconfirmed Transaction Count",
										"value": numberWithCommas((JSON.parse(body).unconfirmed_n_tx).toString()),
										"inline": true
									},
									{
										"name": "Final Transaction Count",
										"value": numberWithCommas((JSON.parse(body).final_n_tx).toString()),
										"inline": true
									},
									{
										"name": "Total Received",
										"value": "DASH " + numberWithCommas((JSON.parse(body).total_received*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Total Sent",
										"value": "DASH " + numberWithCommas((JSON.parse(body).total_sent*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Confirmed Balance",
										"value": "DASH " + numberWithCommas((JSON.parse(body).balance*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Unconfirmed Balance",
										"value": "DASH " + numberWithCommas((JSON.parse(body).unconfirmed_balance*0.00000001).toFixed(8)),
										"inline": true
									},
									{
										"name": "Final Balance",
										"value": "DASH " + numberWithCommas((JSON.parse(body).final_balance*0.00000001).toFixed(8)),
										"inline": true
									}
								],
								"timestamp": new Date(),
								"footer": {
									"icon_url": client.user.avatarURL,
									"text": "Cryptocurrency Information Bot"
								}
								}
							});
					});
				}
				break;
			}
		} catch(e) {
			logger.info(e);
		}
	}
	else if (message.content.startsWith(config.prefix)) {
		var args = message.content.slice(config.prefix.length).trim().split(/ +/g);
		var command = args.shift().toLowerCase();
		switch (command) {
			case "help" :
				message.channel.send("\`\`\`diff\n- !{coin name}\n--- !bitcoin\n+ Returns market information for the coin with this one word name\n- !{coin id} (multiple word name separated by -)\n--- !bitcoin-gold\n+ Returns market information for the coin with this multiple word name\n- !{coin number}\n--- !21\n+ Returns market information for the coin with rank when sorted by total market cap value\n- !{coin symbol}\n--- !xrp\n+ Returns market information for any coins with matching trade symbols\n- {btc/ltc/dash}.summary\n+ Returns current blockchain information about the Bitcoin/Litecoin/Dash blockchain\n- {btc/ltc/dash}.address {coin address}\n+ Returns information about the inserted cryptocurrency address\n--- btc.address 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n- {btc/ltc/dash}.block {block# or hash}\n+ Returns information about a specific block when provided it's height on the blockchain or it's hash value\n--- ltc.block 90210\n- {btc/ltc/dash}.tx {TxID}\n+ Returns information about a specific transaction as specified by the transaction Identifier hash value\n--- dash.tx 121adc902f595242c6125851e238a3879cd79412824b4c34f3b9b65544272b77\`\`\`");
				break;
			case "purge" :
				if(message.author.id !== config.ownerID) {
					message.delete();
					message.channel.send("You do not have the permissions required for this command.");
					return;
				}
				if (message.member.hasPermission("MANAGE_MESSAGES")) {
					message.channel.fetchMessages()
					.then(function(list){
						message.channel.bulkDelete(list);
					}, function(err){logger.error("ERROR: ERROR CLEARING CHANNEL.")});
					message.channel.send("\`\`\`asciidoc\n= Back Online And Ready To Go! =\n= Can accept any Coin name or symbol on CoinMarketCap = \n= Just put !\{coinName\/Symbol\} = \n= Such as !VTC or !Monero =\`\`\`");
				}
				logger.info("yeah boi. \¯\\\_\(\ツ\)\_\/\¯ ");
				break;
			case "shutdown" :
				if(message.author.id !== config.ownerID) {
					message.delete();
					message.channel.send("You do not have the permissions required for this command.");
					return;
				}
				if (message.author.id == config.ownerID) {
					message.channel.fetchMessages()
					.then(function(list){
						message.channel.bulkDelete(list);
						message.channel.send("\`\`\`diff\n- Shutting Down...\`\`\`");
						logger.error("Shutting down on " + message.author.username + "\'s command");
						sleep(2500).then(() => {
							process.exit();
						});
					}, function(err){logger.error("ERROR: ERROR CLEARING CHANNEL.")})
				}
				break;
			default :
				var found = 0;
				// var newTime = (new Date).getTime();
				// if (newTime-origTime > 300000) {
				// 	getJSON("https://api.coinmarketcap.com/v1/ticker/?limit=2000&convert=USD", function(error, response) {
				// 		while (coinMarketCapApiCall.length > 0) {
				// 			coinMarketCapApiCall.shift();
				// 		}
				// 		for (var i = 0; i < response.length; i++) {
				// 			coinMarketCapApiCall.push(JSON.stringify(response[i]));
				// 		}
				// 	});
				// 	origTime = (new Date).getTime();
				// }
				for (var i = 0; i < coinMarketCapApiCall.length; i++) {
					var coinData = [JSON.parse(coinMarketCapApiCall[i]).name, JSON.parse(coinMarketCapApiCall[i]).id.toLowerCase(), JSON.parse(coinMarketCapApiCall[i]).rank, JSON.parse(coinMarketCapApiCall[i]).symbol.toLowerCase(), JSON.parse(coinMarketCapApiCall[i]).price_usd, JSON.parse(coinMarketCapApiCall[i]).price_btc, JSON.parse(coinMarketCapApiCall[i]).market_cap_usd, JSON.parse(coinMarketCapApiCall[i]).available_supply, JSON.parse(coinMarketCapApiCall[i]).total_supply, JSON.parse(coinMarketCapApiCall[i]).max_supply, JSON.parse(coinMarketCapApiCall[i]).percent_change_1h, JSON.parse(coinMarketCapApiCall[i]).percent_change_24h, JSON.parse(coinMarketCapApiCall[i]).percent_change_7d];
					if (coinData[0] == command || coinData[3] == command || coinData[1] == command || coinData[2] == command) {
						coinColorCalled = 0;
						for (var j = 0; j < coinColors.length; j++) {
							if (coinColors[j][0] == JSON.parse(coinMarketCapApiCall[i]).id) {
								coinColorCalled = coinColors[j][1];
								j = coinColors.length + 1;
							}
						}
						found = 1;
						var coinMarketCapLink = "[Coin Market Cap](https://coinmarketcap.com/currencies/" + JSON.parse(coinMarketCapApiCall[i]).id  + "/)";
						var lastUpdatedCMCMinutes = (Math.round((new Date).getTime()/1000) - JSON.parse(coinMarketCapApiCall[i]).last_updated)/60;
						lastUpdatedCMCMinutes = Math.floor(lastUpdatedCMCMinutes).toString() + " minutes ";
						var lastUpdatedCMCSeconds = ((Math.round((new Date).getTime()/1000) - JSON.parse(coinMarketCapApiCall[i]).last_updated)%60).toString() + " seconds ago";
						var timeLastUpdated = lastUpdatedCMCMinutes + lastUpdatedCMCSeconds;
						if (coinData[9] === null){
							message.channel.send({
								"embed": {
									"color": coinColorCalled,
									"author":
									{
										"name": "#" + coinData[2] + " " + coinData[0] + " (" + coinData[3].toUpperCase() + ")",
										"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/" + coinData[1] + ".png"
									},
									"description": "Current market information for " + coinData[0],
									"fields":
									[
										{	"name": "Price ($)",
											"value": "$" + coinData[4],
											"inline": true
										},
										{	"name": "Price (\₿)",
											"value": "\₿" + coinData[5],
											"inline": true
										},
										{	"name": "Market Cap",
											"value": "$" + numberWithCommas(coinData[6]),
											"inline": true
										},
										{	"name": "Available Supply",
											"value": numberWithCommas(coinData[7]),
											"inline": true
										},
										{	"name": "Total Supply",
											"value": numberWithCommas(coinData[8]),
											"inline": true
										},
										{	"name": "Max Supply",
											"value": "*Theoretically* Infinite",
											"inline": true
										},
										{	"name": "Percent Change 1 hour",
											"value": coinData[10] + "%",
											"inline": true
										},
										{	"name": "Percent Change 24 hour",
											"value": coinData[11] + "%",
											"inline": true
										},
										{	"name": "Percent Change 7 days",
											"value": coinData[12] + "%",
											"inline": true
										},
										{	"name": "Last Updated",
											"value": timeLastUpdated
										},
										{	"name": coinData[0] + " information",
											"value": coinMarketCapLink
										}
									],
									"timestamp": new Date(),
									"footer": {
										"icon_url": client.user.avatarURL,
										"text": "Cryptocurrency Inforamtion Bot"
									}
									}
								}
							);

						}
						else {
							message.channel.send({
								"embed": {
									"color": coinColorCalled,
									"author": {
										"name": "#" + coinData[2] + " " + coinData[0] + " (" + coinData[3].toUpperCase() + ")",
										"icon_url": "https://raw.githubusercontent.com/dziungles/cryptocurrency-logos/master/coins/64x64/" + coinData[1] + ".png"
									},
									"description": "Current market information for " + coinData[0],
									"fields":
									[
										{	"name": "Price ($)",
											"value": "$" + coinData[4],
											"inline": true
										},
										{	"name": "Price (\₿)",
											"value": "\₿" + coinData[5],
											"inline": true
										},
										{	"name": "Market Cap",
											"value": "$" + numberWithCommas(coinData[6]),
											"inline": true
										},
										{	"name": "Available Supply",
											"value": numberWithCommas(coinData[7]),
											"inline": true
										},
										{	"name": "Total Supply",
											"value": numberWithCommas(coinData[8]),
											"inline": true
										},
										{	"name": "Max Supply",
											"value": numberWithCommas(coinData[9]),
											"inline": true
										},
										{	"name": "Percent Change 1 hour",
											"value": coinData[10] + "%",
											"inline": true
										},
										{	"name": "Percent Change 24 hour",
											"value": coinData[11] + "%",
											"inline": true
										},
										{	"name": "Percent Change 7 days",
											"value": coinData[12] + "%",
											"inline": true
										},
										{	"name": "Last Updated",
											"value": timeLastUpdated
										},
										{	"name": coinData[0] + " information",
											"value": coinMarketCapLink
										}
									],
									"timestamp": new Date(),
									"footer": {
										"icon_url": client.user.avatarURL,
										"text": "Cryptocurrency Information Bot"
									}
									}
								}
							);

						}
					}
				};
				if (found == 0) {
					message.channel.send("Command not found");
				};
				break;
		};
	}
});

client.login(config.token);
