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

//Match players looking for queue
setInterval(function () {
    if (waitingQueue.length < 2)
        return;

    var index = Math.floor(Math.random() * waitingQueue.length);
    var playerOne = waitingQueue[index];
    waitingQueue.splice(index, 1);

    index = Math.floor(Math.random() * waitingQueue.length);
    var playerTwo = waitingQueue[index];
    waitingQueue.splice(index, 1);

    var room = "Game" + gameCount++;
    var game = new Game(gameCount, playerOne, playerTwo);

    playerOne.join(room);
    playerOne.game = game;
    playerOne.curRoom = room;

    playerTwo.join(room);
    playerTwo.game = game;
    playerTwo.curRoom = room;
    var ball = game.ball;
    ball.d = game.ballSize;

    playerOne.emit('game join', {
        name: playerTwo.playerName,
        ball: ball
    });
    playerTwo.emit('game join', {
        name: playerOne.playerName,
        ball: ball
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
    socket.on('paddle hitBall', function (data) {

        if(socket !== socket.game.lastHit) {
            var dPos = {x: data.x, y: data.y};
            if (socket === socket.game.player2) {
                var d = rotate(width / 2, height / 2, data.x, data.y, 180);
                dPos.x = d[0];
                dPos.y = d[1];
            }
            socket.game.ballCollideWithPaddle(dPos);
            socket.game.lastHit = socket;
        }
    });
    socket.on('disconnect', function () {
        leave(socket);
    });
});

function leave(socket) {
    var index = waitingQueue.indexOf(socket);
    if (index != -1)
        waitingQueue.splice(index, 1);

    if (socket.game) {
        var w;
        var p;
        if (socket == socket.game.player1) {
            p = socket.game.player2.playerName;
            w = socket.game.player1;
        } else {
            p = socket.game.player1.playerName;
            w = socket.game.player2;
        }
        io.to(socket.curRoom).emit('player left', {name: p});
        w.curRoom = null;
        w.game = null;
    }
}

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
    this.lastHit = null;
    this.ballSize = 15;

    this.ballVel = {x: 0, y: 0};
    this.ballPos = {x: (500 / 2) - ballSize / 2, y: (750 / 2) - ballSize / 2};
    this.ballLastPos = {x: 0, y: 0};
    this.ballSpeed = 5;


    this.moveBall = function (x, y) {
        this.ballVel.x += x * this.ballSpeed;
        this.ballVel.y += y * this.ballSpeed;
    };

    this.ballCollideWithPaddle = function (data) {
        this.ballPos.x = data.x;
        this.ballPos.y = data.y;
        this.ballVel.y *= -1;
    };

    var x = Math.random() < 0.5 ? -1 : 1;
    var y = Math.random() < 0.5 ? -1 : 1;
    this.moveBall(x, y);

    this.resetBall = function(){
        this.ballPos = {x: (500 / 2) - ballSize / 2, y: (750 / 2) - ballSize / 2};
        var x = Math.random() < 0.5 ? -1 : 1;
        var y = Math.random() < 0.5 ? -1 : 1;
        this.ballVel.x = x * this.ballSpeed;
        this.ballVel.y = y * this.ballSpeed;
        this.lastHit = null;
    };



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

            io.to(player1.curRoom).emit("game win", {
                player1: {
                    name: player1.playerName,
                    wins: player1.wins
                },
                player2: {
                    name: player2.playerName,
                    wins: player2.wins
                }
            });
            //Reset Ball
            this.resetBall();
        }


        this.ballLastPos.x = this.ballPos.x;
        this.ballLastPos.y = this.ballPos.y;
    };


}