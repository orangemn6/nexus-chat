const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const { generateMessage } = require('./utils/message');
const { isRealString } = require('./utils/validation');
const { Users } = require('./utils/users');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const users = new Users();

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

var filter = require('leo-profanity');
app.use(express.static(publicPath));

io.on('connection', (socket) => {
  console.log('New user connected');
  socket.sentmessages = 0
  socket.msgAllowed = true
  socket.on('join', (params, callback) => {
    if (!isRealString(params.username) || !isRealString(params.room)) {
      return callback('Username and room name are required');
    }

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.username, params.room);

    io.to(params.room).emit('updateUserList', users.getUserList(params.room));
    socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat room'));
    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.username} has joined.`));

    callback();
  });

  socket.on('createMessage', (message, callback) => {
    const user = users.getUser(socket.id);
    if (socket.sentmessages > 4) {
      console.log("message blocked due to spam")
      socket.msgAllowed = false
      setTimeout(function(){ socket.msgAllowed = true; }, 2000);
    } else { 
      if (user && isRealString(message.text) && socket.msgAllowed == true) {
        io.to(user.room).emit('newMessage', generateMessage(user.username, filter.clean(message.text)));
        socket.sentmessages += 1;
        setTimeout(function(){ socket.sentmessages -= 1; }, 2000);
      }
    }
    callback('');
  });

  socket.on('disconnect', () => {
    const user = users.removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.username} has left`));
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
