const express = require("express");
const fs = require("fs");
const app = express();
const http = require("https");

const winston = require('winston');

const logFormatter = winston.format.printf((info) => {
    let { timestamp, level, stack, message } = info;
    message = stack || message;
    return `${timestamp} ${level}: ${message}`;
  });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(),
                winston.format.simple(), winston.format.timestamp(), logFormatter),
      }),
  ],
});


var base64Stream = require("base64Stream");

const server = http.createServer(
    {
        key: fs.readFileSync("C:/Certbot/live/gr1042.ddns.net/privkey.pem"),
        cert: fs.readFileSync("C:/Certbot/live/gr1042.ddns.net/fullchain.pem"),
    },
    app
);
const { Server } = require("socket.io");
const io = new Server(server);

const TelegramBot = require("node-telegram-bot-api");
const ns = require("@stdlib/string-base-distances");

let sql = require("sql");

sql.setDialect("sqlite");

let user = sql.define({
    name: "user",
    columns: [
        { name: "id", dataType: "Integer", primaryKey: true },
        { name: "first_name", dataType: "String" },
        { name: "last_name", dataType: "String" },
        { name: "username", dataType: "String" },
    ],
});

let game_states = sql.define({
    name: "game_states",
    columns: [
        { name: "user_id", dataType: "Integer", primaryKey: true },
        { name: "game_id", dataType: "String", primaryKey: true },
        { name: "state", dataType: "String" },
    ],
});

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db.db");

db.run(user.create().ifNotExists().toQuery().text);
db.run(game_states.create().ifNotExists().toQuery().text);

//SunshineSolitaire

const domain = "https://gr1042.ddns.net:5786/";

const games_list = {
    motofx: ["MotoFX/", "Moto FX"],
    motofx2: ["MotoFX2/", "Moto FX 2"],
    mancitystriker: ["ManCityStriker/", "Man City Striker 3D"],
    keepitup: ["KeepItUp/", "Keep It Up"],
    hoopshot: ["HoopShot/", "Hoop Shot"],
    globorun: ["GloboRun/", "Globo Run"],
    chess: ["Chess/", "Chess"],
    speedwriter: ["SpeedWriter/", "Speed Writer"],
};
const token = "7066760884:AAGLqZDsgMIbDx0ANfJr1wGI586V8wxNJw8";
const telegram_bot = new TelegramBot(token, { polling: true });

app.use(express.static(__dirname + "/public"));

app.get("/profile/icon/:user_id", async (req, res) => {
    try {
        console.log(req.params.user_id);
        photos = await telegram_bot.getUserProfilePhotos(
            Number(req.params.user_id)
        );
        console.log(photos);
        if (photos.total_count == 0)
            res.sendFile(__dirname + "/public/default.jpg");
        else {
            res.setHeader("Content-Type", "image/jpeg");
            telegram_bot.getFileStream(photos.photos[0][0].file_id).pipe(res);
        }
    } catch {
        res.sendFile(__dirname + "/public/default.jpg");
    }
});

