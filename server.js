var express = require('express');
var socket = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = app.listen(3000);
var io = socket(server);
var width = 500;
var height = 750;

var waitingQueue = [];
var gameCount = 1;

setInterval(function () {
    if (waitingQueue.length < 2)
        return;

    var index = Math.floor(Math.random() * waitingQueue.length);
    var playerOne = waitingQueue[index];
    waitingQueue.splice(index, 1);

    index = Math.floor(Math.random() * waitingQueue.length);
    var playerTwo = waitingQueue[index];
    waitingQueue.splice(index, 1);

    var name = "Game" + gameCount++;
    var game = new Game(gameCount, playerOne, playerTwo);

    playerOne.join(name);
    playerTwo.join(name);
    playerOne.game = game;
    playerTwo.game = game;

    playerOne.emit('game join', {
        name: playerTwo.playerName,
        ball: game.ball
    });
    playerTwo.emit('game join', {
        name: playerTwo.playerName,
        ball: game.ball
    });

}, 2000);

setInterval(function(){
    var updatedGames = {};
    for(var i = 0; i < io.sockets.length; i++){
        var s = io.sockets[i];
        if(!updatedGames[s.game.player1.id])
        {
            s.game.update();
            io.to("Game"+s.game.id).emit('game update', {
                player1: s.game.player1,
                player2: s.game.player2,
                ball: s.game.ball
            });
            updatedGames[s.game.player1.id] = true;
        }
    }
},1000/30);

io.sockets.on('connection', function (socket) {

    socket.on("queue join", function (data) {
        socket.playerName = data.name;
        socket.game = null;
        waitingQueue.push(socket);
    });
    socket.on("queue leave", function (data) {
        var index = waitingQueue.indexOf(socket);
        if (index != -1)
            waitingQueue.splice(index, 1);
    });
    socket.on('paddle update', function (data) {
        socket.paddle = data;
        console.log(data);
    });
});

function Game(id, player1, player2){
    this.id = id;
    this.ball = new Ball((500/2)-ballSize/2, (750/2)-ballSize/2);
    this.ball.move(Math.floor(Math.random() * 2) - 1, Math.floor(Math.random() * 2) - 1);

    this.player1 = player1;
    this.player2 = player2;

    this.update = function(){
        this.player1.emit('game update',{
            otherPaddle: player2.paddlePos,
            ball: this.ball.pos
        });
        this.player2.emit('game update',{
            otherPaddle: player2.paddlePos,
            ball: this.ball.pos
        });
    }
}
var ballSize = 15;

function Ball(x, y) {
    this.vel = {x: 0, y: 0};
    this.pos = {x: x, y: y};
    this.speed = 5;
    this.lastPos = {x: 0, y: 0};
    this.dead = false;

    this.move = function (x, y) {
        this.vel.x += x * this.speed;
        this.vel.y += y * this.speed;
    };

    this.draw = function () {
        stroke("#717171");
        fill("#fff");
        ellipse(this.pos.x, this.pos.y, ballSize, ballSize);
    };

    this.update = function () {
        if (!this.dead) {
            this.pos.add(this.vel);


            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;

            //Check for Left collision
            if (this.pos.x <= 0)
                this.move(1, 0);

            //Check for Right collision
            if (this.pos.x + ballSize >= width)
                this.move(-1, 0);

            this.lastPos.x = this.pos.x;
            this.lastPos.y = this.pos.y;
        }
    };

}