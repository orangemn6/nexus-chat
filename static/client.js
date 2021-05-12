/*
 * Using $ as jQuery - catch html items in order to add attributes / read their values
 * $('#abc') - catch html item by id=abc
 * $('.abc') - catch html item by class=abc
*/

/* 
 * $(function() {...}) - SHORT FOR 'The Document Ready Event':
 * $(document).ready(function() { ... });
 * 
 * This is to prevent any jQuery code from running before the document is finished loading (is ready).
 * From: https://www.w3schools.com/jquery/jquery_syntax.asp
 */

$(function () {
    var socket = io();

    // -------------------------------------------------
    //ask the user for their name:
    (function () {
        let username = prompt("Please enter your username", "El Professor");
        if (!username) { username = "Anonymous_User"; }

        //save username also on the client's socket.
        socket.username = username;

        //Let the socket at the server "know" the value of the username. Each client will have their own username.
        socket.emit('username', username);

        //Let the user see their nickname:
        $("#logged_as_info").html(`<h2>Logged as: <strong>` + username + `</strong></h2>`);
    })();

    // -------------------------------------------------
    //SOCKET.ON FUNCTIONS:
    socket.on('userConnected', (usernameThatJustConnected) => { //() => {} is a nameless function    
        const username_no_white_space = removeWhiteSpaceFromUsername(usernameThatJustConnected)
        const notification_id = username_no_white_space + '_joined_the_chat';
        const join_log = `<li id=` + notification_id + `><h3>❣️ <strong>` + usernameThatJustConnected + `</strong> has joined the chat!</h3></li>`;

        //update the logs board:
        $('#logs_board').append(join_log);

        //after 10 seconds, remove the notification of the logging:
        setTimeout((id) => {
            $('#logs_board').children('#' + id).remove();
        }, 10000, notification_id);

        //add to username_is_typing_board the user's div
        $('#username_is_typing_board').append('<div id=' + username_no_white_space + 'isTypingId></div>');
    });

    socket.on('userDisconnected', (usernameThatJustDisonnected) => { //() => {} is a nameless function    
        const username_no_white_space = removeWhiteSpaceFromUsername(usernameThatJustDisonnected)
        const notification_id = username_no_white_space + '_left_the_chat';
        const left_log = `<li id=` + notification_id + `><h3>🙃 <strong>` + usernameThatJustDisonnected + `</strong> has left the chat!</h3></li>`;

        //update the logs board:
        $('#logs_board').append(left_log);

        //after 10 seconds, remove the notification:
        setTimeout((id) => {
            $('#logs_board').children('#' + id).remove();
        }, 10000, notification_id);

        //remove from username_is_typing_board the user's div
        $('#username_is_typing_board').children('#' + username_no_white_space + 'isTypingId').remove();
    });

    socket.on('updateNumUsersOnline', (num_users_online) => {
        $('#num_users_online_number').html('<h3>' + num_users_online + ' Users Online</h3>');
    });

    //on socket event of "addChatMessage(server->clients)", do the following: (add the value to the messages list)
    socket.on('addChatMessage(server->clients)', function (usernameAndMsg) {
        let username_adding_msg = usernameAndMsg[0];
        let msg = usernameAndMsg[1];
        //set different backgroud for the user that sent the message:
        let bkg = (username_adding_msg === socket.username) ? "#ccebff" : "#ffffff";
        let msg_with_style = `<div style="background: ` + bkg + `">` + msg + `</div>`;
        $('#messages').append(msg_with_style);
        window.scrollTo(0, document.body.scrollHeight);
    });


    // -------------------------------------------------
    //add to our form a submit attribue (with the following function):
    // sending a message to the chat:
    $('form').submit(function () {
        //verify that the message is not empty / contains only white spaces:
        let user_message = ($('#message_form_input').val()).replace(/\s/g, "");
        if (user_message === "") {
            return false; //return false = don't refresh page.
        }

        //emit a message that will go to the server
        socket.emit('addChatMessage(client->server)', $('#message_form_input').val());

        //make message box blank again:
        $('#message_form_input').val('');
        return false; //return false = don't refresh page.
    });


    // -------------------------------------------------
    // IS TYPING FEATURE:
    // send to the server 'is typing...' notification
    var typingTimer; //setTimeOut() identifier;
    var doneTypingInterval = 1000;

    //notify server on keydown
    $('#message_form_input').on("keydown", function (e) {
        //log 'is typing...' only if the key is printable
        if (isPrintableKey(e)) socket.emit('userIsTypingKeyDown(client->server)', undefined);
    });

    //notify server on keyup
    $('#message_form_input').on("keyup", function (e) {
        if (isPrintableKey(e)) socket.emit('userIsTypingKeyUp(client->server)', undefined);
    });

    //handle keydown by some user
    socket.on('userIsTypingKeyDown(server->clients)', function (usernameAndIsTyping) {
        const usernameTyping_no_white_space = removeWhiteSpaceFromUsername(usernameAndIsTyping[0]);
        const isTypingMessage = usernameAndIsTyping[1];

        //new pressing of a key, don't want to remove is_typing notification from previous keyup event.
        clearTimeout(typingTimer);

        //check if the username that is typing has a li in the board of is_typing. if not, add one.
        if (!$('#username_is_typing_board').children('#' + usernameTyping_no_white_space + 'isTypingId').length) {
            //add a is_typing div to the is_typing board for this user:
            $('#username_is_typing_board').append('<div id=' + usernameTyping_no_white_space + 'isTypingId></div>');
        }

        //if this is the first time typing in the current typing session, edit the notification:
        $('#username_is_typing_board').children('#' + usernameTyping_no_white_space + 'isTypingId').html(isTypingMessage);
    });

    //handle keyup by some user
    socket.on('userIsTypingKeyUp(server->clients)', function (usernameTyping) {
        const usernameTyping_no_white_space = removeWhiteSpaceFromUsername(usernameTyping);
        //start count down (again?) to disappear the is_typing notification.
        typingTimer = setTimeout(() => {
            $('#username_is_typing_board').children('#' + usernameTyping_no_white_space + 'isTypingId').html('');
        }, doneTypingInterval);
    });

});

//remove white spaces from username FOR THE ID, if there's any
function removeWhiteSpaceFromUsername(username) {
    return username.replace(/\s/g, "")
}

function isPrintableKey(key_event) {
    if (key_event.key.length === 1) return true;
    return false;
}
