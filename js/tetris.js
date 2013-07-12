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

  isLeaving: [],
  timeout_func: [],
  // Snake status 0: dead, 1: alive
  snake_status: [],

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
  map: [],



  // touch/finger controls
  last_pos_x: 0,
  last_pos_y: 0,
  moving: false,
  time_touch_down: 0,
  finger_lock: false,

  // id, left and right
  self_id: 0,
  left_id: undefined,
  right_id: undefined,
  color_mappings: { 0: 'white', 1: 'blue', 2: 'red', 3: 'green', 4: 'yellow'},
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
    tetris.display_snake[snake.snakeid] = [];
    tetris.snake_dirs[snake.snakeid] = [];
    tetris.snake_imgs[snake.snakeid] = [];
  },


  new_snake: function(snake) {
    tetris.isLeaving[snake.snakeid] = false;
    if(snake.direction == 0){
      tetris.display_snake[snake.snakeid][0] = new Kinetic.Circle({
          x: tetris.block_width / 2,
          y: snake.pos,
          radius: tetris.block_width / (2 * tetris.scale) - 2,
          stroke: tetris.color_mappings[snake.snakeid],
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
          stroke: tetris.color_mappings[snake.snakeid],
          strokeWidth: 3
      });
      tetris.layer_snake.add(tetris.display_snake[snake.snakeid][0]);
      tetris.snake_dirs[snake.snakeid][0] = 2;
      tetris.map[Math.floor(snake.pos/tetris.block_width)][tetris.cols-1] = snake.snakeid;
      tetris.head_dir[snake.snakeid] = 2;
    }
    tetris.display_snake[snake.snakeid][0].setFill(tetris.color_mappings[snake.snakeid]);
    tetris.display_snake[snake.snakeid][0].setScale(tetris.scale);

    setTimeout(function(){
      tetris.snake_move(snake.snakeid);
    },1000);
  },

  init_snake: function () {
    tetris.display_snake[tetris.self_id] = [];
    tetris.snake_dirs[tetris.self_id] = [];
    tetris.snake_imgs[tetris.self_id] = [];
    tetris.isLeaving[tetris.self_id] = false;
    tetris.snake_status[tetris.self_id] = 1;
    // Initialize the snake
    for (var j = 0; j < tetris.init_len; j++) {
      tetris.display_snake[tetris.self_id][j] = new Kinetic.Circle({
        x: (tetris.init_len - j) * tetris.block_width + tetris.block_width / 2,
        y: tetris.block_width / 2,
        radius: tetris.block_width / (2 * tetris.scale) - 2,
        stroke: tetris.color_mappings[tetris.self_id],
        strokeWidth: 3,
        shadowColor: 'white',
        shadowBlur: 10,
        shadowOffset: -5,
        shadowOpacity: 0.5
      });
      tetris.layer_snake.add(tetris.display_snake[tetris.self_id][j]);
      // Direction of this part of the snake
      tetris.snake_dirs[tetris.self_id][j] = 0;
      // Change map
      tetris.map[0][tetris.init_len - j] = 1;
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
        tetris.display_snake[tetris.self_id][i].setFill(tetris.color_mappings[tetris.self_id]);
      }
      tetris.display_snake[tetris.self_id][i].setScale(tetris.scale);
    }
  },

  kill_snake: function(snakeid) {
    // update snake status
    tetris.snake_status[snakeid] = 0;
    var i, j, element_id, element, index;
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

    // check game status
    if(tetris.display_snake.length == 0) {
      tetris.game_over();
    }
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

  generate_target: function () {
    // Generate a random number
    var rand = Math.floor(Math.random() * cnt);
    // Get image
    tetris.target_id = ids[rand];
    var image = document.getElementById(ids[rand]);

    // Generate target
    var snake_len = tetris.display_snake[tetris.self_id].length;
    var target_index = Math.floor(Math.random() * (tetris.rows - 1) * tetris.cols - snake_len);
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
    tetris.display_snake[snakeid][tail_index].setStroke(tetris.color_mappings[snakeid]);
    tetris.display_snake[snakeid][tail_index].setShadowColor('white');
    tetris.display_snake[snakeid][tail_index].setShadowBlur(10);
    tetris.display_snake[snakeid][tail_index].setShadowOpacity(0.5);

    // Remove target
    tetris.target = null;

    tetris.layer_snake.add(tetris.display_snake[snakeid][tail_index]);
    tetris.snake_dirs[snakeid][tail_index] = tail_dir;
    tetris.map[Math.floor(tail_y / tetris.block_width)][Math.floor(tail_x / tetris.block_width)] = 1;

    // Save image id
    tetris.snake_imgs[snakeid][tail_index] = tetris.target_id;
    // Broadcast the image id to others
    eat(snakeid, tetris.target_id);

    // Generate another target
    //tetris.generate_target();
  },

  snake_move: function (snakeid) {
    tetris.update_block(snakeid);
    tetris.timeout_func[snakeid] = setTimeout(function () {
      tetris.snake_move(snakeid);
    }, 1000);
  },

  test_wallbreak: function () {

  },

  clear_board: function () {
    if (tetris.target != null) {
      // Remove target (specifically for game over logic)
      tetris.target.hide();
      tetris.target = null;
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

  game_over: function () {
    tetris.state = 'game_over';

    var html = '<h2>Game Over</h2>';
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

  edge_safe: function(direction) {
    // going to right
    if(direction == 0)
      return tetris.display_snake[tetris.self_id][0].getAbsolutePosition().x + tetris.block_width < tetris.block_width * tetris.cols;
    else if (direction == 1)  // going down
      return tetris.display_snake[tetris.self_id][0].getAbsolutePosition().y + tetris.block_width < tetris.block_width * tetris.rows;
    else if (direction == 2)  // going left
      return tetris.display_snake[tetris.self_id][0].getAbsolutePosition().x - tetris.block_width > 0;
    else  // going top
      return tetris.display_snake[tetris.self_id][0].getAbsolutePosition().y - tetris.block_width > 0;     
  },

  update_block: function (snakeid) {
    var direction = tetris.snake_dirs[snakeid][0];
    if(!tetris.edge_safe(direction)) {
      if ( tetris.right_id != undefined && direction == 0) {
        if(tetris.isLeaving[snakeid] == false){
            tetris.isLeaving[snakeid] = true;
            go_to_right_screen(snakeid, tetris.right_id, snakeid, tetris.display_snake[snakeid][0].getAbsolutePosition().y);
          }
      }
      // start to break into the left device
      else if ( tetris.left_id != undefined && direction == 2) {
          if(tetris.isLeaving[snakeid] == false){
            tetris.isLeaving[snakeid] = true;
            go_to_left_screen(snakeid, tetris.left_id, snakeid, tetris.display_snake[snakeid][0].getAbsolutePosition().y);
          }
      }
      // this snake is dead
      else {
        tetris.kill_snake(snakeid);
        alert("player" + snakeid + " is dead");

      }

    }

    // Check whether the snake can eat something
    var tail_index = tetris.display_snake[snakeid].length - 1;
    var tail_x = tetris.display_snake[snakeid][tail_index].getAbsolutePosition().x;
    var tail_y = tetris.display_snake[snakeid][tail_index].getAbsolutePosition().y;
    var tail_dir = tetris.snake_dirs[snakeid][tail_index];

    // Update snake position
    for (var i = tetris.display_snake[snakeid].length - 1; i >= 0; i--) {

      // Update map
      if (i == tetris.display_snake[snakeid].length - 1) // snake tail
        tetris.map[Math.floor(tetris.display_snake[snakeid][i].getAbsolutePosition().y / tetris.block_width)][Math.floor(tetris.display_snake[snakeid][i].getAbsolutePosition().x / tetris.block_width)] = 0;

      var curX = tetris.display_snake[snakeid][i].getAbsolutePosition().x;
      var curY = tetris.display_snake[snakeid][i].getAbsolutePosition().y;

      if (tetris.snake_dirs[snakeid][i] == 0) {
        tetris.display_snake[snakeid][i].setX(curX + tetris.block_width);
        tetris.display_snake[snakeid][i].setShadowOffset(-5);
      } else if (tetris.snake_dirs[snakeid][i] == 1) {
        tetris.display_snake[snakeid][i].setY(curY + tetris.block_width);
        tetris.display_snake[snakeid][i].setShadowOffset(-5);
      } else if (tetris.snake_dirs[snakeid][i] == 2) {
        tetris.display_snake[snakeid][i].setX(curX - tetris.block_width);
        tetris.display_snake[snakeid][i].setShadowOffset(5);
      } else if (tetris.snake_dirs[snakeid][i] == 3) {
        tetris.display_snake[snakeid][i].setY(curY - tetris.block_width);
        tetris.display_snake[snakeid][i].setShadowOffset(5);
      }

      if (i == 0)
        tetris.snake_dirs[snakeid][i] = tetris.head_dir[snakeid];
      else
        tetris.snake_dirs[snakeid][i] = tetris.snake_dirs[snakeid][i - 1];

      curX = tetris.display_snake[snakeid][i].getAbsolutePosition().x;
      curY = tetris.display_snake[snakeid][i].getAbsolutePosition().y;

      // Update map
      if (i == 0) { // snake head
        // alert(Math.floor(curY / tetris.block_width) + ', ' + Math.floor(curX / tetris.block_width) + ', ' + tetris.map[Math.floor(curY / tetris.block_width)][Math.floor(curX / tetris.block_width)]);
        if (tetris.map[Math.floor(curY / tetris.block_width)][Math.floor(curX / tetris.block_width)] == -1) {
          // Eat target
          tetris.snake_eat(snakeid, tail_x, tail_y, tail_dir);
        }
        tetris.map[Math.floor(curY / tetris.block_width)][Math.floor(curX / tetris.block_width)] = 1;
      }
    }

    tetris.show_block(snakeid);
  },

  show_block: function (snakeid) {
    for (var i = 0; i < tetris.display_snake[snakeid].length; i++) {
      tetris.display_snake[snakeid][i].show();
    }
    tetris.layer_snake.draw();
  },

  message: function (texte) {
    tetris.messages.innerHTML = texte;
    setTimeout(function(){
      tetris.messages.innerHTML = '';
    }, 500);
  },

  move_left: function () {
    if (tetris.head_dir[tetris.self_id] == 0)
      tetris.head_dir[tetris.self_id] = 3;
    else
      tetris.head_dir[tetris.self_id]--;
    // Immediate take turns
    tetris.snake_dirs[tetris.self_id][0] = tetris.head_dir[tetris.self_id];
  },

  move_right: function () {
    if (tetris.head_dir[tetris.self_id] == 3)
      tetris.head_dir[tetris.self_id] = 0;
    else
      tetris.head_dir[tetris.self_id]++;
    // Immediate take turns
    tetris.snake_dirs[tetris.self_id][0] = tetris.head_dir[tetris.self_id];
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