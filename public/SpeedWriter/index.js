let startTime, endTime, wordsTyped, correctWords, wpm, accuracy, quoteText;

const inputField = document.getElementById("input-field");

inputField.addEventListener("paste", (e) => {
    e.preventDefault();
    return false;
});

let started = false;

const quoteElement = document.getElementById("quote");
const timerElement = document.getElementById("timer");
const wpmElement = document.getElementById("wpm");
const accuracyElement = document.getElementById("accuracy");
const quoteDisplayElement = document.getElementById("quote-display");

// inputField.addEventListener('focus', startTimer);
inputField.addEventListener("input", checkWords);

function startTimer() {
    startTime = new Date().getTime();
}

function checkWords(e) {
    console.log(e)
    if (
        e.inputType === "insertFromPaste" ||
        e.inputType === "insertFromComposition"
    ) {
        inputField.value = "";
        return;
    }
    const userInput = inputField.value.trim();
    wordsTyped = userInput.split(" ").length;
    correctWords = 0;
    const quoteWords = quoteText.split(" ");
    let quoteDisplayHtml = "";
    for (let i = 0; i < wordsTyped; i++) {
        if (
            i < quoteWords.length &&
            userInput.split(" ")[i] === quoteWords[i]
        ) {
            correctWords++;
            quoteDisplayHtml += `<span class="correct">${quoteWords[i]} </span>`;
        } else {
            quoteDisplayHtml += `<span class="incorrect">${
                userInput.split(" ")[i]
            } </span>`;
        }
    }
    accuracy = Math.round((correctWords / wordsTyped) * 100);

    calculateWpm();
    if (wordsTyped == quoteWords.length && accuracy == 100) {
        window.parent.postMessage({ type: "gameOver", state: "" });
        started = false;
    }
    quoteDisplayElement.innerHTML = quoteDisplayHtml;
}

function calculateWpm() {
    if (!started) return;
    endTime = new Date().getTime();
    const timeElapsed = (endTime - startTime) / 1000;
    if (accuracy != NaN) {
        wpm = Math.round((correctWords / timeElapsed) * 60);
        window.parent.postMessage({
            type: "updateScore",
            score: Math.round((wpm * accuracy) / 100),
        });
    }
    updateDisplay();
}

function updateDisplay() {
    if ((endTime - startTime) / 1000 >= 60) {
        window.parent.postMessage({ type: "gameOver", state: "" });
        started = false;
    }
    timerElement.textContent = `Time: ${
        Math.round(endTime - startTime) / 1000
    } seconds`;
    wpmElement.textContent = `Words per minute: ${wpm}`;
    accuracyElement.textContent = `Accuracy: ${accuracy}%`;
}

setInterval(calculateWpm, 5);

function set(text) {
    let [wordsTyped, correctWords, wpm, accuracy] = [0, 0, 0, NaN];
    this.setTimeout(() => {
        inputField.disabled = false;
        started = true;
        inputField.focus();
        startTimer();
    }, 1000);
    quoteText = text;
    quoteElement.textContent = `"${quoteText}"`;
    inputField.value = "";
}

function escapeHTML(string) {
    var pre = document.createElement("pre");
    var text = document.createTextNode(string);
    pre.appendChild(text);
    return pre.innerHTML;
}

window.addEventListener("message", function (ev) {
    if (!ev.data.type) return;
    let method = ev.data.type;

    switch (method) {
        case "start":
            inputField.disabled = true;
            let language = ["E", "E", "ru", "ru", "ru", "ja"][
                Math.floor(Math.random() * 6)
            ];
            fetch("https://api.quotable.io/random?minLength=200")
                .then((response) => response.json())
                .then((data) => {
                    if (language == "E") set(data.content);
                    else {
                        fetch(
                            "https://api.mymemory.translated.net/get?q=" +
                                escapeHTML(data.content) +
                                "&langpair=en|" +
                                language
                        )
                            .then((response) => response.json())
                            .then((data) => {
                                set(data.responseData.translatedText);
                            });
                    }
                });
            break;

        default:
            break;
    }
});
