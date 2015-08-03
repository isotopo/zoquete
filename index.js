'use strict';


var tls = require('tls'),
	util = require('util'),
	debug = require('debug')('zoquete'),
	Emitter = require('events').EventEmitter;





/**
 * @class
 * @classdesc
 *      Zoquete constructor
 * @param {object} socketOptions - Tls options reference: https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
 * @param {object} options -
 * @param {number} options.reconnect - Time to reconnect
 */
function Zoquete(socketOptions, options) {
	this.socketOptions = socketOptions;
	options = typeof options === 'object' ? options : {};
	this.options = {
		reconnect: options.reconnect || 500
	};
	this.setMaxListeners(0);
	this.isServer = false;
	this.isClient = false;
	this.clientCallback = function() {};
}





/**
 *
 *  Inherits from `EventEmitter`.
 *
 */
util.inherits(Zoquete, Emitter);





/**
 * @name server
 * @memberof Zoquete
 * @description
 *      Creates a socket server tls
 * @returns {object} - Formated object with displayName and host properties
 */
Zoquete.prototype.server = function(callback) {
	var self = this;
	this.isServer = true;
	// debug('socket server has created');
	this.server = tls.createServer(this.socketOptions, function(socket) {
		var client = self.getClient(socket);
		self.removeAllListeners();
		self._resetSocket(socket);
		self._socket.pipe(self._socket);
		debug('Client: %s with host: %s connected', client.displayName, client.host);
		if (typeof callback === 'function') {
			callback();
		}
	});
	this.server.listen(this.socketOptions.port, function() {
		debug('Socket server listening at %s', self.socketOptions.port);
	});
	return this;
};





/**
 * @name getClient
 * @memberof Zoquete
 * @description
 *      Parse the socket objet to get displayName form OU [Organizational Unit]
 *      and host from CN[Common Name]
 * @param {object} socket - tls socket objet
 * @returns {object} - Formated object with displayName and host properties
 */
Zoquete.prototype.getClient = function(socket) {
	var formatedSocket = {
			displayName: '',
			host: ''
		},
		cert = socket.getPeerCertificate();
	if (cert) {
		formatedSocket.displayName = cert.subject.OU || formatedSocket.displayName;
		formatedSocket.host = cert.subject.CN || formatedSocket.host;
	}
	return formatedSocket;

};





/**
 * @name _resetSocket
 * @memberof Zoquete
 * @description
 *      Reset socket, remove all listeners, assign socket
 *      set encoding and add default listeners
 * @param {Object} socket - Socket
 * @returns {object}
 */
Zoquete.prototype._resetSocket = function(socket) {

	var self = this;

	this._socket = socket;
	this._socket.setEncoding('utf8');
	this._wrapondata();

	/*
	 *
	 * Create events
	 *
	 */


	this._socket.on('error', function(e) {
		debug('On error: %s', e);
	});



	// This event triggers on the client when the server socket falls
	//
	this._socket.on('close', function(e) {
		if (self.isClient) {
			setTimeout(function() {
				self.client(self.clientCallback);
			}, self.options.reconnect);
		}
		debug('On close: %s', e);
	});

	// This event triggers on the server when it is off
	//
	this._socket.on('end', function(e) {
		debug('On end: %s', e);
	});

	return this._socket;
};





/**
 * @name client
 * @memberof Zoquete
 * @description
 *      Creates a socket client tls
 * @param {Function} callback - When the client has connected to server

 */
Zoquete.prototype.client = function(callback) {
	var self = this,
		socket;

	this.isClient = true;

	debug('socket client has created');

	socket = tls.connect(this.socketOptions, function() {

		debug('socket client succesfully connect to: %s, port: %s',
			self.socketOptions.host, self.socketOptions.port);

		debug('The client authorized', socket.authorized);

		if (typeof callback === 'function') {
			self.clientCallback = callback;
			self.clientCallback();
		}
	});

	this._resetSocket(socket);
	process.stdin.pipe(self._socket);
	process.stdin.resume();
	return this;
};





/**
 * @name send
 * @memberof Zoquete
 * @description
 *      Wraps socket.wirte method
 * @param {String} ev - Event name
 * @param {Object} data - JSON data to send
 * @returns {Object} - A Promise
 */
Zoquete.prototype.send = function(ev, data) {
	var self = this,
		req = this._parser(ev, data);
	if (req) {
		this._socket.write(req);
		return new Promise(function(resolve, reject) {
			self.once(ev + ':done', function(data) {
				self.removeAllListeners(ev + ':fail');
				resolve(data);
			});
			self.once(ev + ':fail', function(data) {
				self.removeAllListeners(ev + ':done');
				reject(data);
			});
		});
	}
};





/**
 * @name _wrapondata
 * @memberof Zoquete
 * @description
 *      Wraps socket.on('datat') event
 */
Zoquete.prototype._wrapondata = function() {
	var self = this;
	var received = '';
	self._socket.on('data', function(data) {
		received += data;
		if (Buffer.byteLength(data, 'utf8') < 1024) {
			self._reverse(received);
			received = '';
		}
	});
};





/**
 * @name _parser
 * @memberof Zoquete
 * @description
 *       Convert and validate Object with format {ev: 'myevent': content: {}}
 *       to string (stingify)
 * @param {String} ev - Event name
 * @param {Object} data - JSON data to send
 * @returns {String|Boolean}
 */
Zoquete.prototype._parser = function(ev, data) {
	return JSON.stringify({
		ev: ev,
		content: data
	});
};





/**
 * @name _reverse
 * @memberof Zoquete
 * @description
 *       Validate, convert string to object and trigger the event
 * @param {Object} obj - JSON data to send
 */
Zoquete.prototype._reverse = function(obj) {
	try {
		obj = JSON.parse(obj);
		this.emit(obj.ev, obj.content);
	} catch (e) {
		this._socket.emit('error', e);
	}
};


/**
 * @name close
 * @memberof Zoquete
 * @description
 *       Close connection
 */
Zoquete.prototype.close = function() {
	if (this.isServer) {
		this._socket.end();
	}
	return;
};



module.exports = Zoquete;
