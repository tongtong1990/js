var tetris = {

  // html elements
  page: null,
  page_oauth: null,
  page_home: null,
  page_game: null,
  game_col: null,
  game_zone: null,
  messages: null,
  overlay: null,
  bt_left: null,
  bt_right: null,

  // display (kinetic)
  stage: null,
  layer_block: null,
  layer_snake: null,
  block_width: 0,
  block_width_standard: .1,
  display_line: [],
  display_block: [],
  target: null,
  target_id: null,
//  display_snake: [],

  // Modified display_snake and snake_dirs
  display_snake: [],
  snake_dirs: [],
  snake_imgs: [], // Images of each snake
  head_dir: [],
  snake_coming: [], // size: 2 * (rows - 1), value: snakeid
  snake_coming_index: [], 

  isLeaving: [],
  timeout_func: [],
  start_index: [],
  snake_head: null,
  // alive snake ids
  alive_snakes: [],
  dead_snakes: [],

  image_width: 80, // Image width from LinkedIn
  scale: 0, // Scale for image

  // game infos
  state: null,
  board: [],
  rows: 14,
  cols: 10,
  screen_width: 0,
  screen_height: 0,
  init_len: 1,
  // -1: target, 0: empty
  map: [],

  initial_speed: 1000,

  // touch/finger controls
  last_pos_x: 0,
  last_pos_y: 0,
  moving: false,
  time_touch_down: 0,
  finger_lock: false,

  // id, left and right
  self_id: 1,
  left_id: undefined,
  right_id: undefined,
  color_mappings: { 0: 'white', 1: 'blue', 2: 'red', 3: 'green', 4: 'yellow', 5: 'gray' },
  color_variations: 6,
  self_color: null,

  init: function () {
    tetris.page = document.getElementById('page');
    tetris.page_oauth = document.getElementById('page_oauth');
    tetris.page_home = document.getElementById('page_home');
    tetris.page_game = document.getElementById('page_game');
    tetris.game_col = document.getElementById('game_col');
    tetris.game_zone = document.getElementById('game_zone');
    tetris.overlay = document.getElementById('overlay');

    document.getElementById('bt_left').addEventListener('click', function() {
      tetris.move_left();
    });  
    document.getElementById('bt_right').addEventListener('click', function() {
      tetris.move_right();
    });


    // $('#bt_left').click(function() {alert('');tetris.move_left()});

    tetris.block_width = tetris.page.offsetWidth * tetris.block_width_standard;
    // Calculate the board size of the game
    tetris.screen_width = tetris.block_width * tetris.cols;
    tetris.screen_height = tetris.block_width * (tetris.rows - 1);
    // Calcualte scale
    tetris.scale = tetris.block_width / tetris.image_width;

    // Initialize stage
    tetris.stage = new Kinetic.Stage({
      container: 'game_zone',
      width: tetris.cols * tetris.block_width,
      height: tetris.rows * tetris.block_width
    });

    // Blocks: background
    // tetris.layer_block = new Kinetic.Layer();
    tetris.layer_snake = new Kinetic.Layer();

    for (var i = 0; i < tetris.rows - 1; i++) {
      tetris.display_block[i] = [];
      tetris.map[i] = [];
      for (var j = 0; j < tetris.cols; j++) {
        // Black square
        tetris.display_block[i][j] = new Kinetic.Rect({
          x: j * tetris.block_width,
          y: i * tetris.block_width,
          width: tetris.block_width,
          height: tetris.block_width,
          fill: 'black'
        });
        tetris.layer_snake.add(tetris.display_block[i][j]);

        tetris.map[i][j] = 0; // No snake on it.
      };
    };

    // tetris.stage.add(tetris.layer_block);
    tetris.stage.add(tetris.layer_snake);

    // tetris.layer_block.draw();
    tetris.layer_snake.draw();

    tetris.watch_keys();
    tetris.watch_touch();

    tetris.resize();
    window.addEventListener('resize', function() {
      tetris.resize();
    });

    document.getElementById('bt_new_game').addEventListener('click', function(e) {
      e.preventDefault();
      tetris.show_game();
    });

    tetris.show_home();
  },

  show_home: function () {
    tetris.page_oauth.style.display = 'none';
    tetris.page_home.style.display = 'block';
    tetris.page_game.style.display = 'none';
    tetris.overlay.style.display = 'none';
    tetris.state = 'home';
  },

  show_game: function () {
    tetris.page_oauth.style.display = 'none';
    tetris.page_home.style.display = 'none';
    tetris.page_game.style.display = 'block';
    tetris.overlay.style.display = 'none';
    tetris.state = 'game';
    tetris.init_game();
  },


  pinch_snake: function(snakeid) {
    tetris.display_snake[snakeid] = [];
    tetris.snake_dirs[snakeid] = [];
    tetris.snake_imgs[snakeid] = [];
    tetris.alive_snakes.push(parseInt(snakeid));
  },


  new_snake: function(snake) {
    tetris.isLeaving[snake.snakeid] = false;
    tetris.start_index[snake.snakeid] = 0;
    if(snake.direction == 0){
      tetris.display_snake[snake.snakeid][0] = new Kinetic.Circle({
          x: tetris.block_width / 2,
          y: snake.pos,
          radius: tetris.block_width / (2 * tetris.scale) - 2,
          stroke: tetris.color_mappings[snake.snakeid % tetris.color_variations],
          strokeWidth: 3
      });
      tetris.layer_snake.add(tetris.display_snake[snake.snakeid][0]);
      tetris.snake_dirs[snake.snakeid][0] = 0;
      tetris.map[Math.floor(snake.pos/tetris.block_width)][0] = snake.snakeid;
      tetris.head_dir[snake.snakeid] = 0;
    }else{
      tetris.display_snake[snake.snakeid][0] = new Kinetic.Circle({
          x: tetris.block_width * tetris.cols - tetris.block_width / 2,
          y: snake.pos,
          radius: tetris.block_width / (2 * tetris.scale) - 2,
          stroke: tetris.color_mappings[snake.snakeid % tetris.color_variations],
          strokeWidth: 3
      });
      tetris.layer_snake.add(tetris.display_snake[snake.snakeid][0]);
      tetris.snake_dirs[snake.snakeid][0] = 2;
      tetris.map[Math.floor(snake.pos/tetris.block_width)][tetris.cols-1] = snake.snakeid;
      tetris.head_dir[snake.snakeid] = 2;
    }
    tetris.display_snake[snake.snakeid][0].setFill(tetris.color_mappings[snake.snakeid % tetris.color_variations]);
    tetris.display_snake[snake.snakeid][0].setScale(tetris.scale);

    // Update snake_coming to tell machine there is a snake coming from this block.
    if (tetris.snake_imgs[snake.snakeid].length > 0) {
      if (snake.direction == 0) { // Snake comes from left
        tetris.snake_coming[Math.floor(snake.pos / tetris.block_width)] = snake.snakeid;
        tetris.snake_coming_index[Math.floor(snake.pos / tetris.block_width)] = 0;
      } else { // Snake comes from right
        tetris.snake_coming[Math.floor(snake.pos / tetris.block_width) + tetris.rows - 1] = snake.snakeid;
        tetris.snake_coming_index[Math.floor(snake.pos / tetris.block_width) + tetris.rows - 1] = 0;
      }
    }

    if(tetris.timeout_func[snake.snakeid] == undefined){
      setTimeout(function(){
        tetris.snake_move(snake.snakeid);
      },200);
    }
  },

  init_snake: function () {
    tetris.display_snake[tetris.self_id] = [];
    tetris.snake_dirs[tetris.self_id] = [];
    tetris.snake_imgs[tetris.self_id] = [];
    tetris.isLeaving[tetris.self_id] = false;

    tetris.start_index[tetris.self_id] = 0;
    tetris.snake_head = tetris.self_id;

    // single player
    if(tetris.alive_snakes.length == 0)
      tetris.alive_snakes.push(tetris.self_id);
    // Initialize the snake
    for (var j = 0; j < tetris.init_len; j++) {
      tetris.display_snake[tetris.self_id][j] = new Kinetic.Circle({
        x: (tetris.init_len - j) * tetris.block_width + tetris.block_width / 2,
        y: tetris.block_width / 2,
        radius: tetris.block_width / (2 * tetris.scale) - 2,
        stroke: tetris.color_mappings[tetris.self_id % tetris.color_variations],
        strokeWidth: 3
      });
      tetris.layer_snake.add(tetris.display_snake[tetris.self_id][j]);
      // Direction of this part of the snake
      tetris.snake_dirs[tetris.self_id][j] = 0;
      // Change map
      tetris.map[0][tetris.init_len - j] = tetris.self_id;
    }
    tetris.head_dir[tetris.self_id] = 0;

    // Initialize images
    for (var i = 0; i < tetris.init_len; i++) {
      if (i != 0) {
        var image = document.getElementById(ids[i]);
        tetris.display_snake[tetris.self_id][i].setFillPatternImage(image);
        // Update snake_imgs
        tetris.snake_imgs[tetris.self_id][i] = ids[i];
        tetris.display_snake[tetris.self_id][i].setFillPatternOffset(- tetris.block_width / (2 * tetris.scale), tetris.block_width / (2 * tetris.scale));
      } else {
        tetris.display_snake[tetris.self_id][i].setFill(tetris.color_mappings[tetris.self_id % tetris.color_variations]);
      }

      tetris.display_snake[tetris.self_id][i].setScale(tetris.scale);
    }
  },

  // assuming input id is an integer
  update_snake_status: function(dead_snake_id) {
    var index = tetris.alive_snakes.indexOf(dead_snake_id);
    // dead snake is not removed
    if(index >= 0) {
      // remove from alive_snakes
      tetris.alive_snakes.splice(index, 1);
      // add to dead_snakes
      tetris.dead_snakes.push(dead_snake_id);
      kill_snake(dead_snake_id);
      console.log(dead_snake_id + " is dead");
    }

    if(tetris.alive_snakes.length == 0) {
      tetris.game_over(dead_snake_id == tetris.self_id);
    }

  },



  kill_snake: function(snakeid) {
    // update snake status
    
    var i, j, element_id, element, index;
    alert(tetris.self_id + " killing " + snakeid);
    send_dead_id(snakeid);
    tetris.update_snake_status(snakeid);

    // clean map for snake id
    for (i = 0; i < tetris.rows - 1; i++) {
      for (j = 0; j < tetris.cols; j++) {
        if (tetris.map[i][j] == snakeid) {
          tetris.map[i][j] = 0;
        }
      }
    }
    
    // remove from layer
    for (i = 0; i < tetris.display_snake[snakeid].length; i++) {
      element_id = tetris.display_snake[snakeid][i]._id;
      for (j = 0, index = 0; j < tetris.layer_snake.children.length; j++, index++) {
        if(element_id == tetris.layer_snake.children[index]._id) {
          element = tetris.layer_snake.children.splice(index, 1);
          index--;
        }
      }
    }

    // clean display snake
    tetris.display_snake.splice(tetris.display_snake.indexOf(snakeid), 1);

  },



  init_game: function () {
    tetris.state = 'game';
    tetris.clear_board();
    tetris.init_snake();
    var newFood = tetris.generate_target();
    //tetris.layer_snake.draw();
//    if( newFood != undefined)
//        init_send_new_food(newFood);

    setTimeout(function () {
      // hide the address bar
      window.scrollTo(0, 1);
      tetris.snake_move(tetris.self_id);
    }, 0);
  },

  count_empty_blanks: function () {
    var cnt = 0;
    for(var i=0; i< tetris.rows-1; i++) {
      for(var j=0; j<tetris.cols; j++) {
        if(tetris.map[i][j] == 0)
          cnt ++;
      }
    }
    return cnt;
  },

  generate_target: function () {
    // Generate a random number
    console.log(Date.now() + " go into generate target");
    var rand = Math.floor(Math.random() * cnt);
    // Get image
    tetris.target_id = ids[rand];
    var image = document.getElementById(ids[rand]);


    // Generate target
    var empty_num = tetris.count_empty_blanks();
    var target_index = Math.floor(Math.random() * empty_num);
    var index_cnt = 0;
    for (var i = 0; i < tetris.rows - 1; i++) {
      for (var j = 0; j < tetris.cols; j++) {
        if (tetris.map[i][j] == 0) {
          if (index_cnt == target_index) {
            // Generate target here
            tetris.target = new Kinetic.Circle({
              x: j * tetris.block_width + tetris.block_width / 2,
              y: i * tetris.block_width + tetris.block_width / 2,
              radius: tetris.block_width / (2 * tetris.scale) - 2,
              fillPatternImage: image,
              stroke: 'purple',
              strokeWidth: 3
            });
            tetris.target.setFillPatternOffset(- tetris.block_width / (2 * tetris.scale), tetris.block_width / (2 * tetris.scale));
            tetris.target.setScale(tetris.scale);
            // Add target
            tetris.layer_snake.add(tetris.target);
            // Update map
            tetris.map[i][j] = -1;

            newFood = {new_pic_id: ids[rand], new_pic_src: image.src};
            return newFood;
          } else {
            index_cnt++;
          }
        }
      }
    }
    return;
  },

  snake_eat: function (snakeid, tail_x, tail_y, tail_dir) {
    // Get the target
    var tail_index = tetris.display_snake[snakeid].length;
    tetris.display_snake[snakeid][tail_index] = tetris.target;
    tetris.display_snake[snakeid][tail_index].setX(tail_x);
    tetris.display_snake[snakeid][tail_index].setY(tail_y);
    tetris.display_snake[snakeid][tail_index].setStroke(tetris.color_mappings[snakeid % tetris.color_variations]);

    // Remove target
    tetris.target = null;

    tetris.layer_snake.add(tetris.display_snake[snakeid][tail_index]);
    tetris.snake_dirs[snakeid][tail_index] = tail_dir;

    tetris.map[Math.floor(tail_y / tetris.block_width)][Math.floor(tail_x / tetris.block_width)] = snakeid;

    // Save image id
    tetris.snake_imgs[snakeid][tail_index - 1] = tetris.target_id;
    // Broadcast the image id to others
    eat(snakeid, tetris.target_id);

    var period = 2000;
    var animCount = 70;
    var anim = new Kinetic.Animation(function(frame) {
      var scale = Math.sin(frame.time * 2 * Math.PI / period) + 0.001;
      tetris.display_snake[snakeid][0].setScale(scale);
      animCount --;
      if(animCount == 0) {
        anim.stop();
        tetris.display_snake[snakeid][0].setScale(tetris.scale);
      }
    }, tetris.layer_snake);
    anim.start();
    // Generate another target
    tetris.generate_target();
  },

  snake_move: function (snakeid) {
    var success_move = tetris.update_block(snakeid);
    if(success_move) {
      tetris.timeout_func[snakeid] = setTimeout(function () {

        tetris.snake_move(snakeid);
      }, tetris.initial_speed);
    }
  },

  test_wallbreak: function () {

  },

  clear_board: function () {
    if (tetris.target != null) {
      // Remove target (specifically for game over logic)
      tetris.target.hide();
      tetris.target = null;
    }
    for (var i = 0; i < tetris.rows - 1; i++) {
      for (var j = 0; j < tetris.cols; j++) {
        tetris.map[i][j] = 0;
      }
    }
  },

  pause_game: function () {
    tetris.state = 'pause';
    clearTimeout(tetris.fall_timeout);
    var html = '<h2>Game paused</h2>';
    html += '<a class="button" id="bt_resume">Resume</a>';
    html += '<a class="button" id="bt_play_again">New game</a>';
    html += '<a class="button" id="bt_main_menu">Main menu</a>';
    tetris.overlay.innerHTML = html;
    tetris.overlay.style.display = 'block';

    document.getElementById('bt_resume').addEventListener('click', function() {
      tetris.resume_game();
    });
    document.getElementById('bt_play_again').addEventListener('click', function() {
      tetris.init_game();
    });
    document.getElementById('bt_main_menu').addEventListener('click', function() {
      tetris.show_home();
    });
  },

  resume_game: function () {
    tetris.state = 'game';
    tetris.fall_block();
    tetris.overlay.style.display = 'none';
  },

  game_over: function (win) {
    tetris.state = 'game_over';

    var html = '<h2>Game Over</h2>';
    if(win)
      html += '<h3>Win</h3>';
    else
      html += '<h3>Lose</h3>';
    html += '<a class="button" id="bt_play_again">Play again</a>';
    html += '<a class="button" id="bt_main_menu">Main menu</a>';
    tetris.overlay.innerHTML = html;
    tetris.overlay.style.display = 'block';

    document.getElementById('bt_play_again').addEventListener('click', function() {
      tetris.overlay.style.display = 'none';
      tetris.init_game();
    });
    document.getElementById('bt_main_menu').addEventListener('click', function() {
      tetris.show_home();
    });
  },

  next_position: function(direction, snakeid) {
    var position;
    var x_position = tetris.display_snake[snakeid][0].getAbsolutePosition().x;
    var y_position = tetris.display_snake[snakeid][0].getAbsolutePosition().y;
    // going to right
    if(direction == 0)
      position = tetris.map_position(x_position + tetris.block_width, y_position);
    else if (direction == 1)  // going down
      position = tetris.map_position(x_position, y_position + tetris.block_width);
    else if (direction == 2)  // going left
      position = tetris.map_position(x_position - tetris.block_width, y_position);
    else  // going top
      position = tetris.map_position(x_position, y_position - tetris.block_width); 
    return tetris.coordinate_info(position[0], position[1]);
  },

  map_position: function(x, y) {
    var position = new Array();
    position.push(Math.floor(x / tetris.block_width));
    position.push(Math.floor(y / tetris.block_width));
    return position;
  },

  // -2: edge, -1: target, 0: empty, otherwise: snakeid
  coordinate_info: function(x_index, y_index) {
    // hitting edge
    if(x_index < 0 || y_index < 0 || x_index >= tetris.cols || y_index >= tetris.rows - 1)
      return -2;
    // on map
    return tetris.map[y_index][x_index];
  },

  update_block: function (snakeid) {
    var direction = tetris.snake_dirs[snakeid][0];
    var i;
    var next_position = tetris.next_position(direction, snakeid);
    // hitting edge
    if(next_position == -2) {
      if ( tetris.right_id != undefined && direction == 0) {
        if(tetris.isLeaving[snakeid] == false){
            tetris.isLeaving[snakeid] = true;
            tetris.start_index[snakeid] = 0;
            go_to_right_screen(snakeid, tetris.right_id, snakeid, tetris.display_snake[snakeid][0].getAbsolutePosition().y);
          }
        }
      // start to break into the left device
      else if ( tetris.left_id != undefined && direction == 2) {
          if(tetris.isLeaving[snakeid] == false){
            tetris.isLeaving[snakeid] = true;
            tetris.start_index[snakeid] = 0;
            go_to_left_screen(snakeid, tetris.left_id, snakeid, tetris.display_snake[snakeid][0].getAbsolutePosition().y);
          }
       }
      // this snake is dead
      else {
        tetris.kill_snake(snakeid);
        return false;
      }
    } else if(next_position > 0) {
      // hitting yourself
      if(next_position == snakeid) {
        alert(snakeid + " hit itself");
        tetris.kill_snake(snakeid);
        return false;  
      // this snake eats the other snake
      } else if(tetris.display_snake[snakeid].length > tetris.display_snake[next_position].length) {
        alert(snakeid + " eats " + next_position);
        tetris.kill_snake(next_position);
        return false;
      } else {
        alert(next_position + " eats " + snakeid);
        tetris.kill_snake(snakeid);
        return true;
      }
    }

    // Yingchao test purpose
    // for(i = 1 ; i < tetris.display_snake[snakeid].length; i ++) {
    //   tetris.display_snake[snakeid][i].rotate(30);
    // }

    // Check whether the snake can eat something
    var tail_index = tetris.display_snake[snakeid].length - 1;
    var tail_x = tetris.display_snake[snakeid][tail_index].getAbsolutePosition().x;
    var tail_y = tetris.display_snake[snakeid][tail_index].getAbsolutePosition().y;
    var tail_dir = tetris.snake_dirs[snakeid][tail_index];

    // Update snake position
    for (var i = tetris.display_snake[snakeid].length - 1; i >= 0; i--) {

      var curX = tetris.display_snake[snakeid][i].getAbsolutePosition().x;
      var curY = tetris.display_snake[snakeid][i].getAbsolutePosition().y;

      if (i == 0) {
        if (tetris.snake_dirs[snakeid][i] == 0) {
          tetris.display_snake[snakeid][i].setX(curX + tetris.block_width);
        } else if (tetris.snake_dirs[snakeid][i] == 1) {
          tetris.display_snake[snakeid][i].setY(curY + tetris.block_width);
        } else if (tetris.snake_dirs[snakeid][i] == 2) {
          tetris.display_snake[snakeid][i].setX(curX - tetris.block_width);
        } else if (tetris.snake_dirs[snakeid][i] == 3) {
          tetris.display_snake[snakeid][i].setY(curY - tetris.block_width);
        }

        tetris.snake_dirs[snakeid][i] = tetris.head_dir[snakeid];

        curX = tetris.display_snake[snakeid][i].getAbsolutePosition().x;
        curY = tetris.display_snake[snakeid][i].getAbsolutePosition().y;

        if (tetris.map[Math.floor(curY / tetris.block_width)][Math.floor(curX / tetris.block_width)] == -1) {
          // Eat target
          tetris.snake_eat(snakeid, tail_x, tail_y, tail_dir);
        }

        if (tetris.map[Math.floor(curY / tetris.block_width)][Math.floor(curX / tetris.block_width)] != undefined) {
          tetris.map[Math.floor(curY / tetris.block_width)][Math.floor(curX / tetris.block_width)] = snakeid;
        }

      } else {
        var next_x = tetris.display_snake[snakeid][i - 1].getAbsolutePosition().x;
        var next_y = tetris.display_snake[snakeid][i - 1].getAbsolutePosition().y;

        tetris.display_snake[snakeid][i].setX(next_x);
        tetris.display_snake[snakeid][i].setY(next_y);

        tetris.snake_dirs[snakeid][i] = tetris.snake_dirs[snakeid][i - 1];
      }

      // Update map
      if (i == tetris.display_snake[snakeid].length - 1 && tetris.map[Math.floor(curY / tetris.block_width)][Math.floor(curX / tetris.block_width)] != undefined) // snake tail
        tetris.map[Math.floor(curY / tetris.block_width)][Math.floor(curX / tetris.block_width)] = 0;
    }

    // Check whether there are snakes coming
    for (var key in tetris.snake_coming) {
      if (tetris.snake_coming[key] != undefined && tetris.snake_coming[key] == snakeid) {
        // Snake id: tetris.snake_coming[key], Snake index: tetris.snake_coming_index[key]
        var i = tetris.snake_coming[key]; // snake id
        var j = tetris.snake_coming_index[key]; // snake index
        var coming_x;
        if (Math.floor(key / (tetris.rows - 1)) == 0) {
          coming_x = tetris.block_width / 2;
          tetris.map[key % (tetris.rows - 1)][0] = i;
        } else {
          coming_x = tetris.cols * tetris.block_width - tetris.block_width / 2;
          tetris.map[key % (tetris.rows - 1)][tetris.cols - 1] = i;
        }
        var coming_y = (key % (tetris.rows - 1)) * tetris.block_width + tetris.block_width / 2;
        var coming_img = document.getElementById(tetris.snake_imgs[i][j]);

        if (tetris.display_snake[i][j + 1] == undefined) { // If not existed
          tetris.display_snake[i][j + 1] = new Kinetic.Circle({
            x: coming_x,
            y: coming_y,
            radius: tetris.block_width / (2 * tetris.scale) - 2,
            fillPatternImage: coming_img,
            stroke: tetris.color_mappings[i % tetris.color_variations],
            strokeWidth: 3
          });
          tetris.display_snake[i][j + 1].setFillPatternOffset(- tetris.block_width / (2 * tetris.scale), tetris.block_width / (2 * tetris.scale));
          tetris.display_snake[i][j + 1].setScale(tetris.scale);
          tetris.layer_snake.add(tetris.display_snake[i][j + 1]);
        } else { // If existed
          tetris.display_snake[i][j + 1].setX(coming_x);
          tetris.display_snake[i][j + 1].setY(coming_y);
        }
        tetris.snake_dirs[i][j + 1] = tetris.snake_dirs[i][j];

        // Increase index
        tetris.snake_coming_index[key]++;
        if (tetris.snake_coming_index[key] >= tetris.snake_imgs[i].length) {
          tetris.snake_coming[key] = undefined;
          tetris.snake_coming_index[key] = undefined;
        }
      }
    }

    tetris.show_block(snakeid);

    // if(tetris.isLeaving[snakeid] == true){
    //   tetris.start_index[snakeid] ++;
    //   if(tetris.start_index[snakeid] == tetris.display_snake[snakeid].length){
    //     tetris.remove_snake_on_this_screen(snakeid);
    //   }
    // }

    return true;
  },

  show_block: function (snakeid) {
    // for (var i = tetris.start_index[snakeid]; i < tetris.display_snake[snakeid].length; i++) {
    //   tetris.display_snake[snakeid][i].show();
    // }
    tetris.layer_snake.draw();
  },

  // remove_snake_on_this_screen: function(snakeid) {
  //   //clearTimeout(tetris.timeout_func[snakeid]);
  // },

  change_head: function(head_device) {
    tetris.snake_head = head_device;
  },

  message: function (texte) {
    tetris.messages.innerHTML = texte;
    setTimeout(function(){
      tetris.messages.innerHTML = '';
    }, 200);
  },

  move_left: function () {
    if(tetris.snake_head == tetris.self_id){
      if (tetris.head_dir[tetris.self_id] == 0)
        tetris.head_dir[tetris.self_id] = 3;
      else
        tetris.head_dir[tetris.self_id]--;
      // Immediate take turns
      tetris.snake_dirs[tetris.self_id][0] = tetris.head_dir[tetris.self_id];
    }else{
      //send the control signal
      send_control_signal(tetris.self_id,tetris.snake_head, 'move_left');
    }
  },

  move_right: function () {
    if(tetris.snake_head == tetris.self_id){
      if (tetris.head_dir[tetris.self_id] == 3)
        tetris.head_dir[tetris.self_id] = 0;
      else
        tetris.head_dir[tetris.self_id]++;
      // Immediate take turns
      tetris.snake_dirs[tetris.self_id][0] = tetris.head_dir[tetris.self_id];
    }else{
      send_control_signal(tetris.self_id,tetris.snake_head,'move_right');
    }
  },

  handle_coming_control_signal: function(snakeid, coming_control_signal) {
    console.log(snakeid+' '+coming_control_signal);
    if(coming_control_signal == 'move_left'){
      console.log('moving left');
      if(tetris.head_dir[snakeid] == 0)
        tetris.head_dir[snakeid] = 3;
      else
        tetris.head_dir[snakeid] --;
    }else if(coming_control_signal == 'move_right'){
      console.log('moving right');
      if(tetris.head_dir[snakeid] == 3)
        tetris.head_dir[snakeid] = 0;
      else
        tetris.head_dir[snakeid] ++;
    }
    tetris.snake_dirs[snakeid][0] = tetris.head_dir[snakeid];
  },

  watch_keys: function () {
    document.addEventListener('keydown', function (e) {
      if (tetris.state == 'game') {
        e.preventDefault();
        switch (e.keyCode) {
          case 37 :
            tetris.move_left();
            tetris.press_left = true;
            break;
          case 39 :
            tetris.move_right();
            tetris.press_right = true;
            break;
        };
      };
    });
  },

  watch_touch: function () {
    document.addEventListener('touchstart', function (e) {
      if (tetris.state == 'game') {
        tetris.last_pos_x = e.targetTouches[0].pageX;
        tetris.last_pos_y = e.targetTouches[0].pageY;
        tetris.moving = false;
        tetris.finger_lock = false;
      };
    });
    document.addEventListener('touchmove', function (e) {
      // prevent window scrolling
      e.preventDefault();
      if (tetris.state == 'game' && tetris.finger_lock == false) {
        var new_pos_x = e.targetTouches[0].pageX;
        var new_pos_y = e.targetTouches[0].pageY;
        if (new_pos_x - tetris.last_pos_x <= -tetris.block_width) {
          // finger going left
          if (tetris.head_dir[tetris.self_id] != 0)
            tetris.head_dir[tetris.self_id] = 2;
        };
        if (new_pos_x - tetris.last_pos_x >= tetris.block_width) {
          // finger going right
          if (tetris.head_dir[tetris.self_id] != 2)
            tetris.head_dir[tetris.self_id] = 0;
        };
        if (new_pos_y - tetris.last_pos_y >= tetris.block_width) {
          // finger going down
          if (tetris.head_dir[tetris.self_id] != 3)
            tetris.head_dir[tetris.self_id] = 1;
        };
        if (new_pos_y - tetris.last_pos_y <= -tetris.block_width) {
          // finger going up
          if (tetris.head_dir[tetris.self_id] != 1)
            tetris.head_dir[tetris.self_id] = 3;
        };

      };
    });
    document.addEventListener('touchend', function (e) {
      if (tetris.state == 'game') {
        if (!tetris.moving) {
          tetris.rotate_block();
        } else {
          if (tetris.max_speed_mode) {
            tetris.max_speed_mode = false;
            if ((new Date).getTime() - tetris.time_touch_down < 100) {
              tetris.drop_block();
            };
          };
        };
      };
    });
  },

  resize: function() {
    tetris.block_width = tetris.page.offsetWidth * tetris.block_width_standard;
    tetris.game_col.style.width = tetris.block_width * tetris.cols + 'px';
    tetris.game_col.style.height = tetris.block_width * (tetris.rows - 1) + 'px';
  }

};

//tetris.init();