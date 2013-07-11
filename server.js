var io = require('socket.io').listen(9200);
var clients = {}; // sockedid => socket
var users = {}; // user id => socketid
var players = {} // socketid => user id
var numClients = 0;

// assume, there is only one pair to pinch together
var pinch_pair = {};


io.set('log level', 1);
io.sockets.on('connection', function (socket) {
  
  console.log('client ', socket.id);
  clients[socket.id] = socket;
  players[socket.id] = numClients;
  users[numClients] = socket.id;
  numClients++;

  socket.on('conn_left', function (data) {
      pinch_pair['left'] = socket.id;
      console.log('Receive from left');
      if(pinch_pair['left'] != undefined && pinch_pair['right'] != undefined) {
        console.log('We got a pair from left');
        var leftSockID = pinch_pair['left'];
        var rightSockID = pinch_pair['right'];
        clients[leftSockID].emit('conn_left_confirm', {self_id: players[leftSockID], right_id: players[rightSockID]});
        clients[rightSockID].emit('conn_right_confirm', {self_id: players[rightSockID], left_id: players[leftSockID]});
        pinch_pair = {};
      }
  });

  socket.on('conn_right', function (data) {
      pinch_pair['right'] = socket.id;
      console.log('Receive from right');
      if(pinch_pair['left'] != undefined && pinch_pair['right'] != undefined) {
        console.log('We got a pair from left');
        var leftSockID = pinch_pair['left'];
        var rightSockID = pinch_pair['right'];
        clients[rightSockID].emit('conn_right_confirm', {self_id: players[rightSockID], left_id: players[leftSockID]});
        clients[leftSockID].emit('conn_left_confirm', {self_id: players[leftSockID], right_id: players[rightSockID]});
        pinch_pair = {};
      }
  });

  socket.on('break_wall', function (data){
    var self_id = data.self_id;
    var target_id = data.target_id;
    var snake_id = data.snake_id;
    clients[users[target_id]].emit('new_snake', {new_snake_id: snake_id});
    clients[users[snake_id]].emit('header_change', {head_device: target_id});
  });

  socket.on('generate_new_food', function (data){
    var targetId = Math.floor(Math.random() * numClients);
    clients[users[targetId]].emit('generate_new_food');
  });

  socket.on('broadcast_food', function (data){
    socket.broadcast.emit('new_food_generated', {pic_id: data.pic_id, pic_src: data.pic_src});
  });

  socket.on('eat', function(data){
    socket.broadcast.emit('snake_eat', {snake_id: data.snake_id, pic_id: data.pic_id});
  });

  socket.on('disconnect', function(){
    console.log('delete ', socket.id);
    // delete users
    delete users[players[socket.id]];
    // players
    delete players[socket.id];
    // delete socket
    delete clients[socket.id];
    numClients -= 1;
  });
});