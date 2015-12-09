/**
The MIT License (MIT)

Copyright (c) 2015 FPT Software

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

module.exports = function(RED) {
	"use strict";
	var Device = require('azure-iot-device');
	var Client = Device.Client;
	var Message = Device.Message;
	var Http = Device.Http;

	/**
	 * Create Azure-IoT-Hub HTTP node
	 */
	function azureIoTHubHttpNode(n) {
		RED.nodes.createNode(this, n);
		this.deviceName = n.name;
		this.hostName = n.hostName;
		this.sharedAccessKeyName = n.sharedAccessKeyName;
		this.deviceId = n.deviceId;
		this.deviceKey = n.deviceKey;
		this.connectionString = 'HostName=' + this.hostName + ';DeviceId=' + this.deviceId + ';SharedAccessKeyName=' + this.sharedAccessKeyName + ';SharedAccessKey=' + this.deviceKey + '';

		var self = this;

		this.connect = function(mode) {
			if (!self.device) {
				self.log("Attemp to create Azure IoT Hub http node to  " + self.deviceId);
				self.device = new Client.fromConnectionString(self.connectionString);
			}
		};
	}


	RED.nodes.registerType("azure-iot-device-http", azureIoTHubHttpNode);

	/**
	 * Create Azure-IoT-Hub AMQP node
	 */
	function azureIoTHubAmqpNode(n) {
		RED.nodes.createNode(this, n);
		this.deviceName = n.name;
		this.hostName = n.hostName;
		this.sharedAccessKeyName = n.sharedAccessKeyName;
		this.deviceId = n.deviceId;
		this.deviceKey = n.deviceKey;
		this.connectionString = 'HostName=' + this.hostName + ';DeviceId=' + this.deviceId + ';SharedAccessKeyName=' + this.sharedAccessKeyName + ';SharedAccessKey=' + this.deviceKey + '';

		var self = this;

		this.connect = function(mode) {
			if (!self.device) {
				self.log("Attemp to create Azure IoT Hub AMQP node to  " + self.deviceId);
				self.device = new Client.fromConnectionString(self.connectionString, Device.Amqp);
			}

		};
	}


	RED.nodes.registerType("azure-iot-device-amqp", azureIoTHubAmqpNode);

	/**
	 * Create Azure-IoT-Hub HTTP Input (cloud-to-device) node
	 */
	function azureIoTHubHttpNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);
		this.interval = n.interval;
		var self = this;

		if (this.azureIot) {
			self.azureIot.connect();

			self.log('Creating azureIoTHubHttpNodeIn: ' + this.azureIot.name);
			setInterval(function() {
				self.azureIot.device.receive(function(err, msg, res) {
					if (err)
						printResultFor('receive')(err, res);
					else if (res.statusCode !== 204) {
						console.log('azureIoTHubHttpNodeIn Received data: ' + msg.getData() + ' deviceId=' + self.azureIot.deviceId);
						self.send({
							payload : JSON.parse(msg.getData())
						});

						self.azureIot.device.complete(msg, printResultFor('complete'));
					}
				});
			}, self.interval);
		} else {
			this.error("azure-http in is not configured");
		}
	}


	RED.nodes.registerType("azure-http in", azureIoTHubHttpNodeIn);

	/**
	 * Create Azure-IoT-Hub AMQP Input (cloud-to-device) node
	 */
	function azureIoTHubAmqpNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);
		this.interval = n.interval;
		var self = this;

		if (this.azureIot) {
			self.azureIot.connect();

			self.log('Creating azureIoTHubAmqpNodeIn: ' + this.azureIot.name);
			self.azureIot.device.getReceiver(function(err, receiver) {
				receiver.on('message', function(msg) {
					console.log('azureIoTHubAmqpNodeIn received data: ' + JSON.stringify(msg.body) + ' deviceId=' + self.azureIot.deviceId);
					self.send({
						payload : msg.body
					});
					receiver.complete(msg, function() {
						console.log('completed');
					});
				});
				receiver.on('errorReceived', function(err) {
					console.warn(err);
				});
			});
		} else {
			this.error("azure-amqp in is not configured");
		}
	}


	RED.nodes.registerType("azure-amqp in", azureIoTHubAmqpNodeIn);

	/**
	 * Create Azure-IoT-Hub HTTP Output (device-to-cloud) node
	 */
	function azureIoTHubHttpNodeOut(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);

		if (this.azureIot) {
			var self = this;
			this.azureIot.connect();

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
				self.azureIot.device.sendEvent(message, printResultFor('send'));
			});
		} else {
			this.error("azure-http out is not configured");
		}
	}


	RED.nodes.registerType("azure-http out", azureIoTHubHttpNodeOut);

	/**
	 * Create Azure-IoT-Hub AMQP Output (device-to-cloud) node
	 */
	function azureIoTHubAmqpNodeOut(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);

		if (this.azureIot) {
			var self = this;
			this.azureIot.connect();

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
				self.azureIot.device.sendEvent(message, printResultFor('send'));
			});
		} else {
			this.error("azure-amqp out is not configured");
		}
	}


	RED.nodes.registerType("azure-amqp out", azureIoTHubAmqpNodeOut);

	function printResultFor(op) {
		return function printResult(err, res) {
			if (err)
				console.log(op + ' error: ' + err.toString());
			if (res && (res.statusCode !== 204))
				console.log(op + ' status: ' + res.statusCode + ' ' + res.statusMessage);
		};
	}

};
