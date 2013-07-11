			var socket = io.connect('http://172.19.196.93:9200');
			var left_cnt = 0, right_cnt = 0;
			function go_to_right_screen(tself_id, tright_id, snake_id){
				socket.emit('break_wall',{self_id:tself_id, target_id:tright_id, snake_id:snake_id});
			}
			function go_to_left_screen(tself_id, tleft_id, snake_id){
				socket.emit('break_wall',{self_id:tself_id, target_id:tleft_id, snake_id:snake_id});
			}
			function eat(snake_id, pic_id){
				socket.emit('eat',{snake_id:snake_id, pic_id:pic_id});
			}
			$(function(){
				socket.on('header_change',function(data){
					var changed_snake_id = data.head_device;

					//to be added : change the header

				});

				socket.on('new_snake', function(data){
					var new_snake_id = data.new_snake_id;

					//to be added : add a new snake in this screen
					//to be added : set interval

				});

				socket.on('generate_new_food',function(data){
					//to be added : choose a position to generate food
					var new_pic_id = Math.floor(Math.random()*cnt);
					var pic_obj = document.getElementById(new_pic_id);
					var pic_src = pic_obj.src;
					socket.emit('broadcast_food',{pic_id:new_pic_id, pic_src:pic_src});
				});

				socket.on('snake_eat',function(data){
					var snake_id = data.snake_id;
					var pic_id = data.pic_id;
					//to be added : refresh the status of snake
				});

				socket.on('new_food_generated',function(data){
					var pic_id = data.pic_id;
					var pic_src = data.pic_src;
					//add ( download ) the photo from the src. add it to hidden area
					var new_html_code = "<img id=\"" + pic_id +"\" style=\"display:none\" align=\"baseline\" src=\"" + pic_src + "\"></a>";
					ids[cnt] = pic_id;
					cnt ++;
					document.getElementById("connectionsdata").innerHTML += new_html_code;
				});

				$(document).on('swiperight', function(e){
					socket.emit('conn_left',{me:tetris.self_id});
					socket.on('conn_left_confirm', function(data){
						tetris.self_id = data.self_id;
						tetris.right_id = data.right_id;
						alert('Left screen confirm');
					});
				});
				$(document).on('swipeleft', function(e){
					socket.emit('conn_right',{me:tetris.self_id});
					socket.on('conn_right_confirm',function(data){
						tetris.self_id = data.self_id;
						tetris.left_id = data.left_id;
						alert('Right screen confirm');
					});
				})
			});