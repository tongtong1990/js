var tetris = {

  // html elements
  page: null,
  page_home: null,
  page_game: null,
  game_col: null,
  game_zone: null,
  messages: null,

  // display (kinetic)
  stage: null,
  layer_block: null,
  layer_snake: null,
  block_width: 0,
  block_width_standard: .1,
  display_line: [],
  display_block: [],
//  display_snake: [],

  // Modified display_snake and snake_dirs
  display_snake: [],
  snake_dirs: [],
  head_dir: [],

//  snake_dirs: [0, 0, 0, 0, 0],
//  head_dir: 0, // head direction, 0: right, 1: down, 2: left, 3: up.
  image_width: 80, // Image width from LinkedIn
  scale: 0, // Scale for image

  // game infos
  state: null,
  board: [],
  rows: 14,
  cols: 10,
  screen_width: 0,
  screen_height: 0,
  init_len: 2,

  // touch/finger controls
  last_pos_x: 0,
  last_pos_y: 0,
  moving: false,
  time_touch_down: 0,
  finger_lock: false,

  // id, left and right
  id: 0,
  left: 0,
  right: 0,
  color_mappings: { 0: 'white', 1: 'blue', 2: 'red', 3: 'green', 4: 'yellow'},
  self_color: null,

  init: function () {
    tetris.page = document.getElementById('page');
    tetris.page_home = document.getElementById('page_home');
    tetris.page_game = document.getElementById('page_game');
    tetris.game_col = document.getElementById('game_col');
    tetris.game_zone = document.getElementById('game_zone');

    tetris.block_width = tetris.page.offsetWidth * tetris.block_width_standard;
    // Calculate the board size of the game
    tetris.screen_width = tetris.block_width * tetris.cols;
    tetris.screen_height = tetris.block_width * tetris.rows;
    // Calcualte scale
    tetris.scale = tetris.block_width / tetris.image_width;

    // Initialize stage
    tetris.stage = new Kinetic.Stage({
      container: 'game_zone',
      width: tetris.cols * tetris.block_width,
      height: tetris.rows * tetris.block_width
    });

    // Blocks: background
    tetris.layer_block = new Kinetic.Layer();
    tetris.layer_snake = new Kinetic.Layer();
    for (var i = 0; i < tetris.rows; i++) {
      tetris.display_block[i] = [];
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
      };
    };

    tetris.display_snake[tetris.id] = [];
    tetris.snake_dirs[tetris.id] = [];
    // Initialize the snake
    for (var j = 0; j < tetris.init_len; j++) {
      tetris.display_snake[tetris.id][j] = new Kinetic.Circle({
        x: (tetris.init_len - j) * tetris.block_width + tetris.block_width / 2,
        y: tetris.block_width / 2,
        radius: tetris.block_width / (2 * tetris.scale) - 2,
        stroke: tetris.color_mappings[tetris.id],
        strokeWidth: 3
      });
      tetris.layer_snake.add(tetris.display_snake[tetris.id][j]);

      tetris.snake_dirs[tetris.id][j] = 0;
    }
    tetris.head_dir[tetris.id] = 0;

    // Initialize images
    var images = {};

    for (var i = 0; i < tetris.init_len; i++) {
      if (i != 0) {
        images[i] = document.getElementById(ids[i]);
        tetris.display_snake[tetris.id][i].setFillPatternImage(images[i]);
        tetris.display_snake[tetris.id][i].setFillPatternOffset(- tetris.block_width / (2 * tetris.scale), tetris.block_width / (2 * tetris.scale));
      } else {
        tetris.display_snake[tetris.id][i].setFill(tetris.color_mappings[tetris.id]);
      }
      tetris.display_snake[tetris.id][i].setScale(tetris.block_width / tetris.image_width);
    }
    

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
    tetris.page_home.style.display = 'block';
    tetris.page_game.style.display = 'none';
    tetris.state = 'home';
  },

  show_game: function () {
    tetris.page_home.style.display = 'none';
    tetris.page_game.style.display = 'block';
    tetris.state = 'game';
    tetris.init_game();
  },

  init_game: function () {
    tetris.state = 'game';
    tetris.level = 0;
    tetris.speed = tetris.init_speed;
    tetris.lines = 0;
    tetris.score = 0;
    tetris.count_single = 0;
    tetris.count_double = 0;
    tetris.count_triple = 0;
    tetris.count_tetris = 0;
    tetris.clear_board();

    setTimeout(function () {
      // hide the address bar
      window.scrollTo(0, 1);
      tetris.snake_move();
    }, 0);
  },

  snake_move: function() {
    tetris.update_block();
    setTimeout(function() {
      tetris.snake_move();
    }, 1000);
  },

  test_wallbreak: function() {

  },

  clear_board: function () {
    for (var i = 0; i < tetris.rows; i++) {
      tetris.board[i] = [];
      for (var j = 0; j < tetris.cols; j++) {
        tetris.board[i][j] = {
          stone: false,
          block: false,
          shadow: false,
          updated: true,
          color: null
        };
      };
    };
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
      tetris.init_game();
    });
    document.getElementById('bt_main_menu').addEventListener('click', function() {
      tetris.show_home();
    });
  },

  edge_safe: function(direction) {
    // going to right
    if(direction == 0)
      return tetris.display_snake[tetris.id][0].getAbsolutePosition().x + tetris.block_width < tetris.block_width * tetris.cols;
    else if (direction == 1)  // going down
      return tetris.display_snake[tetris.id][0].getAbsolutePosition().y + tetris.block_width < tetris.block_width * tetris.rows;
    else if (direction == 2)  // going left
      return tetris.display_snake[tetris.id][0].getAbsolutePosition().x - tetris.block_width > 0;
    else  // going top
      return tetris.display_snake[tetris.id][0].getAbsolutePosition().y - tetris.block_width > 0;     
 },

  update_block: function () {

    if(!tetris.edge_safe(tetris.snake_dirs[tetris.id][0])) {
    //  alert("hit");
    //  tetris.game_over();
      return;
    }

    // Update snake position
    for (var i = 1; i >= 0; i--) {

      var curX = tetris.display_snake[tetris.id][i].getAbsolutePosition().x;
      var curY = tetris.display_snake[tetris.id][i].getAbsolutePosition().y;

      if (tetris.snake_dirs[tetris.id][i] == 0)
        tetris.display_snake[tetris.id][i].setX(curX + tetris.block_width);
      else if (tetris.snake_dirs[tetris.id][i] == 1)
        tetris.display_snake[tetris.id][i].setY(curY + tetris.block_width);
      else if (tetris.snake_dirs[tetris.id][i] == 2)
        tetris.display_snake[tetris.id][i].setX(curX - tetris.block_width);
      else if (tetris.snake_dirs[tetris.id][i] == 3)
        tetris.display_snake[tetris.id][i].setY(curY - tetris.block_width);

      if (i == 0)
        tetris.snake_dirs[tetris.id][i] = tetris.head_dir[tetris.id];
      else
        tetris.snake_dirs[tetris.id][i] = tetris.snake_dirs[tetris.id][i - 1];
    }

    tetris.show_block();
  },

  show_block: function () {
    for (var i = 0; i < 2; i++) {
      tetris.display_snake[tetris.id][i].show();
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
    if (tetris.head_dir[tetris.id] == 0)
      tetris.head_dir[tetris.id] = 3;
    else
      tetris.head_dir[tetris.id]--;
  },

  move_right: function () {

    if (tetris.head_dir[tetris.id] == 3)
      tetris.head_dir[tetris.id] = 0;
    else
      tetris.head_dir[tetris.id]++;
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

          if (tetris.head_dir[tetris.id] != 0)
            tetris.head_dir[tetris.id] = 2;

          tetris.update_block();

        };
        if (new_pos_x - tetris.last_pos_x >= tetris.block_width) {
          // finger going right

          if (tetris.head_dir[tetris.id] != 2)
            tetris.head_dir[tetris.id] = 0;

          tetris.update_block();
        };
        if (new_pos_y - tetris.last_pos_y >= tetris.block_width) {
          // finger going down

          if (tetris.head_dir[tetris.id] != 3)
            tetris.head_dir[tetris.id] = 1;

          tetris.update_block();
        };
        if (new_pos_y - tetris.last_pos_y <= -tetris.block_width) {
          // finger going up


          if (tetris.head_dir[tetris.id] != 1)
            tetris.head_dir[tetris.id] = 3;

          tetris.update_block();
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