const WORD_BANK = [
  "the",
  "she",
  "he",
  "and",
  "it",
  "if",
  "you",
  "said",
  "was",
  "for",
  "are",
  "with",
  "his",
  "they",
  "my",
  "this",
  "have",
  "from",
  "one",
  "what",
  "there",
  "all",
  "we",
  "when",
  "your",
  "can",
  "use",
  "an",
  "each",
  "which",
  "how",
  "their",
  "will",
  "other",
  "about",
  "out",
  "many",
  "then",
  "them",
  "these",
];

const TOTAL_ROUNDS = 10;
const WIN_MESSAGES = ["Yes! Nice reading!", "Awesome!", "You got it!", "Super reading!"];
const LOSS_MESSAGES = ["Not this one.", "Almost there.", "Close one."];
const BURST_COLORS = ["#FFAEBC", "#A0E7E5", "#B4F8C8", "#FBE7C6"];

const state = {
  round: 1,
  score: 0,
  streak: 0,
  bestStreak: 0,
  targetWord: "",
  hasHeardWord: false,
  choices: [],
  acceptingInput: true,
};

let deferredInstallPrompt = null;
let successAudioContext = null;

const homeScreen = document.getElementById("homeScreen");
const sightWordScreen = document.getElementById("sightWordScreen");
const startSightWordBtn = document.getElementById("startSightWord");
const backHomeBtn = document.getElementById("backHome");
const skipBtn = document.getElementById("skipBtn");
const speakBtn = document.getElementById("speakBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const choicesEl = document.getElementById("choices");
const targetWordEl = document.getElementById("targetWord");
const scoreValueEl = document.getElementById("scoreValue");
const streakValueEl = document.getElementById("streakValue");
const roundValueEl = document.getElementById("roundValue");
const feedbackEl = document.getElementById("feedback");
const resultPanelEl = document.getElementById("resultPanel");
const resultSummaryEl = document.getElementById("resultSummary");
const installBtn = document.getElementById("installBtn");
const burstLayerEl = document.getElementById("burstLayer");

function shuffleArray(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickUniqueWords(count, excluded = new Set()) {
  const pool = WORD_BANK.filter((word) => !excluded.has(word));
  return shuffleArray(pool).slice(0, count);
}

function burstCelebrate() {
  if (!burstLayerEl) {
    return;
  }

  for (let i = 0; i < 14; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.background = BURST_COLORS[i % BURST_COLORS.length];
    spark.style.left = "50%";
    spark.style.top = "52%";
    spark.style.setProperty("--x", `${Math.cos((i / 14) * Math.PI * 2) * (30 + Math.random() * 80)}px`);
    spark.style.setProperty("--y", `${Math.sin((i / 14) * Math.PI * 2) * (20 + Math.random() * 62)}px`);
    burstLayerEl.appendChild(spark);
    window.setTimeout(() => spark.remove(), 780);
  }
}

function showScreen(screen) {
  homeScreen.classList.remove("active");
  sightWordScreen.classList.remove("active");
  screen.classList.add("active");
}

function updateHud() {
  scoreValueEl.textContent = String(state.score);
  streakValueEl.textContent = String(state.streak);
  roundValueEl.textContent = String(Math.min(state.round, TOTAL_ROUNDS));
}

function clearFeedback() {
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("win", "lose");
}

function speakWord(word) {
  if (!("speechSynthesis" in window)) {
    feedbackEl.textContent = "Audio is not available on this device.";
    feedbackEl.classList.remove("win");
    feedbackEl.classList.add("lose");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.78;
  utterance.pitch = 1.2;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function getSuccessAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!successAudioContext) {
    successAudioContext = new AudioContextCtor();
  }

  if (successAudioContext.state === "suspended") {
    successAudioContext.resume().catch(() => {});
  }

  return successAudioContext;
}

function playSuccessJingle() {
  const audioContext = getSuccessAudioContext();
  if (!audioContext) {
    return;
  }

  const notes = [523.25, 659.25, 783.99];
  const noteLength = 0.12;
  const startAt = audioContext.currentTime + 0.01;

  notes.forEach((frequency, index) => {
    const noteStart = startAt + index * noteLength;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, noteStart);

    gainNode.gain.setValueAtTime(0.0001, noteStart);
    gainNode.gain.exponentialRampToValueAtTime(0.11, noteStart + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteLength);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(noteStart);
    oscillator.stop(noteStart + noteLength);
  });
}

function showFoundWord() {
  if (!state.targetWord) {
    return;
  }

  targetWordEl.textContent = state.targetWord;
  targetWordEl.classList.remove("target-word-hidden");
}

function goToNextRound(delayMs) {
  window.setTimeout(() => {
    state.round += 1;
    if (state.round > TOTAL_ROUNDS) {
      finishGame();
      return;
    }

    createRound();
  }, delayMs);
}

function finishGame() {
  state.acceptingInput = false;
  state.targetWord = "";
  choicesEl.innerHTML = "";
  targetWordEl.textContent = "Great Reading!";
  targetWordEl.classList.remove("target-word-hidden");
  speakBtn.textContent = "Hear Word";
  clearFeedback();
  resultSummaryEl.textContent = `You scored ${state.score} points with a best streak of ${state.bestStreak}.`;
  resultPanelEl.classList.remove("hidden");
}

function createRound() {
  state.acceptingInput = true;
  state.hasHeardWord = false;
  clearFeedback();
  resultPanelEl.classList.add("hidden");

  const [targetWord] = pickUniqueWords(1);
  const distractors = pickUniqueWords(3, new Set([targetWord]));
  const choices = shuffleArray([targetWord, ...distractors]);

  state.targetWord = targetWord;
  state.choices = choices;

  targetWordEl.textContent = "";
  targetWordEl.classList.add("target-word-hidden");
  speakBtn.textContent = "Hear Word";
  choicesEl.innerHTML = "";

  choices.forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-btn";
    button.textContent = word;
    button.addEventListener("click", () => handleChoice(word, button));
    choicesEl.appendChild(button);
  });

  updateHud();
}

