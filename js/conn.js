var socket = io.connect('http://172.19.196.93:9200');
var left_cnt = 0, right_cnt = 0;
function go_to_right_screen(tself_id, tright_id, snake_id, head_coord){
	socket.emit('break_wall_from_left',{self_id:tself_id, target_id:tright_id, snake_id:snake_id, head_location:head_coord});
}
function go_to_left_screen(tself_id, tleft_id, snake_id, head_coord){
	socket.emit('break_wall_from_right',{self_id:tself_id, target_id:tleft_id, snake_id:snake_id, head_location:head_coord});
}
function eat(snake_id, pic_id){
	socket.emit('eat',{snake_id:snake_id, pic_id:pic_id});
}
