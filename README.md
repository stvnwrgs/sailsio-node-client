sailsio-node-client
===================

 This is a extended socket.io-client for node, that works with sailjs. It adds the handshake functionality and implements the GET POST PUT DELETE functions from sails socket.io.

Example:

```javascript
SailsIo.connect('http://127.0.0.1:1337', function (socket) {

  socket.on('connecting', function() {
    console.log('(II) Connecting to server');
  });
  socket.on('connect', function () {
    console.log('connected');

    socket.on('event', function(data){
      
    });

    socket.on('disconnect', function (reason) {
      console.log('(II) Disconnected from server\n');
    });

    socket.on('reconnect', function(socket){
      console.log(socket);
    });


    socket.on('reconnect_error', function (error) {
      console.log(error);
    })
  });

  socket.on('error', function (reason) {
    console.log('(EE) Error connecting to server: ' + reason);
    process.exit(code=0);
  });

});
```
