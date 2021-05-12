//require is used to consume other node modules (located in node_modules dir, that was created when prompting 'npm install' in the command line)
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

//port can be set manually using the command line, for example "env PORT=8888 node index.js"
const port = process.env.PORT || 3000;
let num_users_online = 0;

/* DEFINE PATHES OF OUR SERVER: */
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

/*
 * may define more routes such as:
 * app.get('/saved_messages', function (req, res) {
 *   res.sendFile(__dirname + '/COMPLETE_THIS!.html');
 * });
*/

/*
 * enable using local files, stored in static folder, use this in index.html as:
 * 
 * <script src="/static/hello_world.js"></script>
*/
app.use('/static', express.static(path.join(__dirname, 'static')))


//socket.io:
io.on('connection', function (socket) {
  //each socket is unique to each client that connects:
  console.log("socket.id: " + socket.id);

  //let the clients know how many online users are there:
  io.emit('updateNumUsersOnline', ++num_users_online);

  socket.on('username', function (username_from_client) {
    socket.username = username_from_client;

    //let all users know that this user has connected:
    io.emit('userConnected', socket.username);
  });

  //handle adding a message to the chat.
  socket.on('addChatMessage(client->server)', function (msg) {
    //io.emit(..., ...); - sending the message to all of the sockets.
    io.emit('addChatMessage(server->clients)', [socket.username, prepareMessageToClients(socket, msg)]);
  });

  //handle isTyping feature
  //istyping - key down
  socket.on('userIsTypingKeyDown(client->server)', function (undefined) {
    io.emit('userIsTypingKeyDown(server->clients)', [socket.username, prepareIsTypingToClients(socket)]);
  });

  //istyping - key up
  socket.on('userIsTypingKeyUp(client->server)', function (undefined) {
    io.emit('userIsTypingKeyUp(server->clients)', socket.username);
  });

  socket.on('disconnect', function () {
    io.emit('userDisconnected', socket.username);
    io.emit('updateNumUsersOnline', --num_users_online);
  });
});


//start our server:
http.listen(port, function () {
  console.log('listening on localhost:' + port);
});

// -------------------------------------------------
function getParsedTime() {
  const date = new Date();

  let hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  let min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  return (hour + ":" + min);
}

// Prepare the message that will be sent to all of the clients
function prepareMessageToClients(socket, msg) {
  return ('<li>' + getParsedTime() + ' <strong>' + socket.username + '</strong>: ' + msg + '</li>');
}

//prepare the '___ is typing...' message
function prepareIsTypingToClients(socket) {
  return ('<li><strong>' + socket.username + '</strong> is typing...</li>')
}

