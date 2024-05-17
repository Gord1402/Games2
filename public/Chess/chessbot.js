function shuffle(array){
    for(let j, x, i = array.length; i; j = Math.floor(Math.random() * i), x = array[--i], array[i] = array[j], array[j] = x);
    return array;
  }

function minimax(position, depth, alpha, beta, maximizing_player) {
    // if terminal state (game over) or max depth (depth == 0)
    if (position.in_checkmate() || position.in_draw() || depth == 0) {
        return [null, evaluatePosition(position)];
    }

    let bestMove;
    if (maximizing_player) {
        // find move with best possible score
        let maxEval = -Infinity;
        let possibleMoves = shuffle(position.moves());
        for (let i = 0; i < possibleMoves.length; i++) {
            position.move(possibleMoves[i]);
            let [childBestMove, childEval] = minimax(
                position,
                depth - 1,
                alpha,
                beta,
                false
            );
            if (childEval > maxEval) {
                maxEval = childEval;
                bestMove = possibleMoves[i];
            }
            position.undo();

            // alpha beta pruning
            alpha = Math.max(alpha, childEval);
            if (beta <= alpha) {
                break;
            }
        }
        return [bestMove, maxEval];
    } else {
        // find move with worst possible score (for maximizer)
        let minEval = +Infinity;
        let possibleMoves = shuffle(position.moves());
        for (let i = 0; i < possibleMoves.length; i++) {
            position.move(possibleMoves[i]);
            let [childBestMove, childEval] = minimax(
                position,
                depth - 1,
                alpha,
                beta,
                true
            );
            if (childEval < minEval) {
                minEval = childEval;
                bestMove = possibleMoves[i];
            }
            position.undo();

            // alpha beta pruning
            beta = Math.min(beta, childEval);
            if (beta <= alpha) {
                break;
            }
        }
        return [bestMove, minEval];
    }
}

function minimax_for_move(position, move, depth, alpha, beta, maximizing_player) {
    // if terminal state (game over) or max depth (depth == 0)
    if (position.in_checkmate() || position.in_draw() || depth == 0) {
        return [null, evaluatePosition(position)];
    }

    let bestMove;
    if (maximizing_player) {
        // find move with best possible score
        let maxEval = -Infinity;
        let possibleMoves = [move];
        for (let i = 0; i < possibleMoves.length; i++) {
            position.move(possibleMoves[i]);
            let [childBestMove, childEval] = minimax(
                position,
                depth - 1,
                alpha,
                beta,
                false
            );
            if (childEval > maxEval) {
                maxEval = childEval;
                bestMove = possibleMoves[i];
            }
            position.undo();

            // alpha beta pruning
            alpha = Math.max(alpha, childEval);
            if (beta <= alpha) {
                break;
            }
        }
        return maxEval;
    } else {
        // find move with worst possible score (for maximizer)
        let minEval = +Infinity;
        let possibleMoves = [move];
        for (let i = 0; i < possibleMoves.length; i++) {
            position.move(possibleMoves[i]);
            let [childBestMove, childEval] = minimax(
                position,
                depth - 1,
                alpha,
                beta,
                true
            );
            if (childEval < minEval) {
                minEval = childEval;
                bestMove = possibleMoves[i];
            }
            position.undo();

            // alpha beta pruning
            beta = Math.min(beta, childEval);
            if (beta <= alpha) {
                break;
            }
        }
        return minEval;
    }
}

let pieceValues = {
    p: 10,
    n: 30,
    b: 30,
    r: 50,
    q: 90,
    k: 900,
};

function evaluateBoard(board) {
    let evaluation = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            evaluation += getPieceValue(board[i][j]);
        }
    }
    return evaluation;
}

function getPieceValue(piece) {
    if (piece == null) {
        return 0;
    }

    if (piece.color == "w") {
        return pieceValues[piece.type];
    } else {
        return -pieceValues[piece.type];
    }
}
let checkmate_eval = 900;
function evaluatePosition(position) {
    if (position.in_checkmate()) {
        return position.turn() == "w" ? -checkmate_eval : checkmate_eval;
    } else if (position.in_draw()) {
        return 0;
    } else {
        return evaluateBoard(position.board());
    }
}