function handleChoice(selectedWord, buttonEl) {
  if (!state.acceptingInput) {
    return;
  }

  if (!state.hasHeardWord) {
    feedbackEl.textContent = 'Tap "Hear Word" first.';
    feedbackEl.classList.remove("win");
    feedbackEl.classList.add("lose");
    return;
  }

  const isCorrect = selectedWord === state.targetWord;

  if (isCorrect) {
    state.acceptingInput = false;
    showFoundWord();
    state.score += 10;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    buttonEl.classList.add("correct");
    feedbackEl.textContent = pickOne(WIN_MESSAGES);
    feedbackEl.classList.remove("lose");
    feedbackEl.classList.add("win");
    burstCelebrate();
    playSuccessJingle();
    window.setTimeout(() => speakWord(state.targetWord), 250);
    goToNextRound(1000);
  } else {
    state.streak = 0;
    buttonEl.classList.add("wrong");
    buttonEl.disabled = true;
    feedbackEl.textContent = `${pickOne(LOSS_MESSAGES)} Try another card.`;
    feedbackEl.classList.remove("win");
    feedbackEl.classList.add("lose");
  }

  updateHud();
}

function startGame() {
  state.round = 1;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  clearFeedback();
  resultPanelEl.classList.add("hidden");
  showScreen(sightWordScreen);
  createRound();
}

startSightWordBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);

backHomeBtn.addEventListener("click", () => {
  showScreen(homeScreen);
});

skipBtn.addEventListener("click", () => {
  if (!state.acceptingInput) {
    return;
  }

  state.acceptingInput = false;
  state.streak = 0;
  feedbackEl.textContent = "Skipped. Let's hear a new word.";
  feedbackEl.classList.remove("win");
  feedbackEl.classList.add("lose");
  updateHud();
  goToNextRound(850);
});

speakBtn.addEventListener("click", () => {
  if (!state.acceptingInput || !state.targetWord) {
    return;
  }

  state.hasHeardWord = true;
  speakBtn.textContent = "Hear Again";
  feedbackEl.textContent = "Now tap the matching word.";
  feedbackEl.classList.remove("lose");
  feedbackEl.classList.add("win");
  speakWord(state.targetWord);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  installBtn.classList.add("hidden");
  deferredInstallPrompt = null;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      // Surface registration issues in the console without interrupting gameplay.
      console.error("Service worker registration failed:", error);
    });
  });
}
