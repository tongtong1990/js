// var socket = io.connect('http://172.19.196.93:9202');
var socket = io.connect('http://172.19.213.51:9200');

function go_to_right_screen(tself_id, tright_id, snake_id, head_coord){
	socket.emit('break_wall_from_left',{self_id:tself_id, target_id:tright_id, snake_id:snake_id, head_location:head_coord});
}

function go_to_left_screen(tself_id, tleft_id, snake_id, head_coord){
	socket.emit('break_wall_from_right',{self_id:tself_id, target_id:tleft_id, snake_id:snake_id, head_location:head_coord});
}

function eat(snake_id, pic_id){
	socket.emit('eat',{snake_id:snake_id, pic_id:pic_id});
}

function send_control_signal(snake_id,head_device,control_signal){
	socket.emit('control_signal',{snake_id:snake_id,target_id:head_device,control_signal:control_signal});
}

function init_send_new_food( newFood ) {
	var new_pic_id = newFood.new_pic_id;
	var pic_src = newFood.new_pic_src;
	socket.emit('broadcast_food',{pic_id:new_pic_id, pic_src:pic_src});
}

function send_dead_id( dead_id) {
	socket.emit('send_dead_id', {dead_id: dead_id});
}
