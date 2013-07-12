var io = require('socket.io').listen(9200);
var clients = {}; // sockedid => socket
var users = {}; // user id => socketid
var players = {} // socketid => user id
var success_pinch = {};// user id => socketid
var numClients = 1;

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

        var leftUserID = players[leftSockID];
        var rightUserID = players[rightSockID];

        clients[leftSockID].emit('conn_left_confirm', {self_id: players[leftSockID], right_id: players[rightSockID]});
        clients[rightSockID].emit('conn_right_confirm', {self_id: players[rightSockID], left_id: players[leftSockID]});
        pinch_pair = {};

        if(success_pinch[leftUserID] == undefined)
            success_pinch[leftUserID] = leftSockID;
        if(success_pinch[rightUserID] == undefined)
            success_pinch[rightUserID] = rightSockID;

        var keys = [];
        for(key in success_pinch ) {
            keys.push(key);
        }
        console.log(keys);
        io.sockets.emit('clients_update', {clients: keys});
      }
  });

  socket.on('conn_right', function (data) {
      pinch_pair['right'] = socket.id;
      console.log('Receive from right');
      if(pinch_pair['left'] != undefined && pinch_pair['right'] != undefined) {
        console.log('We got a pair from right');
        var leftSockID = pinch_pair['left'];
        var rightSockID = pinch_pair['right'];
        var leftUserID = players[leftSockID];
        var rightUserID = players[rightSockID];


        clients[rightSockID].emit('conn_right_confirm', {self_id: players[rightSockID], left_id: players[leftSockID]});
        clients[leftSockID].emit('conn_left_confirm', {self_id: players[leftSockID], right_id: players[rightSockID]});
        pinch_pair = {};

        if(success_pinch[leftUserID] == undefined)
            success_pinch[leftUserID] = leftSockID;
        if(success_pinch[rightUserID] == undefined)
            success_pinch[rightUserID] = rightSockID;

        var keys = [];
        for(key in success_pinch ) {
            keys.push(key);
        }
        console.log(keys);
        io.sockets.emit('clients_update', {clients: keys});
      }
  });

  socket.on('break_wall_from_left', function (data){
    
    var self_id = data.self_id;
    var target_id = data.target_id;
    var snake_id = data.snake_id;
    var head_location = data.head_location;

    clients[users[target_id]].emit('new_snake_from_left', {new_snake_id: snake_id, head_location: head_location});
    clients[users[snake_id]].emit('header_change', {head_device: target_id});
  });

  socket.on('break_wall_from_right', function (data){
    var self_id = data.self_id;
    var target_id = data.target_id;
    var snake_id = data.snake_id;
    var head_location = data.head_location;
    clients[users[target_id]].emit('new_snake_from_right', {new_snake_id: snake_id, head_location: head_location});
    clients[users[snake_id]].emit('header_change', {head_device: target_id});
  });


  socket.on('generate_new_food', function (data){
    var targetId = Math.floor(Math.random() * numClients) + 1; // we start from 1
    console.log('Let ', targetId, ' generates new food');
    clients[users[targetId]].emit('generate_new_food');
  });

  socket.on('broadcast_food', function (data){
    console.log('start to broadcast food ', data.pic_id, ' | ', data.pic_src);
    socket.broadcast.emit('new_food_generated', {pic_id: data.pic_id, pic_src: data.pic_src});
  });

  socket.on('eat', function(data){
    socket.broadcast.emit('snake_eat', {snake_id: data.snake_id, pic_id: data.pic_id});
  });

  socket.on('disconnect', function(){
    console.log('delete ', socket.id);
    // delete users
    delete users[players[socket.id]];

    // delete from successful pinches
    if (success_pinch[players[socket.id]] != undefined )
      delete success_pinch[players[socket.id]];

    // players
    delete players[socket.id];
    // delete socket
    delete clients[socket.id];


    
  });
});
