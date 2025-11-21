// =========================
// CONFIG
// =========================
const BASE_URL = "http://127.0.0.1:8000";

document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ===========================
// SECTION TOGGLING
// ===========================
function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}


// ===========================
// ROLE EXPLAINER — Search + Fetch
// ===========================
document.getElementById("jobSearch").addEventListener("input", async function () {
    const q = this.value.trim();

    if (q.length < 2) {
        document.getElementById("suggestions").innerHTML = "";
        return;
    }

    const res = await fetch(`${BASE_URL}/roles?search=${q}`);
    const data = await res.json();

    let html = "";
    data.forEach(role => {
        html += `<div class="suggestion" onclick="loadRole('${role.slug}')">${role.title}</div>`;
    });

    document.getElementById("suggestions").innerHTML = html;
});

async function loadRole(slug) {
    document.getElementById("loader").style.display = "block";

    const res = await fetch(`${BASE_URL}/roles/${slug}`);
    const data = await res.json();

    document.getElementById("loader").style.display = "none";

    document.getElementById("jobResult").innerHTML = `
        <h2>${data.title}</h2>
        <p>${data.summary || ""}</p>
        <p>${data.body || ""}</p>
        <h3>Skills</h3>
        <ul>${data.skills.map(s => `<li>${s.name}</li>`).join("")}</ul>
    `;

    document.getElementById("suggestions").innerHTML = "";
}


// =========================
// ROADMAP SEARCH
// =========================
// =========================
// ROADMAP - Show Learning Path
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
        `<div class="suggestion-item" onclick="loadRoadmap('${role.slug}')">${role.title}</div>`
    ).join("");
});

async function loadRoadmap(slug) {
    try {
        // Fetch role details
        const res = await fetch(`${BASE_URL}/roles/${slug}`);
        const role = await res.json();
        
        document.getElementById("roadmapSuggestions").innerHTML = "";
        
        let html = `
            <div class="roadmap-detail">
                <h2>Career Roadmap: ${role.title}</h2>
                <p>${role.summary || role.description || ""}</p>
                
                <h3>📚 Skills You Need</h3>
                <ul class="skills-list">
        `;
        
        if (role.skills && role.skills.length > 0) {
            role.skills.forEach((skill, index) => {
                html += `
                    <li>
                        <strong>Step ${index + 1}:</strong> ${skill.name || skill}
                        ${skill.description ? `<p>${skill.description}</p>` : ''}
                    </li>
                `;
            });
        } else {
            html += `<li>No specific skills listed yet.</li>`;
        }
        
        html += `
                </ul>
                
                <h3>🎯 Recommended Learning Path</h3>
                <ol class="learning-path">
                    <li>
                        <strong>Foundation (0-3 months)</strong>
                        <p>Learn the basics and fundamental concepts</p>
                    </li>
                    <li>
                        <strong>Intermediate (3-6 months)</strong>
                        <p>Build practical projects and gain hands-on experience</p>
                    </li>
                    <li>
                        <strong>Advanced (6-12 months)</strong>
                        <p>Master advanced topics and build portfolio projects</p>
                    </li>
                    <li>
                        <strong>Job Ready (12+ months)</strong>
                        <p>Apply for positions and continue learning on the job</p>
                    </li>
                </ol>
                
                <div class="roadmap-actions">
                    <button onclick="showSection('roadmap')">Search Another Role</button>
                    <button onclick="loadRole('${slug}'); showSection('role')">View Full Role Details</button>
                </div>
            </div>
        `;
        
        document.getElementById("roadmapResult").innerHTML = html;
        
    } catch (error) {
        console.error("Error loading roadmap:", error);
        document.getElementById("roadmapResult").innerHTML = 
            `<p style="color: red;">Error loading roadmap. Please try again.</p>`;
    }
}

// =========================
// GUIDE QUIZ (Multiple Choice)
// =========================
async function startQuiz() {
    console.log("startQuiz function called!"); // Debug
    
    try {
        console.log("Fetching from:", `${BASE_URL}/guide/questions`); // Debug
        const res = await fetch(`${BASE_URL}/guide/questions`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        console.log("Full quiz data received:", data); // Debug
        console.log("Questions array:", data.questions); // Debug
        
        if (data.questions && data.questions.length > 0) {
            console.log("First question:", data.questions[0]); // Debug
            console.log("First question options:", data.questions[0].options); // Debug
        }

        let html = `<form id="guideForm">`;

        if (data.questions && data.questions.length > 0) {
            data.questions.forEach((q, index) => {
                console.log(`Processing question ${index}:`, q); // Debug
                
                html += `
                    <div class="question">
                        <p><strong>Q${index + 1}:</strong> ${q.question}</p>
                        <div class="options">
                `;
                
                if (q.options && Array.isArray(q.options) && q.options.length > 0) {
                    q.options.forEach((option, optIndex) => {
                        console.log(`Question ${index}, Option ${optIndex}:`, option); // Debug
                        
                        // Handle both string options and object options
                        let optionText, optionValue;
                        
                        if (typeof option === 'string') {
                            // Option is a plain string
                            optionText = option;
                            optionValue = optIndex;
                        } else if (typeof option === 'object') {
                            // Option is an object with text/value properties
                            optionText = option.text || option.label || "No text";
                            optionValue = option.value || optIndex;
                        } else {
                            optionText = "No text";
                            optionValue = optIndex;
                        }
                        
                        html += `
                            <label>
                                <input type="radio" name="q${index}" value="${optionValue}" ${optIndex === 0 ? 'checked' : ''}>
                                ${optionText}
                            </label><br>
                        `;
                    });
                } else {
                    console.error(`No options found for question ${index}`); // Debug
                    html += `<p style="color: red;">No options available for this question</p>`;
                }
                
                html += `
                        </div>
                    </div>
                `;
            });

            html += `<button type="submit">Get Recommendations</button></form>`;
        } else {
            console.error("No questions in data"); // Debug
            html += `<p>No questions available.</p>`;
        }

        document.getElementById("guideSection").innerHTML = html;

        const form = document.getElementById("guideForm");
        if (form) {
            form.addEventListener("submit", submitGuideQuiz);
        }
    } catch (error) {
        console.error("Error loading quiz:", error); // Debug
        document.getElementById("guideSection").innerHTML = `<p style="color: red;">Error loading quiz: ${error.message}</p>`;
    }
}




async function submitGuideQuiz(event) {
    event.preventDefault();

    const form = event.target;
    const answers = [];

    // Collect all selected radio button values
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        answers.push({
            question: key,
            answer: value
        });
    }

    const res = await fetch(`${BASE_URL}/guide/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
    });

    const data = await res.json();

    let html = `<h3>Your Top Career Matches</h3><ul>`;
    data.recommendations.forEach(r => {
        html += `<li><strong>${r.role}</strong> — ${r.match_score}% match</li>`;
    });
    html += "</ul>";
    html += `<button onclick="startQuiz()">Retake Quiz</button>`;

    document.getElementById("guideSection").innerHTML = html;
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