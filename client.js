$(function() {
    // set various socket and session variables
    let socket = io();
    let mynick = '';
    let mycolor = 'black';
    let cookieset = false;
    let count = 0;
    let focus = true;
    $('form').submit(function() {
        // clear input form and submit message
        let msg = $('#m').val();
        if (msg.startsWith('/nick ')) {
            socket.emit('set nick', msg.substring(6));
        } else if (msg.startsWith('/nickcolor ')) {
            socket.emit('set color', msg.substring(11).toLowerCase());
        } else if (msg.startsWith('/help')) {
            newmessage({msg: 'Available commands are /nick to change nickname and /nickcolor to change nickname color.', server: true});
        } else {
            socket.emit('chat message', msg);
        }
        $('#m').val('');
        return false;
    });
    socket.on('connect', function() {
        // submit cookie information to server
        // code adapted from https://www.w3schools.com/js/js_cookies.asp
        let nick = '';
        let color = '';
        let cookie = decodeURIComponent(document.cookie);
        cookie = cookie.split(';');
        for (let i = 0; i < cookie.length; i++) {
            // check for set cookies
            let c = cookie[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf('nick=') === 0) {
                nick = c.substring(5, c.length);
            } else if (c.indexOf('color=') === 0) {
                color = c.substring(6, c.length);
            }
        }
        if (nick !== '') {
            cookieset = true;
        }
        socket.emit('set nick', nick, true);
        if (color !== '') {
            // process color cookie
            if (color.charAt(0) === '#') {
                color = color.substring(1);
            }
            socket.emit('set color', color);
        }
        $('#m').focus();
    });
    socket.on('initial messages', function(messagelist) {
        // populate messages on screen from server list
        for (let message of messagelist) {
            newmessage(message);
        }
    });
    socket.on('confirm nick', function(nick, first, confirmed) {
        // send message to user regarding nickname or connection
        let message = {};
        message.server = true;
        if (first) {
            message.msg = 'Welcome to the chat, ' + nick + '! Available commands are /nick to change nickname and /nickcolor to change nickname color.';
        } else if (confirmed) {
            message.msg = 'Your nickname is now ' + nick + '.';
        } else {
            message.msg = 'Sorry, that nickname is taken.';
        }
        newmessage(message);
        if (confirmed) {
            // visually confirm nickname
            $('#name').text(nick);
            mynick = nick;
            if (!first || !cookieset) {
                // set cookie for the nickname
                let expiry = new Date();
                expiry.setTime(expiry.getTime() + (1000 * 60 * 60 * 24 * 1000)); // expires in one thousand days
                document.cookie = encodeURIComponent('nick') + '=' + encodeURIComponent(nick) + '; expires=' + expiry.toGMTString() + '; path=/';
                cookieset = true;
            }
        }
    });
    socket.on('confirm color', function(color) {
        // visually change color and set cookie
        mycolor = color;
        $('#name').css('color', color);
        let expiry = new Date();
        expiry.setTime(expiry.getTime() + (1000 * 60 * 60 * 24 * 1000)); // expires in one thousand days
        document.cookie = encodeURIComponent('color') + '=' + encodeURIComponent(color) + '; expires=' + expiry.toGMTString() + '; path=/';
    });
    socket.on('update userlist', function(nicklist, usercolors) {
        // visually update user list from server list
        let users = $('#users');
        users.text("");
        for (let nick of nicklist) {
            // process each nickname in the list
            if (usercolors[nick] !== undefined) {
                users.append($('<li style="color:' + usercolors[nick] + ';">').text(nick));
            } else {
                users.append($('<li>').text(nick));
            }
        }
        users.find('li').filter(function() {
          return $(this).text() === mynick;
        }).addClass('self');
        users.scrollTop(users[0].scrollHeight);
    });
    socket.on('message', function(message) {
        // process the received message
        newmessage(message);
    });
    function newmessage(message) {
        // process a message object into a <li>
        let messages = $('#messages');
        if (message.server) {
            messages.append($('<li class="server">').text(message.msg));
        } else {
            // nicely format chat message according to the set colors
            if (message.nick === mynick) {
                messages.append($('<li class="self">'));
            } else {
                messages.append($('<li>'));
            }
            let newmsg = messages.find('li').last();
            $(newmsg).append($('<span>').text(message.time + ' '));
            $(newmsg).append($('<span style="color:' + message.color + ';">').text(message.nick));
            $(newmsg).append($('<span>').text(': ' + message.msg));
        }
        messages.scrollTop(messages[0].scrollHeight);
        if (!focus) {
            addcount();
        }
    }

    function addcount() {
        // add a notification count to title when page is not in focus
        document.title = '(' + (++count) + ') ' + 'Yet Another Chat';
    }

    $(window).on('resize', function(){
        // ensure chat messages are snapped to bottom when window is resized
        $("#messages").scrollTop($("#messages")[0].scrollHeight);
    });

    $(window).focus(function(){
        // remove notification count in page title
        count = 0;
        document.title = 'Yet Another Chat';
        focus = true;
    });

    $(window).blur(function(){
        // allow notification count to increase when page is not in focus
        focus = false;
    });
});
