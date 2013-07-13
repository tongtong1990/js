$(function(){
	socket.on('header_change',function(data){
		var changed_snake_id = data.head_device;
		tetris.change_head(changed_snake_id);
	});

	socket.on('new_snake_from_left', function(data){
		var new_snake_id = data.new_snake_id;
		var head_location = data.head_location;
		
		var snake = {
			snakeid: new_snake_id,
			pos: head_location,
			direction: 0
		};

		tetris.new_snake(snake);
	});

	socket.on('new_snake_from_right', function(data){
		var new_snake_id = data.new_snake_id;
		var head_location = data.head_location;
		
		var snake = {
			snakeid: new_snake_id,
			pos: head_location,
			direction: 2
		};

		tetris.new_snake(snake);

	});

	socket.on('generate_new_food',function(data){
		console.log('generate_new_food');
		var newFood = tetris.generate_target();
		var new_pic_id = newFood.new_pic_id;
		var pic_src = newFood.new_pic_src;
		socket.emit('broadcast_food',{pic_id:new_pic_id, pic_src:pic_src});
	});

	socket.on('record_what_my_snake_eat',function(data){
		console.log('here!!');
		var pic_id = data.pic_id;
		var pic_src = data.pic_src;
		var pname = data.pname;
		var profile_url = data.profile_url;
		if(!my_pic_id.hasOwnProperty(pic_id)){
			//add to the list
			PYMK_pic_id[pic_id] = {pic_src:pic_src, pname:pname, profile_url:profile_url};
		}
	});

	socket.on('snake_eat',function(data){

		// alert('snake ' + data.snake_id + ' ' + data.pic_id);
		var snake_id = data.snake_id;
		var pic_id = data.pic_id;
		//to be added : refresh the status of snake
		var snake_len = tetris.snake_imgs[snake_id].length;
		// alert('snake_len ' + snake_len);
		tetris.snake_imgs[snake_id][snake_len] = pic_id;
		
		var tail_index = tetris.findTailIndex(snake_id);
		var new_tail_index = tail_index + 1;

		var tail = tetris.display_snake[snake_id][tail_index];
		var tail_x = tail.getX();
		var tail_y = tail.getY();
		if( tail != undefined && tail_x > 0 &&  tail_x < tetris.screen_width && tail_y > 0 && tail_y < tetris.screen_height ) {
			var tail_img = tetris.getNewTailPic(pic_id);
			tetris.display_snake[snake_id][new_tail_index]= new Kinetic.Circle({
		        x: tail_x,
		        y: tail_y,
		        radius: tetris.block_width / (2 * tetris.scale) - 2,
		        fillPatternImage: tail_img,
		        stroke: tetris.color_mappings[snake_id % 5],
		        strokeWidth: 3
		      });
		}
	});

	socket.on('new_food_generated',function(data){
		console.log('new image received!');
		var pic_id = data.pic_id;
		var pic_src = data.pic_src;
		//add ( download ) the photo from the src. add it to hidden area
		var new_html_code = "<img id=\"" + pic_id +"\" style=\"display:none\" align=\"baseline\" src=\"" + pic_src + "\"></a>";
		ids[cnt] = pic_id;
		cnt ++;
		document.getElementById("connectionsdata").getElementsByTagName('ul')[0].innerHTML += new_html_code;
	});

	socket.on('coming_control_signal',function(data){
		var snake_id = data.snake_id;
		var coming_control_signal = data.control_signal;
		tetris.handle_coming_control_signal(snake_id,coming_control_signal);
	});

	socket.on('clients_update', function(data){
		var members = data.clients;
		tetris.alive_snakes = [];
    	tetris.dead_snakes = [];
		for (var key in members) {
			if (tetris.display_snake[members[key]] == undefined) {
				tetris.pinch_snake(members[key]);
			}
		}
	});

	socket.on('dead_snake', function(data){
		var snakeid = data.dead_id;
		console.log("listener got dead id: " + snakeid);
		tetris.update_snake_status(parseInt(snakeid));

	});

	$(document).on('swiperight', function(e){
		socket.emit('conn_left',{me:tetris.self_id});
		socket.on('conn_left_confirm', function(data){
			tetris.self_id = data.self_id;
			tetris.right_id = data.right_id;
			alert('Left screen confirm, id is ' + data.self_id);
		});
	});
	$(document).on('swipeleft', function(e){
		socket.emit('conn_right',{me:tetris.self_id});
		socket.on('conn_right_confirm',function(data){
			tetris.self_id = data.self_id;
			tetris.left_id = data.left_id;
			alert('Right screen confirm, id is ' + data.self_id);
		});
	});
});