const socket = new WebSocket("wss://your-websocket-server.com"); // Replace with actual WebSocket server
socket.onmessage = (event) => {
    let data = JSON.parse(event.data);
    
    if (data.type === "playerLost") {
        alert("You Won!"); // Show "You Won" if opponent loses
        setTimeout(() => location.reload(), 2000);
    }
};
const gameBoard = document.getElementById("gameBoard");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const highScoreDisplay = document.getElementById("highScore");
const inputField = document.getElementById("inputField");
const startButton = document.getElementById("startButton");
const howToPlayButton = document.getElementById("howToPlayButton");
const howToPlayModal = document.getElementById("howToPlayModal");
const closeModal = document.querySelector(".close");

const typeSound = document.getElementById("typeSound");
const scoreSound = document.getElementById("scoreSound");
const gameOverSound = document.getElementById("gameOverSound");

let score = 0;
let speed = 2;
let isGameOver = false;
let timeLeft = 60;
let highScore = localStorage.getItem("highScore") || 0;

// Words and their corresponding emojis
const wordsWithEmojis = {
   "apple": "🍎",
    "banana": "🍌",
    "cherry": "🍒",
    "tornado": "🌪️",
    "grape": "🍇",
    "carrot": "🥕",
    "broccoli": "🥦",
    "rainy": "🌧️",
    "cucumber": "🥒",
    "eggplant": "🍆",
    "dog": "🐕",
    "cat": "🐈",
    "guitar": "🎸",
    "piano": "🎹",
    "drum": "🥁",
    "violin": "🎻",
    "trumpet": "🎺",
    "saxophone": "🎷",
    "champagne": "🍾",
    "rabbit": "🐇",
    "bear": "🐻",
    "panda": "🐼",
    "tiger": "🐅",
    "lion": "🦁",
    "balloon": "🎈",
    "book": "📚",
    "pencil": "✏️",
    "scissors": "✂️",
    "clock": "🕒",
    "lightbulb": "💡",
    "phone": "📱",
    "computer": "💻",
    "keyboard": "⌨️",
    "mouse": "🖱️",
    "smile": "😊",
    "laugh": "😂",
    "heart": "❤️",
    "thumbsup": "👍",
    "thumbsdown": "👎",
    "fire": "🔥",
    "clap": "👏",
    "pizza": "🍕",
    "burger": "🍔",
    "fries": "🍟",
    "sushi": "🍣",
};

let words = Object.keys(wordsWithEmojis); // Get the list of words
let activeWords = [];

highScoreDisplay.textContent = highScore;

// Show the How to Play modal
howToPlayButton.addEventListener("click", () => {
    howToPlayModal.style.display = "block";
});

// Close the modal when the close button is clicked
closeModal.addEventListener("click", () => {
    howToPlayModal.style.display = "none";
});

// Close the modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target === howToPlayModal) {
        howToPlayModal.style.display = "none";
    }
});

function createWord() {
    if (isGameOver) return;

    // If all words have been used, reset the array
    if (words.length === 0) {
        words = Object.keys(wordsWithEmojis); // Reset the words array
    }

    // Select a random word and remove it from the array
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomWord = words[randomIndex];
    words.splice(randomIndex, 1); // Remove the word from the array

    let word = document.createElement("div");
    word.classList.add("falling-word");

    // Add the word and its corresponding emoji
    word.innerHTML = `${randomWord} ${wordsWithEmojis[randomWord]}`;

    // Append the word to the game board to measure its width
    gameBoard.appendChild(word);

    // Calculate the maximum left position to keep the word within the container
    const containerWidth = gameBoard.offsetWidth;
    const wordWidth = word.offsetWidth; // Get the width of the word
    const maxLeft = containerWidth - wordWidth; // Ensure the word doesn't overflow

    // Set a random left position within the bounds
    word.style.left = `${Math.random() * maxLeft}px`;
    word.style.top = "0px";

    activeWords.push({ element: word, text: randomWord, top: 0 });
}

function updateWords() {
    activeWords.forEach((wordObj, index) => {
        wordObj.top += speed; // Move the word downward
        wordObj.element.style.top = wordObj.top + "px";
        
        // Check if the word has reached the bottom
        if (wordObj.top >= 400) {
            isGameOver = true;
            
            // Notify opponent that you lost
            socket.send(JSON.stringify({ type: "playerLost" }));
            
            gameOverSound.play().catch(() => {
                console.log("Game-over sound blocked by browser autoplay policy.");
            });
            
            updateHighScore();
            alert("You Lost!"); // Show losing message
            setTimeout(() => location.reload(), 2000);
        }
        
    });

    if (!isGameOver) {
        requestAnimationFrame(updateWords);
    }
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
    } else {
        isGameOver = true;
        gameOverSound.play().catch(() => {
            console.log("Game-over sound blocked by browser autoplay policy.");
        });
        updateHighScore();
        alert(`Time's up! Your score: ${score}. High Score: ${highScore}`);
        setTimeout(() => {
            location.reload();
        }, 1000); // Wait 1 second before reloading
    }
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
        highScoreDisplay.textContent = highScore;
    }
}

function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        let particle = document.createElement("div");
        particle.classList.add("particle");
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        gameBoard.appendChild(particle);
        setTimeout(() => particle.remove(), 500);
    }
}

inputField.addEventListener("input", () => {
    typeSound.currentTime = 0; // Reset sound to start
    typeSound.play().catch(err => console.log("Type sound blocked:", err));

    let typedWord = inputField.value.trim();
    for (let i = 0; i < activeWords.length; i++) {
        if (activeWords[i].text === typedWord) {
            let rect = activeWords[i].element.getBoundingClientRect();
            createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
            
            scoreSound.currentTime = 0; // Reset sound to start
            scoreSound.play().catch(err => console.log("Score sound blocked:", err));

            score++;
            scoreDisplay.textContent = score;
            activeWords[i].element.remove();
            activeWords.splice(i, 1);
            inputField.value = "";
            speed += 0.1;
            break;
        }
    }
});

startButton.addEventListener("click", () => {
    startButton.style.display = "none";
    inputField.focus();

    // Unlock audio by playing a silent sound on user interaction
    typeSound.volume = 0.01; // Set very low volume to avoid disturbance
    typeSound.play().then(() => {
        typeSound.pause();
        typeSound.volume = 1; // Reset volume to normal after unlocking
    }).catch(err => console.log("Audio unlock failed:", err));

    // Start the game
    setInterval(createWord, 2000);
    updateWords();
    setInterval(updateTimer, 1000);
});

document.getElementById("shareButton").addEventListener("click", () => {
    const gameLink = window.location.href; // Use the actual hosted link
    navigator.clipboard.writeText(gameLink).then(() => {
        alert("Game link copied! Share it with a friend.");
    }).catch(err => {
        console.error("Failed to copy:", err);
    });
});
