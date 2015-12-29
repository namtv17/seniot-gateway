
var express = require("express");
var Controller = require('node-pid-controller');
require('string.prototype.startswith');

module.exports = function(RED) {
	"use strict";

	var pendingresponses = new Array();
	var nodes = new Array();

	function iharmony(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name.trim();
		this.url = "/iharmony/" + this.name;

		nodes.push(this);

		this.coolto = 74;
		this.heatto = 70;
		this.temperature =72;
		
		var ctr = new Controller({
			k_p : 0.25,
			k_i : 0.5,
			k_d : 0.01,
			dt : 1
		});

		this.controller = ctr;
		this.controller.setTarget(this.coolto);

		this.goalReached = false;

		var self = this;

		setInterval(function() {
			if (!self.goalReached) {
				var output = self.temperature;
				var input = self.controller.update(output);
				self.temperature = self.temperature + input/5;
				//console.log(output + " - " + input + "    " + self.name + " controller target = " + self.controller.target);
				console.log(self.temperature + " - " + input);
				//self.temperature = self.temperature  - input;
				self.send({
					payload : {
						name : self.name,
						correction : input,
						temperature : self.temperature
					}
				});
				//applyInputToActuator(input);
				this.goalReached = (input === 0) ? true : false;
				// in the case of continuous control, you let this variable 'false'
			}
		}, 1000);
		// while (!this.goalReached) {
		//
		// setTimeout(function(){
		// //do nothing
		// }, 1000);
		// }

		this.on("input", function(msg) {
			self.lastValue = msg.payload;
		});

		this.on("close", function() {
			self.goalReached = true;
			var index = nodes.indexOf(self);
			if (index > -1) {
				nodes.splice(index, 1);
			}
		});

		if (this.url) {
			RED.httpNode.use(this.url, express.static(__dirname + '/html'));
			RED.httpNode.get(this.url + "/status/", function(req, res) {
				var url = req.originalUrl;
				var currentNode = undefined;

				for (var i in nodes) {
					if (url.startsWith(nodes[i].url)) {
						currentNode = nodes[i];
						break;
					}
				}
				if (currentNode) {
					res.end(JSON.stringify({
						heatto : currentNode.heatto,
						coolto : currentNode.coolto,
						temperature : currentNode.temperature
					}));
				} else {
					res.end(JSON.stringify({
						error : "iharmony node not found " + url
					}));
				}
			});

			RED.httpNode.get(this.url + "/adjusttmp/", function(req, res) {
				var url = req.originalUrl;
				var currentNode = undefined;

				for (var i in nodes) {
					if (url.startsWith(nodes[i].url)) {
						currentNode = nodes[i];
						break;
					}
				}

				if (currentNode) {
					if (req.query.ctr == "cooler") {
						var currentTemp = currentNode.coolto;
						if (req.query.cmd == "up") {
							currentTemp = currentTemp + 1;
						} else if (req.query.cmd == "down") {
							currentTemp = currentTemp - 1;
						} else {
							res.end(JSON.stringify({
								error : "Invalid command"
							}));
						}
						currentNode.coolto = currentTemp;
						currentNode.controller.setTarget(currentNode.coolto);
					} else if (req.query.ctr == "heater") {
						var currentTemp = currentNode.heatto;
						if (req.query.cmd == "up") {
							currentTemp = currentTemp + 1;
						} else if (req.query.cmd == "down") {
							currentTemp = currentTemp - 1;
						} else {
							res.end(JSON.stringify({
								error : "Invalid command"
							}));
						}
						currentNode.heatto = currentTemp;
						currentNode.controller.setTarget(currentNode.heatto);
					} else {
						res.end(JSON.stringify({
							error : "Controller not found: " + req.query.ctr
						}));
					}

					res.end(JSON.stringify({
						coolto : currentNode.coolto,
						heatto : currentNode.heatto
					}));
				} else {
					res.end(JSON.stringify({
						error : "iharmony node not found " + url
					}));
				}
			});
		} else {
			this.error("iharmony in is not configured");
		}

	}


	RED.nodes.registerType("iharmony", iharmony);
};
