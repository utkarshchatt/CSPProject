// =========================
// CONFIG
// =========================
const BASE_URL = "http://127.0.0.1:8000";


// =========================
// PAGE NAVIGATION
// =========================
function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}



// =========================
// ROLE EXPLAINER SEARCH
// =========================
document.getElementById("jobSearch").addEventListener("input", async function () {
    const query = this.value.trim();
    const suggestionsBox = document.getElementById("suggestions");

    if (query.length < 2) {
        suggestionsBox.innerHTML = "";
        return;
    }

    const res = await fetch(`${BASE_URL}/roles?search=${query}`);
    const data = await res.json();

    suggestionsBox.innerHTML = data.map(role =>
        `<div class="suggestion-item" onclick="loadRole(${role.id})">${role.title}</div>`
    ).join("");
});


// Load full role details
async function loadRole(roleId) {
    document.getElementById("loader").style.display = "block";

    const res = await fetch(`${BASE_URL}/roles/${roleId}`);
    const role = await res.json();

    document.getElementById("loader").style.display = "none";

    document.getElementById("jobResult").innerHTML = `
        <h2>${role.title}</h2>
        <p>${role.summary || ""}</p>
        <h3>Skills Required</h3>
        <ul>
            ${role.skills.map(s => `<li>${s.name}</li>`).join("")}
        </ul>
        <h3>Traits</h3>
        <pre>${JSON.stringify(role.traits, null, 2)}</pre>
    `;
}



// =========================
// ROADMAP SEARCH (same as role search)
// =========================
document.getElementById("roadmapSearch").addEventListener("input", async function () {
    const query = this.value.trim();
    const suggestions = document.getElementById("roadmapSuggestions");

    if (query.length < 2) {
        suggestions.innerHTML = "";
        return;
    }

    const res = await fetch(`${BASE_URL}/roles?search=${query}`);
    const data = await res.json();

    suggestions.innerHTML = data.map(role =>
        `<div class="suggestion-item" onclick="loadRoadmap(${role.id})">${role.title}</div>`
    ).join("");
});


// Load roadmap/skillmap
async function loadRoadmap(roleId) {
    const res = await fetch(`${BASE_URL}/roles/${roleId}`);
    const role = await res.json();

    document.getElementById("roadmapResult").innerHTML = `
        <h2>${role.title}</h2>
        <h3>Skills Required</h3>
        <ul>${role.skills.map(s => `<li>${s.name}</li>`).join("")}</ul>
        <h3>Traits Weightage</h3>
        <pre>${JSON.stringify(role.traits, null, 2)}</pre>
    `;
}



// =========================
// GUIDE QUIZ (Flow-based)
// =========================
async function startQuiz() {
    const res = await fetch(`${BASE_URL}/guide/start`);
    const data = await res.json();
    loadGuideQuestion(data);
}

function loadGuideQuestion(data) {
    document.getElementById("guideSection").innerHTML = `
        <h3>${data.question}</h3>
        ${data.options.map(opt =>
            `<button onclick="nextGuide('${opt}')">${opt}</button>`
        ).join("")}
    `;
}

async function nextGuide(answer) {
    const res = await fetch(`${BASE_URL}/guide/next?answer=${answer}`);
    const data = await res.json();

    if (data.done) {
        finishGuideQuiz();
    } else {
        loadGuideQuestion(data);
    }
}

async function finishGuideQuiz() {
    const res = await fetch(`${BASE_URL}/guide/complete`);
    const result = await res.json();

    document.getElementById("guideSection").innerHTML = `
        <h2>Recommended Roles</h2>
        <ul>${result.map(r => `<li>${r.title}</li>`).join("")}</ul>
    `;
}



// =========================
// PERSONALITY QUIZ SUBMIT
// =========================
async function submitPersonalityQuiz(userId, answers) {
    const res = await fetch(`${BASE_URL}/quiz/submit?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
    });

    const data = await res.json();
    console.log("Quiz Result:", data);
    return data;
}
