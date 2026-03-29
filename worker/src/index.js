import { handleApiRequest } from "./game-engine.mjs";

export default {
    async fetch(request, env) {
        return handleApiRequest(request, env);
    }
};
