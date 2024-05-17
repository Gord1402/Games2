let iframe = document.getElementsByTagName("iframe")[0];

var socket = io();

onerror = (event, source, lineno, colno, error) => {socket.emit("error", event, source, lineno, colno, error)};

let params = new URLSearchParams(location.search);
let user_id = params.get("user_id");
let inline_message_id = params.get("inline_message_id");

socket.emit("user_data", user_id, inline_message_id, game_id);



let game_container = document.getElementsByClassName("background-blur")[0];
let panel = document.getElementsByClassName("overlay")[0];
let leader_board_table = document.getElementById("leader_board_table");

let score_label = document.getElementsByClassName("score_label")[0];

function getOrdinalPrefix(rank) {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return rank + "th";
  }


socket.emit("user_data", user_id, inline_message_id)

socket.on("high_scores", (scores)=>{
    console.log(scores);
    let leader_board_html = "";
    let c = 0;
    let user_flag = false;

    scores.sort((a, b) => {return a.position - b.position});

    for (let high_score of scores){
        c++;
        if (c > 10) break
        if (high_score.user.id == user_id) user_flag = true;
        leader_board_html += `<tr>
    <td><img src="../profile/icon/` + high_score.user.id + `" alt="Avatar" class="avatar" /></td>
    <td><span class="username">` + high_score.user.username + ((high_score.user.id == user_id)?" <b>(You)</b>":"") + `</span></td>
    <td><span class="score">` + high_score.score + `</span></td>
    <td><span class="rank">` + getOrdinalPrefix(high_score.position) + `</span></td>
</tr>
`
    }

    if (!user_flag){
        for (let high_score of scores){
            if (high_score.user.id == user_id){
                leader_board_html += `<tr><td><h2>...</h2></td></tr><tr>
    <td><img src="../profile/icon/` + high_score.user.id + `" alt="Avatar" class="avatar" /></td>
    <td><span class="username">` + high_score.user.username + `<b>(You)</b></span></td>
    <td><span class="score">` + high_score.score + `</span></td>
    <td><span class="rank">` + getOrdinalPrefix(high_score.position) + `</span></td>
</tr>
`
            }
        }
    }

    leader_board_table.innerHTML = leader_board_html;
});

socket.emit("get_high_scores")

function panel_start() {
    game_container.classList.remove("background-blur");
    panel.hidden = true;
    start();
}




function start(){
    iframe.contentWindow.postMessage({
        "type": "start",
    });
}




window.addEventListener("message", function (ev) {
    if (!ev.data.type) return;
    let method = ev.data.type;

    let response = {};

    switch (method) {
        case "init":
            socket.emit("load_state")
            socket.once("state", (state) => {
                response = {
                    type: "state",
                    state: state
                };
                iframe.contentWindow.postMessage(response);
            });
            break;

        case "requestPlayerData":
            socket.emit("requestPlayerData");

            socket.once("PlayerData", (username, highScore, avatar) => {
                response = {
                    type: "PlayerData",
                    userID: user_id,
                    name: username,
                    highScore: highScore,
                    avatar: avatar,
                };
                iframe.contentWindow.postMessage(response);
            });
            break;
        
        case "updateScore":
            socket.emit("update_score", ev.data.score);
            score_label.innerHTML = ev.data.score;
            break;
        
        case "gameOver":
            socket.emit("update_high_score");
            socket.emit("save_state", ev.data.state);
            socket.emit("get_high_scores");
            game_container.classList.add("background-blur");
            panel.hidden = false;
            break;
        case "subscribe":
            socket.once(ev.data.to, function (...args){
                iframe.contentWindow.postMessage({type:ev.data.to, data: args});
            });
            break;
        case "socket":
            socket.emit(...ev.data.params);
            break;
    
        default:
            break;
    }
});
