const form = document.getElementById("check-form");
const urlInput = document.getElementById("url-input");
const results = document.getElementById("results");
const filterControls = document.getElementById("filter-controls");
const button = document.querySelector("button");


form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = urlInput.value.trim();

    results.innerHTML = "<p>Checking links...</p>";
    button.disabled = true;
    button.textContent = "Checking...";


    try {
        const response = await fetch("/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Request has Failed");
        }
        filterControls.innerHTML = `
            <button id="show-all" type="button">All Links</button>
            <button id="show-broken" type="button">Broken Links Only</button>
        `;

        results.innerHTML = `

    <h2>Results</h2>
    <p>Scanned: ${new Date(data.scannedAt).toLocaleString()}</p>
    
    <div class="summary">
        <div class="summary-card">
            <span>Total Links</span>
            <strong>${data.totalLinks}</strong>
        </div>

    <div class="summary-card">
        <span>Working</span>
        <strong>${data.workingLinks}</strong>
    </div>

    <div class="summary-card">
        <span>Broken</span>
        <strong>${data.brokenLinks}</strong>
    </div>

    <div class="summary-card">
        <span>Success Rate</span>
        <strong>${data.successRate}%</strong>
        <div class="success-bar">
            <div class="success-fill" style="width: ${data.successRate}%;"></div>
        </div>
    </div>

    <div class="summary-card">
        <span>Avg. Response</span>
        <strong>${data.averageResponseTime !== null ? data.averageResponseTime + " ms" : "N/A"}</strong>
    </div>
    </div>

    <div class="link-list">
        ${data.results.map(link => `
        <div class="link-result">
            <span class="${link.category === "OK"
                ? "status-ok"
                : link.category === "REDIRECT"
                    ? "status-redirect"
                    : "status-error"
            }">
            ${link.category || "NO RESPONSE"}
            </span>

            <span>${link.status || "No response"}</span>
            <span>${link.responseTime !== null ? `${link.responseTime} ms` : "N/A"}</span>
            <a href="${link.url}" target="_blank">${link.url}</a>
        </div>
        `).join("")}
    </div>
    `;
        document.getElementById("show-all").addEventListener("click", () => {
            document.querySelectorAll(".link-result").forEach(link => {
                link.style.display = "flex";
            });
        });

        document.getElementById("show-broken").addEventListener("click", () => {
            document.querySelectorAll(".link-result").forEach(link => {
                const status = link.querySelector("span");

                if (status.classList.contains("status-error")) {
                    link.style.display = "flex";
                } else {
                    link.style.display = "none";
                }
            });
        });
        button.disabled = false;
        button.textContent = "Check Links";

    } catch (error) {
        results.innerHTML = `
            <p>Could not check this website.</p>
            <p>${error.message}</p>
        `;

        button.disabled = false;
        button.textContent = "Check Links";
    }

});