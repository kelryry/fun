const JSON_HEADERS = {
    "content-type": "application/json; charset=UTF-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type"
};

function json(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...extraHeaders
        }
    });
}

function notFound(pathname) {
    return json(
        {
            ok: false,
            error: "NOT_FOUND",
            message: `No handler for ${pathname}`
        },
        404,
        { "cache-control": "no-store" }
    );
}

export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: JSON_HEADERS
            });
        }

        const url = new URL(request.url);

        if (request.method !== "GET") {
            return json(
                {
                    ok: false,
                    error: "METHOD_NOT_ALLOWED"
                },
                405,
                {
                    allow: "GET,OPTIONS",
                    "cache-control": "no-store"
                }
            );
        }

        if (url.pathname === "/api/health") {
            return json(
                {
                    ok: true,
                    service: "fun-edge-api",
                    env: env.APP_ENV || "production",
                    now: new Date().toISOString()
                },
                200,
                { "cache-control": "no-store" }
            );
        }

        if (url.pathname === "/api/bootstrap") {
            return json(
                {
                    ok: true,
                    app: {
                        name: "lulu-world",
                        version: env.APP_VERSION || "2026-03-28",
                        aiEnabled: false
                    },
                    endpoints: {
                        health: "/api/health",
                        futureAiBase: "/api/ai"
                    },
                    performance: {
                        targetFpsDesktop: 45,
                        targetFpsMobile: 30,
                        idleFps: 12
                    }
                },
                200,
                { "cache-control": "no-store" }
            );
        }

        return notFound(url.pathname);
    }
};
