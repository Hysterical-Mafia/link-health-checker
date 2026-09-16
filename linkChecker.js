const axios = require("axios");
const cheerio = require("cheerio");

async function checkLink(link) {
    try {
        const startTime = Date.now();

        const response = await axios.head(link, {
            timeout: 5000,
            headers: {
                "User-Agent": "LinkHealthChecker/1.0",
            },
        });

        const responseTime = Date.now() - startTime;

        return {
            url: link,
            status: response.status,
            responseTime: responseTime,
            working: response.status >= 200 && response.status < 400,
            category:
                response.status >= 200 && response.status < 300 ? "OK" :
                    response.status >= 300 && response.status < 400 ? "REDIRECT" :
                        response.status >= 400 && response.status < 500 ? "CLIENT ERROR " :
                            "SERVER ERROR",
        };
    } catch (error) {
        try {
            const startTime = Date.now();

            const response = await axios.get(link, {
                timeout: 5000,
                headers: {
                    "User-Agent": "LinkHealthChecker/1.0",
                },
            });
            const responseTime = Date.now() - startTime;

            return {
                url: link,
                status: response.status,
                responseTime: responseTime,
                working: response.status >= 200 && response.status < 400,
                category:
                    response.status >= 200 && response.status < 300 ? "OK" :
                        response.status >= 300 && response.status < 400 ? "REDIRECT" :
                            response.status >= 400 && response.status < 500 ? "CLIENT ERROR" :
                                "SERVER ERROR",
            };
        } catch (error) {
            return {
                url: link,
                status: error.response?.status || null,
                responseTime: null,
                working: false,
                category:
                    error.response?.status >= 400 && error.response?.status < 500
                        ? "CLIENT ERROR"
                        : error.response?.status >= 500
                            ? "SERVER ERROR"
                            : "NO RESPONSE",
            };
        }
    }
}

async function checkWebsite(url) {
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "LinkHealthChecker/1.0",
        },
    });

    const cheerioParser = cheerio.load(response.data);
    const links = [];

    cheerioParser("a[href]").each((index, element) => {
        const href = cheerioParser(element).attr("href");

        if (href) {
            try {
                const absoluteUrl = new URL(href, url);

                if (
                    absoluteUrl.protocol === "http:" ||
                    absoluteUrl.protocol === "https:"
                ) {
                    links.push(absoluteUrl.href);
                }
            } catch {
//ignore invalid urls
            }
        }
    });

    const uniqueLinks = [...new Set(links)];

    const results = await Promise.all(uniqueLinks.map((link) => checkLink(link)));

    const workingResults = results.filter((link) => link.working);
//? true do x, otherwise do y
    const averageResponseTime = workingResults.length > 0 
    ? Math.round(workingResults.reduce((total, link) => total + link.responseTime, 0) / workingResults.length,)
    : null;

    return {
        website: url,
        totalLinks: results.length,
        workingLinks: workingResults.length,
        brokenLinks: results.filter((link) => !link.working).length,
        averageResponseTime,
        successRate:
            results.length > 0
                ? Math.round((workingResults.length / results.length) * 100)
                : 0,
        scannedAt: new Date().toISOString(),
        results,
    };
}

module.exports = { checkWebsite };
