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

	})

	socket.on('generate_new_food',function(data){
		
		var newFood = tetris.generate_target();
		var new_pic_id = newFood.new_pic_id;
		var pic_src = newFood.new_pic_src;
		socket.emit('broadcast_food',{pic_id:new_pic_id, pic_src:pic_src});
	});

	socket.on('snake_eat',function(data){

		// alert('snake ' + data.snake_id + ' ' + data.pic_id);
		var snake_id = data.snake_id;
		var pic_id = data.pic_id;
		//to be added : refresh the status of snake
		var snake_len = tetris.snake_imgs[snake_id].length;
		// alert('snake_len ' + snake_len);
		tetris.snake_imgs[snake_id][snake_len] = pic_id;
	});

	socket.on('new_food_generated',function(data){
		var pic_id = data.pic_id;
		var pic_src = data.pic_src;
		//add ( download ) the photo from the src. add it to hidden area
		var new_html_code = "<img id=\"" + pic_id +"\" style=\"display:none\" align=\"baseline\" src=\"" + pic_src + "\"></a>";
		ids[cnt] = pic_id;
		cnt ++;
		document.getElementById("connectionsdata").getElementByTag('ul').innerHTML += new_html_code;
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
		console.log("got dead id: " + snakeid);
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