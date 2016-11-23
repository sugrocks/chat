// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'sug-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

var serve = serveStatic("./public/");

// to generate tripcodes
var tripcode = require('tripcode');

/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange', 'black' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    var done = finalhandler(request, response);
    serve(request, response, done);
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " <Server is listening on port " + webSocketsServerPort + ">");
});

/**
 * Stuff
 */
String.prototype.reverse=function(){return this.split("").reverse().join("");}
String.prototype.cleanIP=function(){return this.replace(/:|\.|ffff/g, '');}

/**
 * To create an unique color
 */
function getUniqColor(string) {
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    var c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

	var rgb = parseInt(c, 16);   // convert rrggbb to decimal
	var r = (rgb >> 16) & 0xff;  // extract red
	var g = (rgb >>  8) & 0xff;  // extract green
	var b = (rgb >>  0) & 0xff;  // extract blue
	
	var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
	var fg = "#000000";
	console.log("luma: " + luma);
	if (luma < 70) {
	    fg = "#FFFFFF";
	}

	var obj = {
		bgcolor: "#" + "00000".substring(0, 6 - c.length) + c,
		fgcolor: fg
	}

    return obj;
}

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' <Connection from origin ' + request.origin + '.>');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userFgColor = false;
    var userBgColor = false;

    console.log((new Date()) + ' <Connection accepted.>');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) { // first message sent by user is their name
                // remember user name
                userName = tripcode(connection.remoteAddress.reverse().cleanIP());
                // get random color and send it back to the user
				var clr = getUniqColor(userName);
				userFgColor = clr.fgcolor;
				userBgColor = clr.bgcolor;
                connection.sendUTF(JSON.stringify({ type: 'userinfo', data: { name: userName, fgcolor: userFgColor, bgcolor: userBgColor } }));
                console.log((new Date()) + ' <User is known as: ' + userName
                            + ' with ' + userBgColor + '>');
            } else { // log and broadcast the message
				if (message.utf8Data.length > 512) {
	                console.log((new Date()) + ' ' + userName + ': <message too long>');
					return
				}

                console.log((new Date()) + ' ' + userName + ': ' + message.utf8Data);
                
                // we want to keep history of all sent messages
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    fgcolor: userFgColor,
                    bgcolor: userBgColor
                };
                history.push(obj);
                history = history.slice(-100);

                // broadcast message to all connected clients
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false) {
            console.log((new Date()) + " <Peer "
                + connection.remoteAddress + " disconnected.>");
            // remove user from the list of connected clients
            clients.splice(index, 1);
        }
    });

});
