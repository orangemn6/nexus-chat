const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = 8080;


app.get('/', function(req, res) {
    res.render('index.ejs');
});

io.sockets.on('connection', function(socket) {
    socket.on('username', function(username, colorType) {
        socket.color = colorType;
        socket.username = username;
        io.emit('is_online', '🔵 <i>' + socket.username + ' join the chat..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
    })

    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message, socket.color);
    });

});

const server = http.listen(8080, function(req, res){
console.log("LIstening on port");
});
