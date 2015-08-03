# Zoquete

Zoquete is a library that wraps a socket connection with tls.

[![Build Status](https://travis-ci.org/4yopping/zoquete.svg?branch=master)](https://travis-ci.org/4yopping/zoquete)
[![npm version](https://badge.fury.io/js/zoquete.svg)](http://badge.fury.io/js/zoquete)
[![Inline docs](http://inch-ci.org/github/4yopping/zoquete.svg?branch=master)](http://inch-ci.org/github/4yopping/zoquete)
![Zoquete](./zoquete-logo.png)


## Install

```shell
npm install zoquete --save
```


Example: Ping-pong

**Server:**

```js
    var Zoquete = require('zoquete'),
    options = {
        key: 'my-key.key',
        cert: 'my-cert.cert',
        requestCert: true,
        ca: ['authorized-client.cert'],
        port: 8080 // Listen port
    },

    z = new Zoquete(options).server(function(){
        z.send('pong', {timestamp: Date.now()});
        z.on('ping', function(data){
            // data = {timestamp: "timestamp-here"}
            z.send('pong', {timestamp: Date.now()});
        });
    });

```

**Client:**

```js
    var Zoquete = require('zoquete'),
    options = {
        host: 'localhost', // Server tls host
        port: 8080 // Server tls port
        key: 'my-key.key',
        cert: 'my-cert.cert',
        ca: ['authorized-server.cert'],
         checkServerIdentity: function(host, cert) {
            // Avoid the server name match verification
            return;
        }
    },
    z = new Zoquete(options).client();
    z.on('pong', function(data){
        // data = {timestamp: "timestamp-here"}
        z.send('ping', {timestamp: Date.now()});
    });
```




# Custom Events

Zoquete supports custom event names, excluding reserved events names:

+ 'connection'
+ 'error'
+ 'data'
+ 'close'


# Recommended naming

The recommended naming event is based on (Create, Read, Update, Delete).

E.g.:

+ Proccess and storage: 'user:create'
+ Update a user: 'user:update'
+ Remove a user: 'user:delete'

Event names recommended to reading:

+ Get a single user: 'user:readone'
+ Get multiple users: 'user:read'


# Responses

Once the client are sent the server will send the event name with his result.

Eg: "myevent:done" - The event "myevent" was done.
    "myevent:fail" - An error or errors on "myevent".



```js
    // In client tls
    z.on('myevent:fail', function(data){
        // - data
    });
```



Alternatively send method returns a promise which is triggered when the server sends the event "done" or "fail" containing


```js
    // In client tls
z.send('myevent', {
        say: 'daaaah!',
    })
    .then(function(response) {
        // - Triggered by myevent:done
    })
    .catch(function(errors) {
       // - Triggered by myevent:fail
    });
```


# Usage


```js
    z.on('myevent', function(){}); // Good! :)
    z.on('myevent:create', function(){}); // Good! :)
    z.on('data', function(){}); // Bad! :(
    z.on('error', function(){}); // Bad! :(

    z.send('myevent', {}); // Good! :)
    z.send('data', {}); // Bad! :(
    z.send('myevent'); // Bad! :( The event sent must contain an object.
    z.send('myevent', false); // Bad! :( Send only support objects {}
```





## License

The MIT License (MIT)

Copyright (c) 2015 Sergio Morlán Páramo, 4yopping and all the related trademarks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
