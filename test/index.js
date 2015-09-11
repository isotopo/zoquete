'use strict';

// Allow Self-signed certificates
// Warning! only for development
//
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var assert = require('assert'),
	fs = require('fs'),
	megaObject = require('./mega-object'),
	debug = {
		info: require('debug')('zoquete:test:info'),
		error: require('debug')('zoquete:test:error')
	},
	Zoquete = require('../index'),
	client, server;

describe('Socket', function() {

	// Create a server
	//
	before(function(done) {

		// Instance
		//
		server = new Zoquete({
			port: 4000,
			key: fs.readFileSync('./test/keys/server-key.pem'),
			cert: fs.readFileSync('./test/keys/server-cert.pem'),
			ca: [fs.readFileSync('./test/keys/client-cert.pem'), fs.readFileSync('./test/keys/client2-cert.pem')],
			requestCert: true,
			rejectUnauthorized: true,
			allowHalfOpen: false,
		});

		var callbackOnClientConection = function() {
			// console.log('callbackOnClientConection');
		};

		server.server(callbackOnClientConection).listen(function() {
			done();
		});



	});


	// Create a client
	//
	before(function(done) {

		this.timeout = 20000;

		client = new Zoquete({
			host: 'localhost', // Server tls host
			port: 4000, // Server tls port
			key: fs.readFileSync('./test/keys/client-key.pem'),
			cert: fs.readFileSync('./test/keys/client-cert.pem'),
			ca: [fs.readFileSync('./test/keys/server-cert.pem')],
			checkServerIdentity: function() {
				return;
			}
		}).client(function() {
			debug.info('Client 1 connected');
			done();
		});

	});





	/*
	* Client 1 to server
	* Ping pong test
	* Server is listening for a ping and response with a pong message
	*/
	var limit1 = 10;
	it('Server is listening for a ping and response pong in ' + limit1 + ' times', function(done) {

		this.timeout = 20000;

		var times = 0;

		// Server is listening for a ping form client
		//
		server.on('ping', function(req) {

			debug.info('Server on ping: %s, request: %s', times, JSON.stringify(req));

			if (times >= limit1-1) {
				return done();
			}
			// Increase times
			//
			times++;

			// Server responses with pong
			//
			server.send('pong', {timestamp: Date.now()});
			server.send('ping:fail', {timestamp: Date.now(), error: 'fake'});

		});


		// Client is listening for a pong form server
		//
		client.on('pong', function(req){

		  debug.info('Client on pong: %s, request: %s', times, JSON.stringify(req));

		  // Client responses with ping
			//
			client.send('ping', {timestamp: Date.now()});

		});


		// And the trigger, the first event emitter a "ping"
		//
		client.send('ping', {
			timestamp: Date.now()
		})

		// This callback run when the server response with
		// ping:done
		//
		.then(function(response) {
			debug.info('I\'m ping:done :)', response);
		})

		// This callback run when the server response with
		// ping:fail
		//
		.catch(function(error) {
			debug.error('I\'m ping:fail :(', error);
		});

	});



	/*
	* Client 1 to server
	* Create user
	* Server is listening for a ping and response with a pong message
	*/
	it('Server is listening for a user:create event', function(done) {

		this.timeout = 20000;

		var user = {
			user: 'test',
			email: 'test@test.test'
		};

		// Server is listening for a ping form client
		//
		server.on('user:create', function(req) {
			debug.info('Server on user:create request: %s', JSON.stringify(req));
			server.send('user:create:done', req);
			return done();
		});



		// And the trigger, the first event emitter a "ping"
		//
		client.send('user:create', user)

		// This callback run when the server response with
		// ping:done
		//
		.then(function(response) {
			debug.info('I\'m user:create:done :)', response);
			debug.info('response typeof: %s', typeof response);
			debug.info('response equals to user: %s', assert.deepEqual(response, user));
		})

		// This callback run when the server response with
		// ping:fail
		//
		.catch(function(error) {
			debug.error('I\'m user:create:fail :(', error);
		});

	});



	/*
	* Client 1 to server
	* Server send a mega object on cliente request
	*/
	it('Server is listening for a big-object event and send a mega object', function(done) {

		this.timeout = 20000;

		// Server is listening for a ping form client
		//
		server.on('mega-object', function(req) {
			// debug.info('Server on mega-object: %s', JSON.stringify(req));
			server.send('mega-object:done', megaObject);
			return done();
		});

		//
		client.send('mega-object', 'Give me a mega object')

		// This callback run when the server response with
		// big-object:done
		//
		.then(function(response) {
			// debug.info('I\'m mega-object:done :)', response);
			debug.info('mega-object typeof: %s', typeof response);
			debug.info('megaObject equals to response: %s', assert.deepEqual(response, megaObject));
		})

		// This callback run when the server response with
		// ping:fail
		//
		.catch(function(error) {
			debug.error('I\'m mega-object:fail :(', error);
		});

	});


});
