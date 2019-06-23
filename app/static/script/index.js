$(document).ready(function(){
    // start up the SocketIO connection to the server - the namespace 'test' is also included here if necessary
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/test');
    // this is a callback that triggers when the "my response" event is emitted by the server.
    socket.on('my response', function(msg) {
        $('#log').append('<p>Received: ' + msg.data + '</p>');
    });
    //example of triggering an event on click of a form submit button
    $('form#emit').submit(function(event) {
        socket.emit('my event', {data: $('#emit_data').val()});
        return false;
    });
});