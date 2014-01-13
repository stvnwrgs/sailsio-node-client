var SailsIo = require('socket.io-client');

var Socket = SailsIo.SocketNamespace;

/**
 * Simulate a GET request to sails
 * e.g.
 *    `socket.get('/user/3', Stats.populate)`
 *
 * @param {String} url    ::    destination URL
 * @param {Object} params ::    parameters to send with the request [optional]
 * @param {Function} cb   ::    callback function to call when finished [optional]
 */

Socket.prototype.get = function (url, data, cb) {
  return this.request(url, data, cb, 'get');
};



/**
 * Simulate a POST request to sails
 * e.g.
 *    `socket.post('/event', newMeeting, $spinner.hide)`
 *
 * @param {String} url    ::    destination URL
 * @param {Object} params ::    parameters to send with the request [optional]
 * @param {Function} cb   ::    callback function to call when finished [optional]
 */

Socket.prototype.post = function (url, data, cb) {
  return this.request(url, data, cb, 'post');
};



/**
 * Simulate a PUT request to sails
 * e.g.
 *    `socket.post('/event/3', changedFields, $spinner.hide)`
 *
 * @param {String} url    ::    destination URL
 * @param {Object} params ::    parameters to send with the request [optional]
 * @param {Function} cb   ::    callback function to call when finished [optional]
 */

Socket.prototype.put = function (url, data, cb) {
  return this.request(url, data, cb, 'put');
};



/**
 * Simulate a DELETE request to sails
 * e.g.
 *    `socket.delete('/event', $spinner.hide)`
 *
 * @param {String} url    ::    destination URL
 * @param {Object} params ::    parameters to send with the request [optional]
 * @param {Function} cb   ::    callback function to call when finished [optional]
 */

Socket.prototype['delete'] = function (url, data, cb) {
  return this.request(url, data, cb, 'delete');
};


Socket.prototype.request = request;

/**
 * Modified request function that send cookie
 * @param  {[type]}   url    [description]
 * @param  {[type]}   data   [description]
 * @param  {Function} cb     [description]
 * @param  {[type]}   method [description]
 * @return {[type]}          [description]
 */
function request (url, data, cb, method) {

  var socket = this;

  var usage = 'Usage:\n socket.' +
    (method || 'request') +
    '( destinationURL, dataToSend, fnToCallWhenComplete )';

  // Remove trailing slashes and spaces
  url = url.replace(/^(.+)\/*\s*$/, '$1');

  // If method is undefined, use 'get'
  method = method || 'get';


  if ( typeof url !== 'string' ) {
    throw new Error('Invalid or missing URL!\n' + usage);
  }

  // Allow data arg to be optional
  if ( typeof data === 'function' ) {
    cb = data;
    data = {};
  }

  // Build to request
  var json = io.JSON.stringify({
    url: url,
    data: data
  });

  // Send the message over the socket
  socket.emit(method, json, function afterEmitted (result) {

    var parsedResult = result;
    if (result && typeof result === 'string') {
      try {
        parsedResult = io.JSON.parse(result);
      } catch (e) {
        if (typeof console !== 'undefined') {
          console.warn("Could not parse:", result, e);
        }

        //throw new Error("Server response could not be parsed!\n" + result);
      }
    }

    // TODO: Handle errors more effectively
    if (parsedResult === 404) throw new Error("404: Not found");
    if (parsedResult === 403) throw new Error("403: Forbidden");
    if (parsedResult === 500) throw new Error("500: Server error");

    cb && cb(parsedResult);

  });
};


var request = require('request');
var xhr = require('socket.io-client/node_modules/xmlhttprequest');
var xhrOriginal = require('xmlhttprequest');
var myUrl = 'http://'+'localhost'+':'+'1337';
var cookieJar = request.jar();

/**
 * From socket.io-client's module 'xmlhttprequest', rewrie its XMLHttpRequest function.
 */
xhr.XMLHttpRequest = function() {
  this.XMLHttpRequest = xhrOriginal.XMLHttpRequest;
  xhrOriginal.XMLHttpRequest.apply(this, arguments);
  this.setDisableHeaderCheck(true); // Allow header modifications.
  
  // Rewrite the 'open' function.
  var openOriginal = this.open;
  this.open = function(method, url, async, user, password) {
    openOriginal.apply(this, arguments);
    var cook;
    var header = cookieJar.getCookies(myUrl, function (err, cookies) {
      cook = cookies.join('; ');
    });
    this.setRequestHeader('cookie', cook);
  };
};

/**
 * Overwrites the connect method froma socket.io-client
 * extends the function by adding a pre request that get
 * the handshake cookie
 * 
 * @param  {[type]}   host    [url:port]
 * @param  {[type]}   details [description]
 * @return {[type]}           [description]
 */
SailsIo.connect = function (host, details, cb) {
  request.post({jar: cookieJar, url: myUrl}, function(err, resp, body) {
    var uri = SailsIo.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = SailsIo.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    SailsIo.util.merge(options, details);

    if (options['force new connection'] || !SailsIo.sockets[uuri]) {
      socket = new SailsIo.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      SailsIo.sockets[uuri] = socket;
    }

    socket = socket || SailsIo.sockets[uuri];
    
    var rsocket = socket.of(uri.path.length > 1 ? uri.path : '');
    cb(rsocket);
    return rsocket;
  });
};
 


module.exports = SailsIo;