io.on("connection", async (socket) => {
    socket.on("rick", () => {
        logger.info("Someone rickrolled!");
    })
    socket.on("error", (event, source, lineno, colno, error) => {
        logger.error("CLIENT ERROR:",new Date() ,event, source, lineno, colno, error)
    })
    socket.once("user_data", (user_id, inline_message_id, game_id) => {
        logger.info("User data");

        let current_score = 0;

        socket.on("update_score", (score) => {
            current_score = score;
        });

        socket.on("update_high_score", () => {
            try {
                telegram_bot.setGameScore(user_id, current_score, {
                    inline_message_id: inline_message_id,
                });
            } catch {}
        });

        socket.on("get_high_scores", async () => {
            socket.emit(
                "high_scores",
                await telegram_bot.getGameHighScores(user_id, {
                    inline_message_id: inline_message_id,
                })
            );
        });

        socket.on("load_state", async () => {
            let query = game_states
                .select(game_states.star())
                .where(
                    game_states.user_id
                        .equals(user_id)
                        .and(game_states.game_id.equals(game_id))
                )
                .toQuery();
            db.get(query.text, query.values, async (error, row) => {
                if (error) return;
                if (row) return socket.emit("state", row.state);
                socket.emit("state", null);
            });
        });

        socket.on("save_state", async (state) => {
            let query = game_states
                .select(game_states.star())
                .where(
                    game_states.user_id
                        .equals(user_id)
                        .and(game_states.game_id.equals(game_id))
                )
                .toQuery();
            db.get(query.text, query.values, async (error, row) => {
                if (error) return;
                if (row) {
                    query = game_states
                        .update({ state: state })
                        .where(
                            game_states.user_id
                                .equals(user_id)
                                .and(game_states.game_id.equals(game_id))
                        )
                        .toQuery();
                    db.run(query.text, query.values);
                } else {
                    query = game_states
                        .insert({
                            user_id: user_id,
                            game_id: game_id,
                            state: state,
                        })
                        .toQuery();
                    db.run(query.text, query.values);
                }
            });
        });

        socket.on("requestPlayerData", async () => {
            let query = user
                .select(user.star())
                .where(user.id.equals(user_id))
                .toQuery();
            db.get(query.text, query.values, async (error, row) => {
                if (error) return;
                let username = row.username;

                let high_score = 0;
                let scores = await telegram_bot.getGameHighScores(user_id, {
                    inline_message_id: inline_message_id,
                });

                for (let score of scores) {
                    if (score.user.id == user_id) {
                        high_score = score.score;
                        break;
                    }
                }

                photos = await telegram_bot.getUserProfilePhotos(user_id);

                let stream;
                if (photos.total_count == 0)
                    stream = fs.createReadStream("public/default.jpg");
                else
                    stream = telegram_bot.getFileStream(
                        photos.photos[0][0].file_id
                    );

                let basestream = new base64Stream.BufferedStreamToBase64();

                let base64string = "data:image/jpeg;base64,";

                basestream.on("data", (baseString) => {
                    base64string += baseString;
                });

                basestream.on("end", () => {
                    socket.emit(
                        "PlayerData",
                        username,
                        high_score,
                        base64string
                    );
                });

                stream.pipe(basestream);
            });
        });
    });
});

server.listen(5786, () => {
    logger.info("listening on *:5786");
});

// Bot side

function makeid(length) {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
        counter += 1;
    }
    return result;
}

telegram_bot.on("polling_error", logger.error);

// telegram_bot.on("text", async (msg) => {
//     if (msg.text == "/start") {
//       telegram_bot.sendMessage(
//         msg.chat.id,
//         "OpenGames - игровой бот. Здесь собраны игры из бота g",
//         options
//       );
//     }
//   });

telegram_bot.on("callback_query", (callbackQuery) => {
    logger.debug(callbackQuery);
    if (callbackQuery.game_short_name) {
        let query = user
            .insert({
                id: callbackQuery.from.id,
                first_name: callbackQuery.from.first_name,
                last_name: callbackQuery.from.last_name || "",
                username:
                    callbackQuery.from.username ||
                    callbackQuery.from.first_name,
            })
            .toQuery();

        db.run(query.text, (params = query.values), function (err) {});

        telegram_bot.answerCallbackQuery(callbackQuery.id, {
            url:
                domain +
                games_list[callbackQuery.game_short_name][0] +
                "?user_id=" +
                callbackQuery.from.id +
                "&inline_message_id=" +
                callbackQuery.inline_message_id,
        });
    }
});

telegram_bot.on("inline_query", (inlineQuery) => {
    logger.debug(inlineQuery);
    let result = [];
    if (inlineQuery.query.length > 0) {
        for (const [key, value] of Object.entries(games_list)) {
            if (value[1].startsWith(inlineQuery.query)) {
                result.push({
                    type: "game",
                    id: makeid(32),
                    game_short_name: key,
                });
            }
        }
    } else {
        for (const [key, value] of Object.entries(games_list)) {
            result.push({ type: "game", id: makeid(32), game_short_name: key });
        }
    }
    telegram_bot.answerInlineQuery(inlineQuery.id, result);
});

process.on("uncaughtException", (err) => {
    logger.error(err);
});

process.on("unhandledRejection", (err) => {
    logger.error(err);
});
