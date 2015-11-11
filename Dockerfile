# Set node base image
FROM node:0.12

MAINTAINER fpt-softwre

# Define working directory
RUN mkdir -p /var/seniot/
# install node-red from seniot/ repository
WORKDIR /var/seniot
ADD . /var/seniot
RUN mkdir -p /var/seniot/awsCerts
VOLUME ["/var/seniot/awsCerts"]

RUN git clone https://github.com/seniot/node-red.git /var/seniot/workflow
RUN git clone https://github.com/seniot/node-red-nodes.git /var/seniot/workflow/nodes/node-red-nodes

RUN cd /var/seniot/workflow/ \	
	&& git pull \
	&& git fetch --tags \
	&& git tag \
	&& git checkout -b v0.1.1 v0.1.1 \
	&& npm install \
	&& npm update \
	&& npm install -g grunt-cli \
	&& grunt build
	
RUN cd /var/seniot/workflow/nodes/node-red-nodes/ \	
	&& git pull \
	&& git fetch --tags \
	&& git tag \
	&& git checkout -b v0.1.1 v0.1.1 \
	&& npm install \
	&& npm update

# expose port
EXPOSE 1880

# Run app using nodemon
CMD ["node", "/var/seniot/workflow/red.js"]