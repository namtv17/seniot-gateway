
module.exports = function(RED) {
	"use strict";
	var Device = require('azure-iot-device');
 	var Client = Device.Client;
 	var Message = Device.Message;
 	var Http = Device.Http;

 	var deviceClient;
 	
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
					deviceClient = new Client.fromConnectionString(connectionString);
					self.device = deviceClient;
				} else if (self.mode == "amqp") {
					self.log("Attemp to create Azure IoT Hub AMQP node to  " + self.deviceId);
					deviceClient = new Client.fromConnectionString(connectionString, Device.Amqp);
					self.device = deviceClient;
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
			self.log('Creating EventHubClient: ' + this.azureIot.name);
			
		    var connectionString = 'HostName='+this.azureIot.hostName+';SharedAccessKeyName='+this.azureIot.sharedAccessKeyName+';SharedAccessKey='+this.azureIot.deviceKey+'';

			if (this.azureIot.mode == "http") {
				setInterval(function () {
				  deviceClient.receive(function (err, msg, res) {
				    if (err) printResultFor('receive')(err, res);
				    else if (res.statusCode !== 204) {
				      console.log('azureIoTHubNodeIn httpNode Received data: ' + msg.getData());
				      self.send({
							payload : JSON.parse(msg.getData())
						});
				
				      deviceClient.complete(msg, printResultFor('complete'));
				    }
				  });
				}, 1000);
			} else if (this.azureIot.mode == "amqp") {
				deviceClient.getReceiver(function (err, receiver)
					{
					  receiver.on('message', function (msg) {
					    console.log('azureIoTHubNodeIn AmqpNode Id: ' + msg.properties.messageId + ' Body: ' + msg.body);
					    self.send({
							payload : JSON.parse(msg.body)
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
					deviceClient.sendEvent(message, printResultFor('send'));
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
