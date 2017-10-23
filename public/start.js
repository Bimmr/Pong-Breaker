var paddle;
var ballSize = 15;
var ballPos;
var socket;

function setup() {

    var canvas = createCanvas(500, 750);

    // Move the canvas so it's inside our <div id="sketch-holder">.
    canvas.parent('sketch-holder');
    $("#wrapper").draggable();


    var start = $("#start");
    var waiting = $("#waiting");
    var game = $("#game");
    start.show();

    socket = io.connect('http://localhost:3000');

    socket.on('connect_error', function () {
        waiting.hide();
        game.hide();
        start.show();
    });

    socket.on('game update', function (data) {
        ballPos = data;
    });

    socket.on('game join', function (data) {
        waiting.hide();
        start.hide();
        game.show();
        paddle = new Paddle(width / 2 - (paddleWidth / 2), height - paddleHeight - 3);
        $("#status").text("Playing with " + data.name);
    });

    socket.on('game update', function (data) {
        console.log(data);
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

    paddle.update();
    paddle.draw();
    socket.emit('paddle update', {x: paddle.x, y: paddle.y});
    if (ballPos) {
        stroke("#717171");
        fill("#fff");
        ellipse(ballPos.x, ballPos.y, ballSize, ballSize);
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

