// Flashcards Daten aus PCPP1 Projekt
const cards = [
    {
        q: "Was gibt die `type()`-Funktion in Python zurück, wenn sie auf eine Instanz angewendet wird?",
        a: "Die `type()`-Funktion gibt den Typ der übergebenen Variablen als Objekt oder Klassenname zurück."
    },
    {
        q: "Wie kann man in Python den Inhalt einer Instanzvariablen eines bestimmten Objekts überprüfen?",
        a: "Man kann die Funktion `__dict__` verwenden, um den Inhalt einer Instanzvariablen zu überprüfen. Beispielsweise: `d1 = Demo(100); print('Inhalt von d1:', d1.__dict__)`"
    },
    {
        q: "Wie kann man in Python eine Klassenvariable verwenden, um die Anzahl aller Objekte zu zählen, die aus Unterklassen erstellt wurden?",
        a: "Dies erreicht man durch den Aufruf der Superklasse `__init__` Methode. Beispielsweise kann man in einer Superklasse eine Klassenvariable initialisieren und diese in einer Subklasse erhöhen, um die Anzahl aller Objekte zu zählen, die aus Unterklassen erstellt wurden."
    }
];

let idx = 0;
const total = cards.length;

// DOM Elements
const q = document.getElementById("q");
const a = document.getElementById("a");
const i1 = document.getElementById("i1");
const i2 = document.getElementById("i2");
const t1 = document.getElementById("tot1");
const t2 = document.getElementById("tot2");
const cardEl = document.getElementById("card");

// Render Card
function render() {
    q.textContent = cards[idx].q;
    a.textContent = cards[idx].a;
    i1.textContent = idx + 1;
    i2.textContent = idx + 1;
    t1.textContent = total;
    t2.textContent = total;
}

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

document.getElementById("download").addEventListener("click", () => {
    const blob = new Blob([document.documentElement.outerHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards-pcpp1.html";
    a.click();
    URL.revokeObjectURL(url);
});

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

// Initial Render
render();
