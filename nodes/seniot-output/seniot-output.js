/**
 * Copyright 2015 Urbiworx
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

	var pendingresponses = new Array();
	var nodes = new Array();

	function SeniotOutput(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name.trim();
		this.url = n.url;
		this.retain = n.retain;
		
		nodes.push(this);

		var self = this;

		this.on("input", function(msg) {
			self.lastValue = msg.payload;
		});

		this.on("close", function() {
			var index = nodes.indexOf(self);
			if (index > -1) {
				nodes.splice(index, 1);
			}
		});

		if (n.url) {
			RED.httpNode.get(n.url, function(req, res) {
				var url = req.originalUrl;
				for (var i in nodes)
				if (nodes[i].url == url) {
					res.end(JSON.stringify(nodes[i].lastValue));
					if (!nodes[i].retain) {
						nodes[i].lastValue = undefined;
					}
					
					break;
				}

			});
		} else {
			this.error("seniot-output in is not configured");
		}

	}


	RED.nodes.registerType("seniot-output", SeniotOutput);
};
