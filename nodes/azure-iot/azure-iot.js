/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
	"use strict";
	var Device = require('azure-iot-device');
 	var Client = Device.Client;
 	var Message = Device.Message;
 	var Http = Device.Http;
 	var EventHubClient = require('./lib/eventhubclient.js');

 	var httpClient;
 	var evtHubClient;
 	
	function azureIoTHubNode(n) {
		RED.nodes.createNode(this, n);
		this.deviceName = n.name;
		this.hostName = n.hostName;
		this.sharedAccessKeyName = n.sharedAccessKeyName;
		this.deviceId = n.deviceId;
		this.deviceKey = n.deviceKey;
		this.mode = n.mode;
		
		var self = this;
		console.log(JSON.stringify(self));
		this.connect = function() {
			if (!self.device) {
				var connectionString = 'HostName='+self.hostName+';DeviceId='+self.deviceId+';SharedAccessKeyName='+self.sharedAccessKeyName+';SharedAccessKey='+self.deviceKey+'';

				if (self.mode == "http") {
					self.log("Attemp to create Azure IoT Hub http node to  " + self.deviceId);
					httpClient = new Client.fromConnectionString(connectionString);
					self.device = httpClient;
				} else if (self.mode == "amqp") {
					self.log("Attemp to create Azure IoT Hub http node to  " + self.deviceId);
				} else {
					
				}
			}
			    
		};
	}


	RED.nodes.registerType("azure-iot-device", azureIoTHubNode);

	function azureHttpNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);
		this.interval = n.interval;
		var self = this;
		
		if (this.azureIot) {
			var self = this;
			this.azureIot.connect();
			self.log('Creating EventHubClient: ' + this.azureIot.name);
			
		    var connectionString = 'HostName='+this.azureIot.hostName+';SharedAccessKeyName='+this.azureIot.sharedAccessKeyName+';SharedAccessKey='+this.azureIot.deviceKey+'';

			if (this.azureIot.mode == "http") {
				setInterval(function () {
				  httpClient.receive(function (err, msg, res) {
				    if (err) printResultFor('receive')(err, res);
				    else if (res.statusCode !== 204) {
				      console.log('Received data: ' + msg.getData());
				      self.send({
							payload : JSON.parse(msg.getData())
						});
				
				      httpClient.complete(msg, printResultFor('complete'));
				    }
				  });
				}, self.interval);
			} else if (this.azureIot.mode == "amqp") {
				
			} else {
				
			}
		} else {
			this.error("azure-iot-hub in is not configured");
		}
	}


	RED.nodes.registerType("azure-iot-hub in", azureHttpNodeIn);

	function azureHttpNodeOut(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);

		if (this.azureIot) {
			var self = this;
			this.azureIot.connect();

			var options = {
				retain : n.retain || false
			};
			self.on("input", function(msg) {
				if (!Buffer.isBuffer(msg.payload)) {
					if ( typeof msg.payload === "object") {
						msg.payload = JSON.stringify(msg.payload);
					} else if ( typeof msg.payload !== "string") {
						msg.payload = "" + msg.payload;
					}
				}
				var message = new Message(msg.payload);
				console.log("Sending message: " + message.getData());
				
				httpClient.sendEvent(message, printResultFor('send'));
			});
		} else {
			this.error("azure-iot-hub out is not configured");
		}
	}

	function printResultFor(op) {
	  return function printResult(err, res) {
	    if (err) console.log(op + ' error: ' + err.toString());
	    if (res && (res.statusCode !== 204)) console.log(op + ' status: ' + res.statusCode + ' ' + res.statusMessage);
	  };
	}
	
	RED.nodes.registerType("azure-iot-hub out", azureHttpNodeOut);
};
