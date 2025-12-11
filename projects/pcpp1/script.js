// PCPP1 - Python OOP Lernkarten (AI)
// Karten werden aus cards.json geladen

let cards = [];
let idx = 0;
let total = 0;

// DOM Elements werden nach dem Laden initialisiert
let q, a, i1, i2, t1, t2, cardEl;

// Initialisiere DOM-Elemente und Event-Listener
function initializeApp() {
    q = document.getElementById("q");
    a = document.getElementById("a");
    i1 = document.getElementById("i1");
    i2 = document.getElementById("i2");
    t1 = document.getElementById("tot1");
    t2 = document.getElementById("tot2");
    cardEl = document.getElementById("card");
    
    setupEventListeners();
    loadCards();
}

// Lade Karten aus JSON-Datei
async function loadCards() {
    try {
        const response = await fetch('cards.json');
        const data = await response.json();
        cards = data.cards;
        total = cards.length;
        
        if (cards.length > 0) {
            render();
            console.log(`✓ ${cards.length} Karten erfolgreich geladen!`);
        } else {
            console.error('Keine Karten gefunden!');
            q.textContent = 'Keine Karten gefunden!';
            a.textContent = 'Die cards.json Datei ist leer.';
        }
    } catch (error) {
        console.error('Fehler beim Laden der Karten:', error);
        q.textContent = 'Fehler beim Laden!';
        a.textContent = 'Konnte cards.json nicht laden. Bitte Konsole prüfen (F12).';
    }
}

// Render Card
function render() {
    if (cards.length === 0) return;
    
    q.textContent = cards[idx].q;
    a.textContent = cards[idx].a;
    i1.textContent = idx + 1;
    i2.textContent = idx + 1;
    t1.textContent = total;
    t2.textContent = total;
}

// Setup Event Listeners
function setupEventListeners() {
    // Card Click to Flip
    cardEl.addEventListener("click", () => cardEl.classList.toggle("flipped"));

// Button Events
document.getElementById("flip").addEventListener("click", () => {
    cardEl.classList.toggle("flipped");
});

document.getElementById("next").addEventListener("click", () => {
    idx = (idx + 1) % total;
    cardEl.classList.remove("flipped");
    render();
});

document.getElementById("prev").addEventListener("click", () => {
    idx = (idx - 1 + total) % total;
    cardEl.classList.remove("flipped");
    render();
});

document.getElementById("shuffle").addEventListener("click", () => {
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    idx = 0;
    cardEl.classList.remove("flipped");
    render();
});

document.getElementById("showall").addEventListener("click", () => {
    const grid = document.getElementById("allcards");
    if (grid.style.display === "none" || grid.style.display === "") {
        grid.innerHTML = "";
        grid.style.display = "grid";
        cards.forEach((c, i) => {
            const d = document.createElement("div");
            d.className = "mini";
            d.innerHTML = `<b>${i + 1}. ${c.q}</b><br>${c.a}`;
            grid.appendChild(d);
        });
    } else {
        grid.style.display = "none";
    }
});

// Touch/Swipe Support for Mobile
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

cardEl.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

cardEl.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, false);

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = touchEndY - touchStartY;
    
    // Check if horizontal swipe is more significant than vertical
    if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY)) {
        // Horizontal swipe
        if (swipeDistanceX > swipeThreshold) {
            // Swipe right - previous card
            idx = (idx - 1 + total) % total;
            cardEl.classList.remove("flipped");
            render();
        } else if (swipeDistanceX < -swipeThreshold) {
            // Swipe left - next card
            idx = (idx + 1) % total;
            cardEl.classList.remove("flipped");
            render();
        }
    }
}

    // Keyboard Navigation
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
            idx = (idx + 1) % total;
            cardEl.classList.remove("flipped");
            render();
        } else if (e.key === "ArrowLeft") {
            idx = (idx - 1 + total) % total;
            cardEl.classList.remove("flipped");
            render();
        } else if (e.key === " ") {
            e.preventDefault();
            cardEl.classList.toggle("flipped");
        }
    });
}

// Starte App wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', initializeApp);
