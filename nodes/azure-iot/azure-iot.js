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
		this.sharedAccessKey = n.sharedAccessKey;
		this.deviceId = n.deviceId;
		this.deviceKey = n.deviceKey;
		
		var self = this;

		this.connect = function() {
			if (!self.device) {
				
				var connectionString = 'HostName='+self.hostName+';DeviceId='+self.deviceId+';SharedAccessKeyName='+self.sharedAccessKeyName+';SharedAccessKey='+self.deviceKey+'';
				self.log("Attemp to create to  " + self.deviceId);
				httpClient = new Client.fromConnectionString(connectionString);
				self.device = httpClient;
			}
			    
		};
	}


	RED.nodes.registerType("azure-iot-device", azureIoTHubNode);

	function azureMqttNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);

		if (this.azureIot) {
			var self = this;
			this.azureIot.connect();
			self.log('Creating EventHubClient: ' + this.azureIot.name);
			
		    var connectionString = 'HostName='+this.azureIot.hostName+';SharedAccessKeyName='+this.azureIot.sharedAccessKeyName+';SharedAccessKey='+this.azureIot.sharedAccessKey+'';

			var startTime = Date.now();
			var ehClient = new EventHubClient(connectionString, 'messages/events/');
			  ehClient.GetPartitionIds().then(function(partitionIds) {
			    partitionIds.forEach(function(partitionId) {
			      ehClient.CreateReceiver('$Default', partitionId).then(function(receiver) {
			          // start receiving
			        receiver.StartReceive(startTime).then(function() {
			          receiver.on('error', function(error) {
			            serviceError(error.description);
			          });
			          receiver.on('eventReceived', function(eventData) {
			            if ((eventData.SystemProperties['iothub-connection-device-id'] === self.azureIot.deviceId) &&
			                (eventData.SystemProperties['x-opt-enqueued-time'] >= startTime)) {
			              console.log('Event received['+self.azureIot.deviceId+']: ' + JSON.stringify(eventData.Bytes));

			              self.send({
								payload : JSON.parse(JSON.stringify(eventData.Bytes))
							});
			            }
			          });
			        });
			        return receiver;
			      });
			    });
			    return partitionIds;
			  });
		} else {
			this.error("azure-iot-hub in is not configured");
		}
	}


	RED.nodes.registerType("azure-iot-hub in", azureMqttNodeIn);

	function azureMqttNodeOut(n) {
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
	
	RED.nodes.registerType("azure-iot-hub out", azureMqttNodeOut);
};
