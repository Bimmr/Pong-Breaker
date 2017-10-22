// sketch.js
var paddle;
var ball;

function setup() {
    var canvas = createCanvas(500, 750);

    // Move the canvas so it's inside our <div id="sketch-holder">.
    canvas.parent('sketch-holder');
    $("#wrapper").draggable();


    paddle = new Paddle(width / 2 - (paddleWidth / 2), height - paddleHeight - 3);
    ball = new Ball(width / 2 - (ballSize / 2), height / 2 - (ballSize / 2) - 100);//paddleHeight-ballSize);
    ball.move(1, 1);


}

function draw() {

    translate(width, height);
    rotate(PI);

    background(150);
    stroke("#fff");
    line(0, height / 2, width, height / 2);

    paddle.update();
    paddle.draw();
    ball.update();
    ball.draw();
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
