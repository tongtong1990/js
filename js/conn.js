var socket = io.connect('http://localhost:9200');
// var socket = io.connect('http://localhost:9200');
function go_to_right_screen(tself_id, tright_id, snake_id, head_coord){
	socket.emit('break_wall_from_left',{self_id:tself_id, target_id:tright_id, snake_id:snake_id, head_location:head_coord});
}
function go_to_left_screen(tself_id, tleft_id, snake_id, head_coord){
	socket.emit('break_wall_from_right',{self_id:tself_id, target_id:tleft_id, snake_id:snake_id, head_location:head_coord});
}
function eat(snake_id, pic_id){
	socket.emit('eat',{snake_id:snake_id, pic_id:pic_id});
}

function init_send_new_food( newFood ) {
	var new_pic_id = newFood.new_pic_id;
	var pic_src = newFood.new_pic_src;
	socket.emit('broadcast_food',{pic_id:new_pic_id, pic_src:pic_src});
}