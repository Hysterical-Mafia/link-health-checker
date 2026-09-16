const express = require("express");
const { checkWebsite } = require("./services/linkChecker");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));

app.get("/", (req, res) => {
    res.json({
        message: "Link Health Checker API is running",
    });
});

app.post("/check", async (req, res) => {
    const { url } = req.body;

    if (!url) {
    return res.status(400).json({
        error: "URL is required",
    });
}

try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return res.status(400).json({
            error: "URL must start with http:// or https://",
        });
    }
} catch {
    return res.status(400).json({
        error: "Please enter a valid URL",
    });
}

    try {
        const report = await checkWebsite(url);

        res.json(report);
    } catch (error) {
    if (error.code === "ENOTFOUND") {
        return res.status(400).json({
            error: "Website could not be found",
        });
    }

    if (error.code === "ECONNABORTED") {
        return res.status(408).json({
            error: "Website took too long to respond",
        });
    }

    if (error.response) {
        return res.status(error.response.status).json({
            error: `Website returned HTTP ${error.response.status}`,
        });
    }

    res.status(500).json({
        error: "Could not access website",
    });
}
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});