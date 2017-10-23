var paddle;
var otherPaddle = {};
var ballSize = 15;
var ballPos = {};
var socket;

function setup() {

    var canvas = createCanvas(500, 750);

    canvas.parent('sketch-holder');
    $("#wrapper").draggable();


    var start = $("#start");
    var waiting = $("#waiting");
    var game = $("#game");
    start.show();

    socket = io.connect();

    socket.on('connect_error', function () {
        waiting.hide();
        game.hide();
        start.show();
    });
    socket.on('game winUpdate', function (data) {
        $("#status").text(data.player1.name+": "+data.player1.wins + " - " +data.player2.name+": "+data.player2.wins);
    });

    socket.on('game join', function (data) {
        waiting.hide();
        start.hide();
        game.show();
        paddle = new Paddle(width / 2 - (paddleWidth / 2), height - paddleHeight - 3);
        $("#status").text("Playing with " + data.name);
        ballPos.x = data.x;
        ballPos.y = data.y;
    });

    socket.on('game update', function (data) {
        otherPaddle.x = data.otherPaddle.x;
        otherPaddle.y = data.otherPaddle.y;
        ballPos.x = data.ball.x;
        ballPos.y = data.ball.y;
    });

    $("#submit").click(function () {
        name = $("#name").val();

        socket.emit('queue join', {
            name: name
        });

        start.hide();
        waiting.show();
        $("#status").text("Waiting for another player...");
    });

    $("#cancel").click(function () {
        socket.emit('queue leave');
        waiting.hide();
        game.hide();
        start.show();
    });
}

function draw() {

    //translate(width, height);
    //rotate(PI);

    background(150);
    stroke("#fff");
    line(0, height / 2, width, height / 2);

    if(paddle) {
        paddle.update();
        paddle.draw();
        socket.emit('paddle update', {
            x: paddle.pos.x,
            y: paddle.pos.y
        });

        if(ballPos.x + ballSize >= paddle.pos.x
            && ballPos.x < paddle.pos.x+paddleWidth
            && ballPos.y+ballSize >= paddle.pos.y
            && ballPos.y <= paddle.pos.y+paddleHeight)
            socket.emit('paddle hitBall');
    }
    if (ballPos) {
        stroke("#717171");
        fill("#fff");
        ellipse(ballPos.x, ballPos.y, ballSize, ballSize);
    }
    if(otherPaddle){
        stroke("#434343");
        fill("#ff7640");
        rect(width-otherPaddle.x-paddleWidth, height-otherPaddle.y-paddleHeight, paddleWidth, paddleHeight);
    }
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        paddle.move(-1, 0);
    }
    if (keyCode === RIGHT_ARROW) {
        paddle.move(1, 0);
    }
}

function keyReleased() {
    if (keyCode === LEFT_ARROW) {
        paddle.move(1, 0);
    }
    if (keyCode === RIGHT_ARROW) {
        paddle.move(-1, 0);
    }
}

