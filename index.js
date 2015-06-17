 'use strict';


 var tls = require('tls'),
     util = require('util'),
     Emitter = require('events').EventEmitter;



 /**
  *
  * Zoquete constructor
  *
  * @param {Object} options - Tls options reference: https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
  *
  */

 function Zoquete(options) {
     this.options = options;
     this.setMaxListeners(0);
     this.isServer = false;
     this.isClient = false;
 }



 /**
  *
  *  Inherits from `EventEmitter`.
  *
  */
 util.inherits(Zoquete, Emitter);



 /**
  *
  * Creates a socket server tls
  *
  * @param {Function} callback - When the server has been created
  *
  */
 Zoquete.prototype.server = function(callback) {
     var self = this;
     this.server = tls.createServer(this.options, function(socket) {
         self.removeAllListeners();
         self._resetSocket(socket);
         self._socket.pipe(self._socket);
         self.isServer = true;
         if (typeof callback === 'function') {
             callback();
         }
     });
     this.server.listen(this.options.port);
     return this;
 };



 /**
  *
  * Reset socket, remove all listeners, assign socket
  * set encoding and add default listeners
  *
  * @param {Object} socket - Socket
  *
  * @returns {Object}
  *
  */
 Zoquete.prototype._resetSocket = function(socket) {
     this._socket = socket;
     this._socket.setEncoding('utf8');
     this._wrapondata();
     this._socket.on('error', function(e) {
         console.log('Error: %s', e);
     });
     this._socket.on('close', function(e) {
         console.log('Close: %s', e);
     });
     this._socket.on('end', function(e) {
         console.log('End: %s', e);
     });
     return this._socket;
 };



 /**
  *
  * Creates a socket client tls
  *
  * @param {Function} callback - When the client has connected to server
  *
  */
 Zoquete.prototype.client = function(callback) {
     var self = this,
         socket = tls.connect(this.options, function() {
             self.isClient = true;
             if (typeof callback === 'function') {
                 callback();
             }
         });
     this._resetSocket(socket);
     process.stdin.pipe(this._socket);
     process.stdin.resume();
     return this;
 };



 /**
  *
  * Wraps socket.wirte method
  *
  * @param {String} ev - Event name
  * @param {Object} data - JSON data to send
  *
  * @returns {Promise}
  *
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
  *
  * Wraps socket.on('datat') event
  *
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



 /*
  *
  * Convert and validate Object with format {ev: 'myevent': content: {}}
  * to string (stingify)
  *
  * @param {String} ev - Event name
  * @param {Object} data - JSON data to send
  *
  * @returns {String|Boolean}
  *
  */
 Zoquete.prototype._parser = function(ev, data) {
     return JSON.stringify({
         ev: ev,
         content: data
     });
 };



 /*
  *
  * Validate, convert string to object and trigger the event
  *
  * @param {Object} obj - JSON data to send
  *
  * @returns {Boolen}
  *
  */
 Zoquete.prototype._reverse = function(obj) {
     try {
        obj = JSON.parse(obj);
        this.emit(obj.ev, obj.content);
     } catch (e) {
        this._socket.emit('error', e);
     }
 };


 /*
  *
  * Close connection
  *
  * @returns {Boolen}
  *
  */
 Zoquete.prototype.close = function() {
     if (this.isServer) {
         this._socket.end();
     }
     return;
 };



 module.exports = Zoquete;
