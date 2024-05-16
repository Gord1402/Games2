let board = null;
let game = new Chess();

let score = 0;

let whiteSquareGrey = "#a9a9a9";
let blackSquareGrey = "#696969";

let selected_moves = [];

let player_best_move_score = minimax(game, 3, -Infinity, +Infinity, true)[1];

function removeGreySquares() {
    $("#board1 .square-55d63").css("background", "");
}

function greySquare(square) {
    let $square = $("#board1 .square-" + square);

    let background = whiteSquareGrey;
    if ($square.hasClass("black-3c85d")) {
        background = blackSquareGrey;
    }

    $square.css("background", background);
}

function click(elem){
    for (let i = 0; i < selected_moves.length; i++) {
        if (elem.getAttribute("data-square") == selected_moves[i].to){
            let move = selected_moves[i]
            game.move(selected_moves[i]);
            board.position(game.fen());

            
            window.setTimeout(()=>{
                if (game.game_over()){
                    score += 500;
                    window.parent.postMessage({type:"updateScore", score: Math.round(score)});
                    window.parent.postMessage({type:"gameOver", state:""});
                    return
                }            
                game.undo();
                let move_score = minimax_for_move(game, move, 3, -Infinity, +Infinity, game.turn() == "w");
                game.move(move);

                
                if (player_best_move_score > 0) score += (move_score / player_best_move_score) * 100;
                window.parent.postMessage({type:"updateScore", score: Math.round(score)});
        
                makeMinMaxMove()
            } , 250);
            selected_moves = [];
            removeGreySquares()
            return;
        }
    }

    selected_moves = [];
    removeGreySquares()

    let moves = game.moves({
        square: elem.getAttribute("data-square"),
        verbose: true,
        promotion: "q",
    });

    if (moves.length === 0) return;
    for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
    selected_moves = moves;
}


function makeMinMaxMove() {
    let maximizing = game.turn() == "w";
    let [bestMove, bestEval] = minimax(game, 3, -Infinity, +Infinity, maximizing);
    // console.log(bestEval)
    // console.log(minimax_for_move(game,bestMove, 3, -Infinity, +Infinity, maximizing))
    game.move(bestMove);
    window.setTimeout(()=>{
        if (game.game_over()){
            score -= 600;
            window.parent.postMessage({type:"updateScore", score: Math.round(score)});
            window.parent.postMessage({type:"gameOver", state:""});
            return
        }
    }, 1000);
    board.position(game.fen());
    player_best_move_score =  minimax(game, 3, -Infinity, +Infinity, !maximizing)[1];
}

function makeRandomMove() {
    let possibleMoves = game.moves();

    if (possibleMoves.length === 0) return;

    let randomIdx = Math.floor(Math.random() * possibleMoves.length);
    game.move(possibleMoves[randomIdx]);
    board.position(game.fen());
}





function onSnapEnd() {
    board.position(game.fen());
}

function draw() {
    window.parent.postMessage({type:"gameOver", state:""});
}

function restart(){
    board.start();
    game.reset();
    score = 0;
    player_best_move_score = minimax(game, 3, -Infinity, +Infinity, true)[1];
}

let config = {
    draggable: false,
    position: "start",
    onSnapEnd: onSnapEnd,
};

board = Chessboard("board1", config);

for (let square of document.getElementsByClassName("square-55d63")){
    square.onclick = () =>{
        click(square);
    };
}



window.addEventListener("message", function (ev) {
    if (!ev.data.type) return;
    let method = ev.data.type;

    switch (method) {
        case "start":
            restart();
            break;

        default:
            break;
    }
})
