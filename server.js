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
    console.log(waitingQueue.length);
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
        name: playerOne.playerName,
        ball: game.ball
    });

}, 2000);

setInterval(function () {
    var updatedGames = {};
    Object.keys(io.sockets.sockets).forEach(function (id) {
        var s = io.sockets.sockets[id];
        if (s.game) {
            if (!updatedGames[s.game.player1.id]) {
                s.game.update();
                s.game.player1.emit('game update', {
                    otherPaddle: s.game.player2.paddle,
                    ball: s.game.ballPos
                });
                var d = rotate(width / 2, height / 2, s.game.ballPos.x, s.game.ballPos.y, 180);

                s.game.player2.emit('game update', {
                    otherPaddle: s.game.player1.paddle,
                    ball: {x: d[0], y: d[1]}
                });
                updatedGames[s.game.player1.id] = true;
            }
        }
    });
}, 20);

io.sockets.on('connection', function (socket) {

    socket.on("queue join", function (data) {
        console.log(socket.id);
        socket.playerName = data.name;
        socket.game = null;
        socket.wins = 0;
        waitingQueue.push(socket);
    });
    socket.on("queue leave", function (data) {
        var index = waitingQueue.indexOf(socket);
        if (index !== -1)
            waitingQueue.splice(index, 1);
    });
    socket.on('paddle update', function (data) {
        socket.paddle = data;
    });
    socket.on('paddle hitBall', function () {
        socket.game.ballCollideWithPaddle();
    });
});

function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
}

var ballSize = 15;

function Game(id, player1, player2) {
    this.id = id;
    this.player1 = player1;
    this.player2 = player2;

    this.ballVel = {x: 0, y: 0};
    this.ballPos = {x: (500 / 2) - ballSize / 2, y: (750 / 2) - ballSize / 2};
    this.ballLastPos = {x: 0, y: 0};
    this.ballSpeed = 5;


    this.moveBall = function (x, y) {
        this.ballVel.x += x * this.ballSpeed;
        this.ballVel.y += y * this.ballSpeed;
    };

    this.ballCollideWithPaddle = function () {
        this.ballPos.x = this.ballLastPos.x;
        this.ballPos.y = this.ballLastPos.y;
        this.ballVel.y *= -1;
    };

    var x = Math.random() < 0.5 ? -1 : 1;
    var y = Math.random() < 0.5 ? -1 : 1;
    this.moveBall(x, y);


    this.update = function () {

        this.ballPos.x += this.ballVel.x;
        this.ballPos.y += this.ballVel.y;

        //Check for Left collision
        if (this.ballPos.x <= 0)
            this.moveBall(1, 0);

        //Check for Right collision
        if (this.ballPos.x + ballSize >= width)
            this.moveBall(-1, 0);


        if (this.ballPos.y >= height || this.ballPos.y <= 0) {
            if (this.ballPos.y <= 0)
                player1.wins += 1;
            if (this.ballPos.y >= height)
                player2.wins += 1;

            io.to('Game' + player1.game.id).emit("game winUpdate", {
                player1: {
                    name: player1.name,
                    wins: player1.wins
                },
                player2: {
                    name: player2.name,
                    wins: player2.wins
                }
            });
            this.ballPos = {x: (500 / 2) - ballSize / 2, y: (750 / 2) - ballSize / 2};
        }

        this.ballLastPos.x = this.ballPos.x;
        this.ballLastPos.y = this.ballPos.y;
    };


}