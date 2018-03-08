// set variables for socket.io
let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

// set variables to keep track of aspects of users
let next_id = 1;
let nicknames = {};
let nicklist = [];
let messagelist = [];
let colornames = require(__dirname + '/colors.json');
let usercolors = {};

// allow client to access required files
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/client.js', function(req, res) {
    res.sendFile(__dirname + '/client.js');
});
app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + '/style.css');
});

io.on('connection', function(socket) {
    // send client a list of saved messages
    socket.emit('initial messages', messagelist);
    socket.on('set nick', function(nick, first) {
        // process requested nickname
        if (nicklist.indexOf(nick) !== -1) {
            // if nickname is already in use
            if (first) {
                nick = '';
            } else {
                socket.emit('confirm nick', '', false, false);
                return;
            }
        }
        if (nick === '') {
            // if nickname should be set by the server find the next available nickname
            while (nicklist.indexOf('User ' + (next_id++)) !== -1);
            nick = 'User ' + --next_id;
        }
        if (first) {
            // if a newly connected user requested this nickname
            nicklist.push(nick);
            let message = {msg: nick + ' has entered the chat!', server: true};
            socket.broadcast.emit('message', message);
            addmessage(message);
        } else {
            // if a user is changing their nickname
            let oldnick = nicknames[socket.id];
            nicklist[nicklist.indexOf(oldnick)] = nick;
            usercolors[nick] = usercolors[oldnick];
            usercolors[oldnick] = undefined;
        }
        nicknames[socket.id] = nick;
        socket.emit('confirm nick', nick, first, true);
        io.sockets.emit('update userlist', nicklist, usercolors);
    });
    socket.on('set color', function(color) {
        // process requested nick color
        let valid = false;
        if (colornames[color]) {
            // if color is a named CSS color
            valid = true;
        } else if (color.match('^[a-f0-9]{6}$')) {
            // if color is a valid hex value
            color = '#' + color;
            valid = true;
        }
        if (valid) {
            // update the new color internally and to all clients
            usercolors[nicknames[socket.id]] = color;
            socket.emit('confirm color', color);
            io.sockets.emit('update userlist', nicklist, usercolors);
        } else {
            let message = {msg: 'Sorry, that is not a valid color.', server: true};
            socket.emit('message', message);
        }
    });
    socket.on('disconnect', function() {
        // tell clients the user has disconnected and remove their internal information
        let nick = nicknames[socket.id];
        let message = {msg: nick + ' has left the chat.', server: true};
        io.sockets.emit('message', message);
        addmessage(message);
        nicklist.splice(nicklist.indexOf(nick), 1);
        nicknames[socket.id] = undefined;
        usercolors[nick] = undefined;
        io.sockets.emit('update userlist', nicklist, usercolors);
    });
    socket.on('chat message', function(msg) {
        // process a normal chat message
        let message = {};
        message.server = false;
        message.msg = msg;
        message.time = new Date();
        message.time = message.time.toTimeString().substring(0, 5);
        message.nick = nicknames[socket.id];
        if (usercolors[message.nick] === undefined) {
            message.color = 'black';
        } else {
            message.color = usercolors[message.nick];
        }
        io.sockets.emit('message', message);
        addmessage(message);
    });
});

http.listen(3000, function() {
    // give terminal information for accessing the site
    console.log('Server is up and running on port 3000!');
    console.log('This device: Point browser to localhost:3000');
    // following code adapted from https://gist.github.com/szalishchuk/9054346 to get local IP
    let ifaces = require('os').networkInterfaces();
    let address;
    Object.keys(ifaces).forEach(dev => {
        // filter network interfaces for the local IP address
        ifaces[dev].filter(details => {
            if (details.family === 'IPv4' && details.internal === false) {
                address = details.address;
            }
        });
    });
    if (address.length > 0)
        console.log('Other devices on this network: Point your browser to ' + address + ':3000');
});

function addmessage(message) {
    // limit stored messages to 200 and add the new message
    while (messagelist.length >= 200) {
        messagelist.shift();
    }
    messagelist.push(message);
}