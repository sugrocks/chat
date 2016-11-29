$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#myName');

	var scrollBottom = true;

    // my color assigned by the server
    var myFgColor = false;
    var myBgColor = false;
    // my name assigned by the server
    var myName = false;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('wss://chat.sug.rocks');

    connection.onopen = function () {
        // first we want users to enter get their id and color
        connection.send("I'm a huge faggot.");
        input.removeAttr('disabled');
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        if (json.type === 'userinfo') { // first response from the server with user's color
            myFgColor = json.data.fgcolor;
            myBgColor = json.data.bgcolor;
			myName = json.data.name
            status.text(myName).css({'color': myFgColor, 'background-color': myBgColor});
            // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text,
                           json.data[i].fgcolor, json.data[i].bgcolor, 
                           new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { // it's a single message
            addMessage(json.data.author, json.data.text,
                       json.data.fgcolor, json.data.bgcolor,
                       new Date(json.data.time));
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
     * Send mesage when user presses Enter key
     */
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // send the message as an ordinary text
            connection.send(msg);
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            //input.attr('disabled', 'disabled');
        }
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

	/**
	 * Get day of the week from int
	 */
	function getDayWeek(day) {
		switch(day) {
			case 0:
				return 'Sun';
				break;
			case 1:
				return 'Mon';
				break;
			case 2:
				return 'Tue';
				break;
			case 3:
				return 'Wed';
				break;
			case 4:
				return 'Thu';
				break;
			case 5:
				return 'Fri';
				break;
			case 6:
				return 'Sat';
				break;
			default:
				return '???';
		}
	}

    /**
     * Add message to the chat window
     */
    function addMessage(author, message, fgcolor, bgcolor, dt) {
        content.append('<div class="message"><span class="author" style="color:' + fgcolor + '; background-color:' + bgcolor + '">' + author
             + '</span><span class="time"> @ '
             + (dt.getMonth() < 10 ? '0' + dt.getMonth() : dt.getMonth()) + '/'
             + (dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate()) + '/'
             + dt.getFullYear() + '('
             + getDayWeek(dt.getDay()) + ')'
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) + ':'
             + (dt.getSeconds() < 10 ? '0' + dt.getSeconds() : dt.getSeconds())
             + '</span><br><div class="text">' + message + '</div></div>');
		if (scrollBottom) {
			content.scrollTop(content[0].scrollHeight);
		}
    }

	$(content).scroll(function() {
		if(content.scrollTop() + content.height() > content[0].scrollHeight - 200) {
			scrollBottom = true;
		} else {
			scrollBottom = false;
		}
	});
        $("#shitpostpics").endlessScroll({ 
		width: '100%', 
		height: '100px', 
		steps: -2, speed: 40, 
		mousestop: true });
});
