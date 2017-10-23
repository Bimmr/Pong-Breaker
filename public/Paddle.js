var paddleWidth = 100;
var paddleHeight = 10;

function Paddle(x, y) {
    this.startY = y;
    this.vel = createVector();
    this.pos = createVector(x, y);
    this.color = "#386def";
    this.speed = 6;

    this.move = function (x, y) {
        this.vel.add(x * this.speed, y * this.speed);
    };

    this.draw = function () {

        stroke("#434343");
        fill(this.color);
        rect(this.pos.x, this.pos.y, paddleWidth, paddleHeight);
    };

    this.update = function () {
        this.pos.add(this.vel);
        this.pos.x = constrain(this.pos.x, 0, width - paddleWidth - 1);
    };

}