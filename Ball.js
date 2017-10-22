var ballSize = 15;

function Ball(x, y) {
    this.vel = createVector();
    this.pos = createVector(x, y);
    this.speed = 5;
    this.lastPos = createVector();
    this.dead = false;

    this.move = function (x, y) {
        this.vel.add(x * this.speed, y * this.speed);
    };

    this.draw = function () {
        stroke("#717171");
        fill("#fff");
        ellipse(this.pos.x, this.pos.y, ballSize, ballSize);
    };

    this.update = function () {
        if (!this.dead) {
            this.pos.add(this.vel);

            //Check for Left collision
            if (this.pos.x <= 0)
                this.move(1, 0);

            //Check for Right collision
            if (this.pos.x + ballSize >= width)
                this.move(-1, 0);

            //Check for Paddle collision
            if (this.pos.x + ballSize >= paddle.pos.x && this.pos.x < paddle.pos.x + paddleWidth && this.pos.y + ballSize / 2 > paddle.pos.y && this.pos.y < paddle.pos.y + paddleHeight) {
                this.vel.y *= -1;
                this.pos.x = this.lastPos.x;
                this.pos.y = this.lastPos.y;
            }

            if (this.pos.y > height)
                this.dead = true;

            this.lastPos.x = this.pos.x;
            this.lastPos.y = this.pos.y;
        }
    };

}