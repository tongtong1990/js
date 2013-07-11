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
  display_snake: [],
  snake_dirs: [0, 0, 0, 0, 0],
  head_dir: 0, // head direction, 0: right, 1: down, 2: left, 3: up.
  shine_tab: [],

  // game infos
  state: null,
  board: [],
  next_block: null,
  next_block_pos: null,
  block: null,
  block_pos: null,
  block_x: 0,
  block_y: 0,
  rows: 15,
  cols: 10,


  // speed
  fall_timeout: null,
  stationary: false,
  init_speed: 600,
  max_speed_mode: false,
  max_speed: 50,
  speed: 0,

  // counters
  level: 0,
  score: 0,
  best_score_tetris: 0,
  lines: 0,
  count_single: 0,
  count_double: 0,
  count_triple: 0,
  count_tetris: 0,

  // touch/finger controls
  last_pos_x: 0,
  last_pos_y: 0,
  moving: false,
  time_touch_down: 0,
  finger_lock: false,

  // keyboard controls
  press_left: false,
  press_right: false,
  press_down: false,
  press_drop: false,
  press_rotate: false,

  tab_probability: [1, 1, 1, 1, 1, 1, 1],

  init: function () {
    tetris.page = document.getElementById('page');
    tetris.page_home = document.getElementById('page_home');
    tetris.page_game = document.getElementById('page_game');
    tetris.game_col = document.getElementById('game_col');
    tetris.game_zone = document.getElementById('game_zone');

    tetris.block_width = tetris.page.offsetWidth * tetris.block_width_standard;

    tetris.stage = new Kinetic.Stage({
      container: 'game_zone',
      width: tetris.cols * tetris.block_width,
      height: tetris.rows * tetris.block_width
    });

    tetris.layer_block = new Kinetic.Layer();
    tetris.layer_snake = new Kinetic.Layer();
    for (var i = 0; i < tetris.rows; i++) {
      tetris.display_block[i] = [];
      for (var j = 0; j < tetris.cols; j++) {
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

    // Initialize the snake
    for (var j = 0; j < 5; j++) {
      tetris.display_snake[j] = new Kinetic.Rect({
        x: (5 - j) * tetris.block_width,
        y: 0,
        width: tetris.block_width,
        height: tetris.block_width,
        fill: 'red'
      });
      tetris.layer_snake.add(tetris.display_snake[j]);

      tetris.snake_dirs[j] = 0;
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

    if (tetris.score > tetris.best_score_tetris) {
      tetris.best_score_tetris = tetris.score;
      localStorage.setItem('best_score_tetris', tetris.best_score_tetris);
      tetris.best_zone.innerHTML = tetris.best_score_tetris;
    }

    var html = '<h2>Game Over</h2>';
    html += '<div class="overview">';
    html += '<div class="points"><div class="nb_points">' + tetris.score + '</div> points</div>';
    html += '<div class="lines"><div class="nb_lines">' + tetris.lines + '</div> lines</div>';
    html += '</div>';
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

  update_block: function () {

    // Update snake position
    for (var i = 4; i >= 0; i--) {
      if (tetris.snake_dirs[i] == 0)
        tetris.display_snake[i].setX(tetris.display_snake[i].getAbsolutePosition().x + tetris.block_width);
      else if (tetris.snake_dirs[i] == 1)
        tetris.display_snake[i].setY(tetris.display_snake[i].getAbsolutePosition().y + tetris.block_width);
      else if (tetris.snake_dirs[i] == 2)
        tetris.display_snake[i].setX(tetris.display_snake[i].getAbsolutePosition().x - tetris.block_width);
      else if (tetris.snake_dirs[i] == 3)
        tetris.display_snake[i].setY(tetris.display_snake[i].getAbsolutePosition().y - tetris.block_width);

      if (i == 0) {
        tetris.snake_dirs[i] = tetris.head_dir;
      }
      else
        tetris.snake_dirs[i] = tetris.snake_dirs[i - 1];
    }

    tetris.show_block();
  },

  show_block: function () {
    for (var i = 0; i < 5; i++) {
      tetris.display_snake[i].show();
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
    if (tetris.head_dir == 0)
      tetris.head_dir = 3;
    else
      tetris.head_dir--;
  },

  move_right: function () {

    if (tetris.head_dir == 3)
      tetris.head_dir = 0;
    else
      tetris.head_dir++;
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

          if (tetris.head_dir != 0)
            tetris.head_dir = 2;

          tetris.update_block();

        };
        if (new_pos_x - tetris.last_pos_x >= tetris.block_width) {
          // finger going right

          if (tetris.head_dir != 2)
            tetris.head_dir = 0;

          tetris.update_block();
        };
        if (new_pos_y - tetris.last_pos_y >= tetris.block_width) {
          // finger going down

          if (tetris.head_dir != 3)
            tetris.head_dir = 1;

          tetris.update_block();
        };
        if (new_pos_y - tetris.last_pos_y <= -tetris.block_width) {
          // finger going up


          if (tetris.head_dir != 1)
            tetris.head_dir = 3;

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

tetris.init();