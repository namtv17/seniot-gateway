
module.exports = function(RED) {
	"use strict";
	var Device = require('azure-iot-device');
 	var Client = Device.Client;
 	var Message = Device.Message;
 	var Http = Device.Http;

	
	function azureIoTHubNode(n) {
		RED.nodes.createNode(this, n);
		this.deviceName = n.name;
		this.hostName = n.hostName;
		this.sharedAccessKeyName = n.sharedAccessKeyName;
		this.deviceId = n.deviceId;
		this.deviceKey = n.deviceKey;
		this.mode = n.mode;
		
		var self = this;
		
		this.connect = function() {
			if (!self.device) {
				var connectionString = 'HostName='+self.hostName+';DeviceId='+self.deviceId+';SharedAccessKeyName='+self.sharedAccessKeyName+';SharedAccessKey='+self.deviceKey+'';

				if (self.mode == "http") {
					self.log("Attemp to create Azure IoT Hub http node to  " + self.deviceId);
					self.device = new Client.fromConnectionString(connectionString);
				} else if (self.mode == "amqp") {
					self.log("Attemp to create Azure IoT Hub AMQP node to  " + self.deviceId);
					self.device = new Client.fromConnectionString(connectionString, Device.Amqp);
				} else {
					
				}
			}
			    
		};
	}


	RED.nodes.registerType("azure-iot-device", azureIoTHubNode);

	function azureIoTHubNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);
		this.interval = n.interval;
		var self = this;
		
		if (this.azureIot) {
			self.azureIot.connect();
			
		    var connectionString = 'HostName='+this.azureIot.hostName+';SharedAccessKeyName='+this.azureIot.sharedAccessKeyName+';SharedAccessKey='+this.azureIot.deviceKey+'';

			if (this.azureIot.mode == "http") {
				self.log('Creating azureIoTHubNodeIn: http ' + this.azureIot.name + ' mode=' + this.azureIot.mode);
				setInterval(function () {
				  self.azureIot.device.receive(function (err, msg, res) {
				    if (err) printResultFor('receive')(err, res);
				    else if (res.statusCode !== 204) {
				      console.log('azureIoTHubNodeIn httpNode Received data: ' + msg.getData() + ' deviceId=' + self.azureIot.deviceId);
				      self.send({
							payload : JSON.parse(msg.getData())
						});
				
				      self.azureIot.device.complete(msg, printResultFor('complete'));
				    }
				  });
				}, self.interval);
			} else if (this.azureIot.mode == "amqp") {
				self.log('Creating azureIoTHubNodeIn: amqp ' + this.azureIot.name + ' mode=' + this.azureIot.mode);
				self.azureIot.device.getReceiver(function (err, receiver)
					{
					  receiver.on('message', function (msg) {
					    console.log('azureIoTHubNodeIn AmqpNode data: '  + JSON.stringify(msg.body) + ' deviceId=' + self.azureIot.deviceId);
					    self.send({
							payload : msg.body
						});
					    receiver.complete(msg, function() {
					      console.log('completed');
					    });
					    // receiver.reject(msg, function() {
					    //   console.log('rejected');
					    // });
					    // receiver.abandon(msg, function() {
					    //   console.log('abandoned');
					    // });
					  });
					  receiver.on('errorReceived', function(err)
					  {
					    console.warn(err);
					  });
					});
			} else {
				
			}
		} else {
			this.error("azure-iot-hub in is not configured");
		}
	}


	RED.nodes.registerType("azure-iot-hub in", azureIoTHubNodeIn);

	function azureIoTHubNodeOut(n) {
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
				
				if (this.azureIot.mode == "http" || this.azureIot.mode == "amqp") {
					self.azureIot.device.sendEvent(message, printResultFor('send'));
				} else {
					
				}
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
	
	RED.nodes.registerType("azure-iot-hub out", azureIoTHubNodeOut);
};
