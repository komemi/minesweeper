/*!
*   minesweeper game!
*   by shlomi komemi
*   shlomi@komemi.com
*   Date: September 30 03:56 2011
*/

/*
    window.minesweeper namespace
*/
window.minesweeper = (function (window, jQuery, undefined) {
    "use strict";


    /*
        global variables 
    */
    var
        MAX_WIDTH = 800,
        MAX_HEIGHT = 800,
        w = window,
        d = w.document,
        $ = jQuery,
        $canvas = null,
        game = w.game = w.game || { row: 10, col: 10, table: null, squareWidth: 22, squareHeight: 22, mines: 5, over: false },
        log = w.log = w.log || function (str) {
            try {
                console.log(str);
            } catch (e) { }
        }

    /*
        jQuery plugin for drawing a square in canvas.
    */
    jQuery.fn.drawButton = function (x, y, w, h, square) {
        
        // If Square is open or closed
        if (square.open) {
            var text = '', 
                color = '#000';

            $canvas
                .drawRect({
                    fillStyle: "#C0C0C0",
                    x: x, y: y,
                    width: w, height: h,
                    fromCenter: false
                })
                .drawLine({
                    strokeStyle: "#808080",
                    strokeWidth: 1,
                    rounded: true,
                    x1: x, y1: y + h,
                    x2: x, y2: y,
                    x3: x + w, y3: y,
                    x4: x + w, y4: y + h,
                    x5: x, y5: y + h
                });

            if (square.hasMine) {
                text = '*';
            } else if (square.mines > 0) {
                text = square.mines.toString();
                color = square.getColor(square.mines);
            }

            $canvas.drawText({
                fillStyle: color,
                strokeStyle: color,
                strokeWidth: 1,
                text: text,
                align: "center",
                baseline: "middle",
                font: "normal 12px Verdana",
                x: x + game.squareWidth / 2,
                y: y + game.squareHeight / 2
            });
        } else {
            $canvas
                .drawRect({
                    fillStyle: "#C0C0C0",
                    x: x, y: y,
                    width: w, height: h,
                    fromCenter: false
                })
                .drawLine({
                    strokeStyle: "#FFF",
                    strokeWidth: 1,
                    rounded: true,
                    x1: x + 1, y1: y + h - 1,
                    x2: x + 1, y2: y + 1,
                    x3: x + w - 1, y3: y + 1
                })
                .drawLine({
                    strokeStyle: "#808080",
                    strokeWidth: 1,
                    rounded: true,
                    x1: x + w - 1, y1: y + 1,
                    x2: x + w - 1, y2: y + h - 1,
                    x3: x + 1, y3: y + h - 1
                });


            // Does the square has a flag?
            if (square.flag) {
                $canvas
                    .drawRect({
                        fillStyle: "#FF2A00",
                        x: x + w / 4, y: y + w / 4,
                        width: w / 2, height: w / 3,
                        fromCenter: false
                    }).drawLine({
                        strokeStyle: "#0055FF",
                        strokeWidth: w / 10,
                        rounded: false,
                        x1: x + w / 4 + w / 2 - w / 20, y1: y + w / 4,
                        x2: x + w / 4 + w / 2 - w / 20, y2: y + w / 4 + w / 2,
                    });
            }
        }
    }


    /*
        jQuery plugin for drawing a square in canvas.
    */
    function Square(table, x, y) {
        return Object.create({
            // draw the current square object
            draw: function () {
                table.canvas.drawButton((this.x - 1) * this.defaultWidth, (this.y - 1) * this.defaultHeight, this.defaultWidth, this.defaultHeight, this);
            },
            // click handler of a single square
            click: function (e) {
                if (game.over) {                    
                    return;
                }

                if (this.hasMine) {                    
                    game.over = true;
                    table.revealMines();
                    table.smiley(false);
                } else if (this.mines > 0 && this.open === false) {                    
                    this.table.revealSquare(this);
                } else if (this.mines === 0 && this.hasMine === false) {                    
                    table.explore(this.x, this.y);
                }
            },
            // right click handler of a single square
            rightClick: function (e) {
                if (game.over) {                    
                    return;
                }
                this.flag = !this.flag;
                this.draw();
            },
            // get the color of the current square according to the number of mines
            getColor: function (i) {
                return this.color[i];
            }
        },
        {
            // reference to the parent table object
            table: { value: table, writable: false },
            // currnet x & y 
            x: { value: x, writable: true },
            y: { value: y, writable: true },
            // is square open?
            open: { value: false, writable: true },
            // does the current square has a flag?
            flag: { value: false, writable: true },
            // does the current square has mines?
            hasMine: { value: false, writable: true },
            // mines count of the current square
            mines: { value: 0, writable: true },
            // width & height
            defaultWidth: { value: game.squareWidth, writable: true },
            defaultHeight: { value: game.squareHeight, writable: true },
            // colors...
            color: { value: ['#000000', '#0000FF', '#008200', '#FF0000', '#000084', '#840000', '#008284', '#840084', '#FF7F00', '#FF00FF'], writable: true }
        });
    }
    /*
        Minesweeper table containing columns & rows of type square
    */
    function Table(canvas, col, row) {
        return Object.create({
            init: function () {
                game.col += 2;
                game.row += 2;

                var args = { table: this },
                    windowWidth = $(w).width(),
                    windowHeight = $(w).height() - 50,
                    newSquareHeight = windowHeight / game.row,
                    newSquareWidth = newSquareHeight;

                game.squareWidth = newSquareWidth;
                game.squareHeight = newSquareHeight;

                for (var i = 0; i < game.col + 2; i++) {
                    this.grid[i] = [];
                    for (var j = 0; j < game.row + 2; j++) {
                        this.add(i, j);
                    }
                }

                // remove all events from canvas element
                this.canvas.off('.minesweeper');

                // attach all events to our canvas
                this.canvas
                    .on('contextmenu.minesweeper', args, function (e) {
                        args.table.click(e);
                        e.preventDefault();
                    })
                    .on('click.minesweeper', args, function (e) {
                        args.table.click(e);
                    })
                    .on('mouseup.minesweeper', args, function (e) {
                        args.table.mouseup(e);
                    })
                    .on('mousedown.minesweeper', args, function (e) {
                        args.table.mousedown(e);
                    });

                this.canvas.attr({ width: newSquareWidth * (game.col - 2), height: newSquareHeight * (game.row - 2) })
                    .parent().css({ width: newSquareWidth * (game.col - 2), height: newSquareHeight * (game.row - 2) });

                this.placeMines();
                this.calculate();
            },
            // adds a square to the matrix
            add: function (i, j) {
                this.grid[i][j] = new Square(this, i, j);
            },
            // draw the minesweeper table(board)
            draw: function () {
                var arr = [], item = null;
                for (var i = 1; i < game.col - 1; i++) {
                    for (var j = 1; j < game.row - 1; j++) {
                        this.grid[i][j].draw();
                    }
                }
            },
            // mousedown
            mousedown: function (e) {
                e.preventDefault();
            },
            // mouseup
            mouseup: function (e) {
                e.preventDefault();
            },
            // click handler on the table
            click: function (e) {
                
                // get clicked square
                var square = this.getSelected(e);

                if (square.x === 0 || square.y === 0 || square.x === game.col + 1 || square.y === game.row + 1) {                    
                    return;
                }

                if (e.which == 1) {
                    this.leftClick(square, e);
                } else if (e.which == 3) {
                    this.rightClick(square, e);
                }
            },
            // left click handler on a square
            leftClick: function (square, e) {
                square.click(e);
            },
            // right click handler on a square
            rightClick: function (square, e) {
                square.rightClick(e);
            },
            // calculate the selected square with mouse coordinates
            getSelected: function (e) {
                var offset = this.coordinates(e),
                    squarex = Math.floor(offset.x / game.squareWidth) + 1,
                    squarey = Math.floor(offset.y / game.squareHeight) + 1,
                    selectedSquar = this.grid[squarex][squarey];

                return selectedSquar;
            },
            // place mines 
            placeMines: function () {
                var randomx = 0,
                    randomy = 0;

                for (var i = 0; i < game.mines; i++) {
                    randomx = Math.floor(Math.random() * (game.col - 2)) + 1;
                    randomy = Math.floor(Math.random() * (game.row - 2)) + 1;

                    this.grid[randomx][randomy].hasMine = true;
                }
            },
            // calculate square numbers according to number of mines surrounding them
            calculate: function () {
                for (var i = 1; i < game.col + 1; i++) {
                    for (var j = 1; j < game.row + 1; j++) {
                        this.grid[i][j].mines = this.getMinesCount(i, j);
                    }
                }
            },
            // helper to the function above
            getMinesCount: function (i, j) {
                var count = 0;
                for (var k = -1; k < 2; k++) {
                    if (this.grid[i - 1][j + k].hasMine === true) {
                        count++;
                    }
                }
                for (var k = -1; k < 2; k++) {
                    if (this.grid[i + 1][j + k].hasMine === true) {
                        count++;
                    }
                }
                if (this.grid[i][j - 1].hasMine === true) {
                    count++;
                }
                if (this.grid[i][j + 1].hasMine === true) {
                    count++;
                }
                return count;
            },
            // open empty square until you reach mines, with recursion
            explore: function (i, j) {
                var current = this.grid[i][j];
                if (current.open || current.hasMine) {
                    return;
                }
                if (i <= 0 || j <= 0 || i >= game.col - 1 || j >= game.row - 1) {
                    return;
                }

                this.revealSquare(current);

                if (current.mines > 0) {
                    return;
                }

                this.explore(i - 1, j - 1);
                this.explore(i - 1, j);
                this.explore(i - 1, j + 1);
                this.explore(i, j - 1);
                this.explore(i, j + 1);
                this.explore(i + 1, j - 1);
                this.explore(i + 1, j);
                this.explore(i + 1, j + 1);
            },
            // open all squares & draws them
            reveal: function () {
                for (var i = 1; i < game.col + 1; i++) {
                    for (var j = 1; j < game.row + 1; j++) {
                        this.grid[i][j].open = true;
                        this.grid[i][j].draw();
                    }
                }
            },
            // open a single square & draw it
            revealSquare: function (square) {
                square.open = true;
                square.draw();

                this.squareReveal--;

                // win game, no more squares to reveal
                if (this.squareReveal === 0) {
                    this.smiley(true);
                }
            },
            // draw smiley (happy/sad)
            smiley: function (flag) {            
                var x = $canvas.width() / 2,
                    y = $canvas.height() / 2,
                    start = 90,
                    end = 270;

                // happy / sad ?
                if (!flag) {
                    start = 270;
                    end = 90;
                }

                this.canvas.drawArc({
                    fillStyle: "#ffff66",
                    strokeStyle: "#ffff66",
                    strokeWidth: 5,
                    x: x, y: y,
                    radius: 200,
                    start: 0, end: 360
                });

                this.canvas.drawArc({ fillStyle: "#000", strokeStyle: "#000", strokeWidth: 5, x: x - 50, y: y - 40, radius: 20, start: 0, end: 360 });
                this.canvas.drawArc({ fillStyle: "#000", strokeStyle: "#000", strokeWidth: 5, x: x + 50, y: y - 40, radius: 20, start: 0, end: 360 });
                this.canvas.drawArc({ fillStyle: "#000", strokeStyle: "#000", strokeWidth: 5, x: x, y: y + 100, radius: 40, start: start, end: end });
            },
            // display all squares with mines
            revealMines: function () {
                for (var i = 1; i < game.col + 1; i++) {
                    for (var j = 1; j < game.row + 1; j++) {
                        if (this.grid[i][j].hasMine) {
                            this.grid[i][j].open = true;
                            this.grid[i][j].draw();
                        }
                    }
                }
            },
            // get x & y coordinates of the mouse in the current canvas
            coordinates: function (e) {
                return { x: e.pageX - canvas.offset().left, y: e.pageY - canvas.offset().top };
            }
        },
        {
            // reference to canvas element
            canvas: { value: canvas, writable: true },
            // matrix of square objects [x,y]
            grid: { value: [], writable: true },       
            // number of revealed squares     
            squareReveal: { value: game.col * game.row - game.mines, writable: true }
        });
    }

    // initilize a new game & game difficulty
    game.init = function (level) {
        
        $canvas = $canvas || $('.container canvas:eq(0)');        
        $canvas.show();

        $('.select-level').hide();
        $('.select-game').show();
        game.over = false;

        // game difficulty 
        switch (level) {
            case 1:
                game.col = 8;
                game.row = 8;
                game.mines = 10;
                break;
            default:
            case 2:
                game.col = 16;
                game.row = 16;
                game.mines = 40;
                break;
            case 3:
                game.col = 30;
                game.row = 16;
                game.mines = 99;
                break;
        }

        var table = new Table($canvas);
        $canvas.prev().hide();
        table.init();
        table.draw();
    }

    // 
    game.select = function () {
        $('.select-level').show();
        $('.select-game').hide();
        
        var size = { width: 350, height: 300 };
        $canvas.attr(size).hide().parent().css(size);
    }

    // expose to minesweeper namespace
    return {
        init: game.init,
        select: game.select,

    }
})(window, jQuery);