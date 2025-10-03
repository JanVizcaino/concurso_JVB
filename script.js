// --- Variables globales
let correctAnswers = [];
let questionsBlocks = [];
let currentBlock = 0;
let score = 0; 

// --- Event listeners
document.addEventListener("submit", async function (e) {
    // Formulario de nombre
    if (e.target.matches("#name-form")) {
        e.preventDefault();
        const name = e.target.querySelector("input").value;
        sessionStorage.setItem("username", JSON.stringify(name));
        try {
            document.getElementById("user-name").innerHTML = name;
            await startGame();
        } catch (err) {
            console.error("Error empezando el juego:", err);
        }
    }

    // Formulario de preguntas
    if (e.target.matches("#questions-form")) {
        e.preventDefault();

        const container = document.getElementById("questions-grid");
        const cards = container.querySelectorAll(".question-card");
        const userAnswers = [];

        cards.forEach(card => {
            const selected = card.querySelector("input[type='radio']:checked");
            userAnswers.push(selected ? selected.value : null);
        });

        const correct = checkBlockAnswers(userAnswers, currentBlock);

        if (correct) {
            currentBlock++;
            renderNextBlock(container);
        } else {
            alert("Bloque fallado, reiniciando el juego...");
            resetGame();
            const loginTab = document.querySelector("#login-btn");
            if (loginTab) loginTab.click();
        }
    }
});

// --- Funciones principales de juego
async function startGame() {
    const questions = await fetchQuestions();
    const orderedQuestions = setRandomOrder(questions);

    const { questionsWithoutAnswer, answers } = extractAnswers(orderedQuestions);
    correctAnswers = answers;

    // Dividir preguntas en bloques de 2
    for (let i = 0; i < questionsWithoutAnswer.length; i += 2) {
        questionsBlocks.push(questionsWithoutAnswer.slice(i, i + 2));
    }

    const container = document.getElementById("questions-grid");
    renderNextBlock(container);
}

function renderNextBlock(container) {
    // Bloquear todas las preguntas actuales
    blockQuestions();

    if (currentBlock >= questionsBlocks.length) {
        container.innerHTML = "<p class=\"col-span-12\">¡Has completado el quiz!</p>";
        return;
    }

    const block = questionsBlocks[currentBlock];
    block.forEach((question, index) => {
        const card = renderQuestionExact({
            question: question.pregunta,
            index: currentBlock * 2 + index, 
            opciones: question.opciones
        });
        container.appendChild(card);
    });
}

async function resetGame() {
    await saveLog(score, sessionStorage.getItem("username"));

    correctAnswers = [];
    questionsBlocks = [];
    currentBlock = 0;
    score = 0;
    sessionStorage.removeItem("username");

    const container = document.getElementById("questions-grid");
    if (container) container.innerHTML = "";
    document.getElementById("user-name").innerHTML = "";
}

// --- Funciones de renderizado
function renderQuestionExact(options) {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-card col-span-6 mb-4 p-4 border rounded";

    const preguntaEl = document.createElement("p");
    preguntaEl.textContent = `${options.index + 1}. ${options.question}`;
    preguntaEl.className = "font-semibold mb-2";
    questionDiv.appendChild(preguntaEl);

    (options.opciones || []).forEach((op, i) => {
        const label = document.createElement("label");
        label.className = "block mb-1";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `pregunta-${options.index}`; 
        input.value = op;
        input.className = "mr-2";

        label.appendChild(input);
        label.appendChild(document.createTextNode(op));

        questionDiv.appendChild(label);
    });

    return questionDiv;
}

function blockQuestions() {
    document.querySelectorAll(".question-card").forEach(question => {
        question.querySelectorAll("input").forEach(input => {
            input.disabled = true; 
        });
    });
}

// --- Funciones de lógica
function checkBlockAnswers(userAnswers, blockIndex) {
    const startIndex = blockIndex * 2;
    let allCorrect = true;

    userAnswers.forEach((answer, i) => {
        const globalIndex = startIndex + i;
        const card = document.querySelectorAll(".question-card")[i];
        if (answer === correctAnswers[globalIndex]) {
            card.classList.add("bg-green-300");
            card.classList.remove("bg-red-300");
            score++;
        } else {
            card.classList.add("bg-red-300");
            card.classList.remove("bg-green-300");
            allCorrect = false;
        }
    });

    return allCorrect;
}

function extractAnswers(array) {
    const answers = [];
    const questionsWithoutAnswer = array.map(q => {
        answers.push(q.respuesta);
        const { respuesta, ...resto } = q;
        return resto;
    });
    return { questionsWithoutAnswer, answers };
}

function setRandomOrder(array) {
    return [...array].sort(() => Math.random() - 0.5);
}


// --- Funciones auxiliares
async function fetchQuestions() {
    try {
        const response = await fetch('/assets/questions.json');
        if (!response.ok) throw new Error("Error en la respuesta: " + response.status);
        return await response.json(); 
    } catch (error) {
        console.error("Hubo un problema con el fetch:", error);
        return []; 
    }
}

async function saveLog(score, username) {
    const logs = JSON.parse(localStorage.getItem("quizLogs")) || [];
    const newLog = {
        user: JSON.parse(username), 
        date: new Date().toISOString(),
        correctAnswers: score
    };
    logs.push(newLog);
    localStorage.setItem("quizLogs", JSON.stringify(logs));
    console.log("Log guardado en localStorage:", newLog);
}
