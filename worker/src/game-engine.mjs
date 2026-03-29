import GAME_COPY from "../../content/game-copy.json" with { type: "json" };

const JSON_HEADERS = {
    "content-type": "application/json; charset=UTF-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
};

const SESSION_VERSION = 4;
const DEFAULT_MODE_ID = "male";
const SUPPORTED_MODES = ["male", "female"];
const AI_MODEL = "@cf/zai-org/glm-4.7-flash";
const AI_TIMEOUT_MS = 1800;
const MAX_CHAT_PER_PARTNER = 2;
const CHAT_ORDER = ["smalltalk", "probe", "boundary"];
const CASEBOOK_SECTION_IDS = ["personas", "lieTypes", "endings", "diseases", "titles"];

const COPY = GAME_COPY;
const COMMON_COPY = COPY.content.common;
const BATTLE_COPY = COPY.shell.battle;
const FEEDBACK_COPY = COPY.shell.feedback;
const ACTION_COPY = COPY.ui.actions;
const CHAT_COPY = COPY.ui.chat;
const GENERATED_CLUES = COMMON_COPY.generatedClues;

const CHAT_DEFS = {
    smalltalk: {
        label: CHAT_COPY.smalltalk.label,
        prompt: CHAT_COPY.smalltalk.prompt,
        frustrationCost: 2,
        anxietyGain: 0
    },
    probe: {
        label: CHAT_COPY.probe.label,
        prompt: CHAT_COPY.probe.prompt,
        frustrationCost: 3,
        anxietyGain: 1
    },
    boundary: {
        label: CHAT_COPY.boundary.label,
        prompt: CHAT_COPY.boundary.prompt,
        frustrationCost: 3,
        anxietyGain: 2
    }
};

const ACTION_DEFS = {
    refuse: {
        label: ACTION_COPY.refuse.title,
        urgeDelta: 8,
        anxietyDelta: 0
    },
    oral_condom: {
        label: ACTION_COPY.oral_condom.title,
        reward: 8,
        anxietyDelta: 1,
        risk: {
            fluid: 0.02,
            contact: 0.04,
            skin: 0.03,
            fluid_mucous: 0.03,
            skin_hair: 0.05
        }
    },
    sex_condom: {
        label: ACTION_COPY.sex_condom.title,
        reward: 15,
        anxietyDelta: 6,
        risk: {
            fluid: 0.09,
            contact: 0.18,
            skin: 0.12,
            fluid_mucous: 0.12,
            skin_hair: 0.2
        }
    },
    oral_raw: {
        label: ACTION_COPY.oral_raw.title,
        reward: 16,
        anxietyDelta: 14,
        risk: {
            fluid: 0.35,
            contact: 0.40,
            skin: 0.35,
            fluid_mucous: 0.40,
            skin_hair: 0.35
        }
    },
    sex_raw: {
        label: ACTION_COPY.sex_raw.title,
        reward: 24,
        anxietyDelta: 28,
        risk: {
            fluid: 0.85,
            contact: 0.75,
            skin: 0.65,
            fluid_mucous: 0.85,
            skin_hair: 0.60
        }
    },
    use_testkit: {
        label: BATTLE_COPY.testkitButton
    },
    hospital: {
        label: BATTLE_COPY.hospital,
        urgeDelta: 10
    }
};

const GAME_CONFIG = {
    startFrustration: 50,
    startAnxiety: 0,
    startTurn: 1,
    passiveGain: 8,
    anxietyPassiveGain: 2,
    hospitalUrgeCost: 10,
    testkitStart: 1,
    burnoutAt: 100,
    panicAt: 80,
    breakdownAt: 100
};

const DISEASES = {
    HIV: {
        key: "HIV",
        name: COMMON_COPY.diseases.HIV.name,
        transmission: COMMON_COPY.diseases.HIV.transmission,
        riskType: "fluid"
    },
    SYPHILIS: {
        key: "SYPHILIS",
        name: COMMON_COPY.diseases.SYPHILIS.name,
        transmission: COMMON_COPY.diseases.SYPHILIS.transmission,
        riskType: "contact"
    },
    HERPES: {
        key: "HERPES",
        name: COMMON_COPY.diseases.HERPES.name,
        transmission: COMMON_COPY.diseases.HERPES.transmission,
        riskType: "skin"
    },
    HPV: {
        key: "HPV",
        name: COMMON_COPY.diseases.HPV.name,
        transmission: COMMON_COPY.diseases.HPV.transmission,
        riskType: "contact"
    },
    GONORRHEA: {
        key: "GONORRHEA",
        name: COMMON_COPY.diseases.GONORRHEA.name,
        transmission: COMMON_COPY.diseases.GONORRHEA.transmission,
        riskType: "fluid_mucous"
    },
    CRABS: {
        key: "CRABS",
        name: COMMON_COPY.diseases.CRABS.name,
        transmission: COMMON_COPY.diseases.CRABS.transmission,
        riskType: "skin_hair"
    }
};

const CASEBOOK = {
    personas: COMMON_COPY.personas,
    lieTypes: COMMON_COPY.lieTypes,
    endings: COMMON_COPY.endings,
    titles: COMMON_COPY.titles
};

const AVATARS = {
    cautious_rookie: ["🙂", "🐶", "🐣"],
    slick_liar: ["🦊", "😏", "🐍"],
    hard_deny: ["😈", "🤡", "💀"],
    fake_sweet: ["😇", "🥺", "🐻"],
    edge_pusher: ["🔥", "😼", "🦁"],
    shy_clean: ["🫣", "🧼", "🐼"]
};

const PERSONAS = [
    {
        id: "cautious_rookie",
        lieType: "honest",
        honestyRange: [82, 96],
        safetyRange: [72, 92],
        pushinessRange: [12, 24],
        patienceRange: [2, 3],
        riskBias: -22,
        boundaryPool: ["condom_only", "oral_only", "open_all"]
    },
    {
        id: "slick_liar",
        lieType: "deflect",
        honestyRange: [30, 52],
        safetyRange: [28, 46],
        pushinessRange: [52, 72],
        patienceRange: [2, 2],
        riskBias: 14,
        boundaryPool: ["open_all", "no_condom", "condom_only"]
    },
    {
        id: "hard_deny",
        lieType: "hard_deny",
        honestyRange: [8, 28],
        safetyRange: [10, 30],
        pushinessRange: [58, 86],
        patienceRange: [1, 2],
        riskBias: 30,
        boundaryPool: ["open_all", "no_condom"]
    },
    {
        id: "fake_sweet",
        lieType: "half_truth",
        honestyRange: [34, 56],
        safetyRange: [34, 60],
        pushinessRange: [26, 48],
        patienceRange: [2, 3],
        riskBias: 8,
        boundaryPool: ["open_all", "condom_only", "oral_only"]
    },
    {
        id: "edge_pusher",
        lieType: "charm_push",
        honestyRange: [20, 44],
        safetyRange: [18, 38],
        pushinessRange: [72, 94],
        patienceRange: [1, 2],
        riskBias: 18,
        boundaryPool: ["open_all", "no_condom", "no_oral"]
    },
    {
        id: "shy_clean",
        lieType: "honest",
        honestyRange: [74, 92],
        safetyRange: [76, 94],
        pushinessRange: [6, 22],
        patienceRange: [2, 3],
        riskBias: -28,
        boundaryPool: ["oral_only", "no_oral", "condom_only"]
    }
];

const BOUNDARY_PROFILES = {
    open_all: {
        id: "open_all",
        clue: null,
        disabledActions: []
    },
    condom_only: {
        id: "condom_only",
        clue: {
            text: COMMON_COPY.boundaries.condom_only.text,
            tone: "constraint",
            detail: COMMON_COPY.boundaries.condom_only.detail
        },
        disabledActions: ["oral_raw", "sex_raw"]
    },
    no_condom: {
        id: "no_condom",
        clue: {
            text: COMMON_COPY.boundaries.no_condom.text,
            tone: "constraint",
            detail: COMMON_COPY.boundaries.no_condom.detail
        },
        disabledActions: ["oral_condom", "sex_condom"]
    },
    no_oral: {
        id: "no_oral",
        clue: {
            text: COMMON_COPY.boundaries.no_oral.text,
            tone: "constraint",
            detail: COMMON_COPY.boundaries.no_oral.detail
        },
        disabledActions: ["oral_condom", "oral_raw"]
    },
    oral_only: {
        id: "oral_only",
        clue: {
            text: COMMON_COPY.boundaries.oral_only.text,
            tone: "constraint",
            detail: COMMON_COPY.boundaries.oral_only.detail
        },
        disabledActions: ["sex_condom", "sex_raw"]
    }
};

const TEST_HISTORY = COMMON_COPY.testHistory;

const TITLES = [
    {
        id: "cold_hunter",
        label: CASEBOOK.titles.cold_hunter,
        predicate: (run, summary) => summary.endingId === "survive" && summary.leaveCount >= 2
    },
    {
        id: "contradiction_sniffer",
        label: CASEBOOK.titles.contradiction_sniffer,
        predicate: (run) => run.stats.contradictionsSeen >= 2
    },
    {
        id: "raw_gambler",
        label: CASEBOOK.titles.raw_gambler,
        predicate: (run, summary) => summary.endingId === "survive" && run.stats.rawActs >= 2
    },
    {
        id: "close_call",
        label: CASEBOOK.titles.close_call,
        predicate: (run) => run.stats.escapeCount >= 2
    },
    {
        id: "bad_luck_lover",
        label: CASEBOOK.titles.bad_luck_lover,
        predicate: (_, summary) => summary.endingId === "bad_win"
    }
];

const HISTORY_LABELS = COMMON_COPY.historyOutcomes;
const OUTCOME_META = {
    leave: { tone: "leave", label: HISTORY_LABELS.leave },
    miss: { tone: "miss", label: HISTORY_LABELS.miss },
    escape: { tone: "escape", label: HISTORY_LABELS.escape },
    infected: { tone: "infected", label: HISTORY_LABELS.infected },
    enjoy: { tone: "enjoy", label: HISTORY_LABELS.enjoy }
};

const ICONS = {
    intro: "🕵️",
    smalltalk: "💬",
    probe: "🧪",
    boundary: "🧭",
    positive: "🦠",
    uncertain: "❔",
    negative: "🛡️",
    hospital: "🏥",
    refuse: "🏃",
    oral_condom: "🍬",
    sex_condom: "🛡️",
    oral_raw: "🍭",
    sex_raw: "🔥",
    survive: "✨",
    bad_win: "🥀",
    burnout: "🤯",
    breakdown: "😵‍💫",
    confirmed_infection: "🏥"
};

const SCENE_PACKS = Object.fromEntries(
    SUPPORTED_MODES.map((mode) => [
        mode,
        Object.entries(COPY.content.modes[mode].scenes).map(([id, scene]) => ({
            id,
            ...clone(scene)
        }))
    ])
);

const TUTORIAL_PACKS = Object.fromEntries(
    SUPPORTED_MODES.map((mode) => [mode, clone(COPY.content.modes[mode].tutorials)])
);

function json(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...extraHeaders
        }
    });
}

function clone(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function formatText(template, vars = {}) {
    return String(template || "").replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
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

function badRequest(message, detail = null) {
    return json(
        {
            ok: false,
            error: "BAD_REQUEST",
            message,
            detail
        },
        400,
        { "cache-control": "no-store" }
    );
}

function methodNotAllowed(methods) {
    return json(
        {
            ok: false,
            error: "METHOD_NOT_ALLOWED"
        },
        405,
        {
            allow: methods.join(","),
            "cache-control": "no-store"
        }
    );
}

function randomFloat(run) {
    let t = (run.rngState += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    run.rngState >>>= 0;
    return result;
}

function randomInt(run, min, max) {
    return Math.floor(randomFloat(run) * (max - min + 1)) + min;
}

function pick(run, items) {
    return items[Math.floor(randomFloat(run) * items.length)];
}

function chance(run, probability) {
    return randomFloat(run) < probability;
}

function makeSeed() {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return bytes[0] >>> 0;
}

function toToneClass(tone) {
    return tone || "neutral";
}

function scoreBand(score) {
    if (score >= 72) {
        return "high";
    }

    if (score >= 42) {
        return "mid";
    }

    return "low";
}

function buildRiskTier(score) {
    if (score >= 72) {
        return "high";
    }

    if (score >= 45) {
        return "uncertain";
    }

    return "safe";
}

function getDiseasePoolForTier(riskTier) {
    if (riskTier === "high") {
        return ["HIV", "SYPHILIS", "GONORRHEA", "HERPES", "HPV"];
    }

    if (riskTier === "uncertain") {
        return ["SYPHILIS", "GONORRHEA", "HERPES", "CRABS", "HPV"];
    }

    return ["CRABS", "HERPES"];
}

function drawUnique(run, items, count) {
    const pool = items.slice();
    const result = [];

    while (pool.length > 0 && result.length < count) {
        const index = Math.floor(randomFloat(run) * pool.length);
        result.push(pool.splice(index, 1)[0]);
    }

    return result;
}

function chooseFromBand(run, low, high) {
    return randomInt(run, low, high);
}

function formatDiseaseNames(diseaseIds) {
    return diseaseIds.map((key) => DISEASES[key].name).join("、");
}

function createBaseStats() {
    return {
        rawActs: 0,
        contradictionsSeen: 0,
        leaveCount: 0,
        missCount: 0,
        enjoyCount: 0,
        infectedCount: 0,
        escapeCount: 0
    };
}

function getScenePool(mode) {
    return SCENE_PACKS[mode] || SCENE_PACKS[DEFAULT_MODE_ID];
}

function createRun({ tutorialStage = 0, seed = makeSeed(), mode = DEFAULT_MODE_ID } = {}) {
    const run = {
        version: SESSION_VERSION,
        mode,
        runSeed: seed >>> 0,
        rngState: seed >>> 0,
        tutorialStageApplied: clamp(Number(tutorialStage) || 0, 0, 3),
        turn: GAME_CONFIG.startTurn,
        frustration: GAME_CONFIG.startFrustration,
        anxiety: GAME_CONFIG.startAnxiety,
        items: { testkit: GAME_CONFIG.testkitStart },
        player: {
            infected: false,
            infectionKey: null
        },
        gameOver: false,
        history: [],
        stats: createBaseStats(),
        meta: {
            scriptedPartnerUsed: false
        },
        currentPartner: null
    };

    run.currentPartner = createPartner(run, { firstPartner: true });
    return run;
}

function createPartner(run, { firstPartner = false } = {}) {
    const tutorialScript = firstPartner ? getTutorialScript(run.tutorialStageApplied, run.mode) : null;
    if (tutorialScript) {
        run.meta.scriptedPartnerUsed = true;
        return createScriptedPartner(run, tutorialScript);
    }

    const scene = pick(run, getScenePool(run.mode));
    const persona = pick(run, PERSONAS);
    const honesty = chooseFromBand(run, persona.honestyRange[0], persona.honestyRange[1]);
    const safetyScore = chooseFromBand(run, persona.safetyRange[0], persona.safetyRange[1]);
    const pushiness = chooseFromBand(run, persona.pushinessRange[0], persona.pushinessRange[1]);
    const patience = chooseFromBand(run, persona.patienceRange[0], persona.patienceRange[1]);
    const riskScore = clamp(
        48 + persona.riskBias + scene.riskBias + randomInt(run, -18, 18) - Math.floor((safetyScore - 50) / 4),
        5,
        95
    );
    const riskTier = buildRiskTier(riskScore);
    const diseaseIds = rollDiseases(run, riskTier, safetyScore);
    const boundary = BOUNDARY_PROFILES[pick(run, persona.boundaryPool)];
    const lieType = deriveLieType(persona, honesty, pushiness, riskTier);

    return finalizePartner(run, {
        persona,
        scene,
        honesty,
        safetyScore,
        pushiness,
        patience,
        riskTier,
        diseaseIds,
        boundary,
        lieType,
        tutorial: null
    });
}

function getTutorialScript(stage, mode = DEFAULT_MODE_ID) {
    const scripts = TUTORIAL_PACKS[mode] || TUTORIAL_PACKS[DEFAULT_MODE_ID];
    if (!Array.isArray(scripts)) {
        return null;
    }

    const script = scripts[stage];
    if (!script) {
        return null;
    }

    const defaults = {
        male: [
            {
                id: "tutorial-red-flag",
                personaId: "hard_deny",
                sceneId: "club",
                riskTier: "high",
                diseaseIds: ["SYPHILIS", "GONORRHEA"],
                boundaryId: "open_all",
                honesty: 18,
                safetyScore: 18,
                pushiness: 82,
                patience: 1,
                lieType: "hard_deny",
                replyModes: {
                    smalltalk: "risky",
                    probe: "hard_deny",
                    boundary: "pressure"
                }
            },
            {
                id: "tutorial-fake-safe",
                personaId: "fake_sweet",
                sceneId: "home",
                riskTier: "uncertain",
                diseaseIds: ["HERPES"],
                boundaryId: "condom_only",
                honesty: 42,
                safetyScore: 56,
                pushiness: 34,
                patience: 2,
                lieType: "half_truth",
                replyModes: {
                    smalltalk: "soft_safe",
                    probe: "half_truth",
                    boundary: "boundary_safe"
                }
            },
            {
                id: "tutorial-safe-boundary",
                personaId: "shy_clean",
                sceneId: "dorm",
                riskTier: "safe",
                diseaseIds: [],
                boundaryId: "oral_only",
                honesty: 88,
                safetyScore: 90,
                pushiness: 12,
                patience: 3,
                lieType: "honest",
                replyModes: {
                    smalltalk: "safe",
                    probe: "honest_safe",
                    boundary: "boundary_safe"
                }
            }
        ],
        female: [
            {
                id: "tutorial-red-flag-female",
                personaId: "edge_pusher",
                sceneId: "club",
                riskTier: "high",
                diseaseIds: ["GONORRHEA", "SYPHILIS"],
                boundaryId: "open_all",
                honesty: 20,
                safetyScore: 20,
                pushiness: 86,
                patience: 1,
                lieType: "charm_push",
                replyModes: {
                    smalltalk: "risky",
                    probe: "charm_push",
                    boundary: "pressure"
                }
            },
            {
                id: "tutorial-fake-safe-female",
                personaId: "fake_sweet",
                sceneId: "home",
                riskTier: "uncertain",
                diseaseIds: ["HERPES"],
                boundaryId: "condom_only",
                honesty: 44,
                safetyScore: 58,
                pushiness: 30,
                patience: 2,
                lieType: "half_truth",
                replyModes: {
                    smalltalk: "soft_safe",
                    probe: "half_truth",
                    boundary: "boundary_safe"
                }
            },
            {
                id: "tutorial-safe-boundary-female",
                personaId: "cautious_rookie",
                sceneId: "car",
                riskTier: "safe",
                diseaseIds: [],
                boundaryId: "condom_only",
                honesty: 90,
                safetyScore: 92,
                pushiness: 10,
                patience: 3,
                lieType: "honest",
                replyModes: {
                    smalltalk: "safe",
                    probe: "honest_safe",
                    boundary: "boundary_safe"
                }
            }
        ]
    };

    return {
        ...defaults[mode][stage],
        ...clone(script)
    };
}

function createScriptedPartner(run, script) {
    const persona = PERSONAS.find((item) => item.id === script.personaId);
    const scene = getScenePool(run.mode).find((item) => item.id === script.sceneId);
    const boundary = BOUNDARY_PROFILES[script.boundaryId];

    return finalizePartner(run, {
        persona,
        scene,
        honesty: script.honesty,
        safetyScore: script.safetyScore,
        pushiness: script.pushiness,
        patience: script.patience,
        riskTier: script.riskTier,
        diseaseIds: script.diseaseIds,
        boundary,
        lieType: script.lieType,
        tutorial: script
    });
}

function finalizePartner(run, descriptor) {
    const avatar = pick(run, AVATARS[descriptor.persona.id]);
    const visibleClues = descriptor.tutorial
        ? descriptor.tutorial.visibleClues.map((clue, index) => ({
            id: `surface-${index}`,
            revealed: true,
            tone: toToneClass(clue.tone),
            text: clue.text,
            detail: clue.detail || ""
        }))
        : buildVisibleClues(run, descriptor);
    const questionBlueprints = descriptor.tutorial
        ? buildScriptedQuestionBlueprints(descriptor)
        : buildQuestionBlueprints(run, descriptor);

    return {
        id: `${run.turn}-${Math.floor(randomFloat(run) * 1e6)}`,
        avatar,
        opener: descriptor.tutorial?.opener || pick(run, descriptor.scene.openerPool),
        sceneId: descriptor.scene.id,
        sceneLabel: descriptor.scene.label,
        personaId: descriptor.persona.id,
        personaLabel: CASEBOOK.personas[descriptor.persona.id],
        lieType: descriptor.lieType,
        lieLabel: CASEBOOK.lieTypes[descriptor.lieType],
        honesty: descriptor.honesty,
        safetyScore: descriptor.safetyScore,
        pushiness: descriptor.pushiness,
        patienceMax: Math.min(descriptor.patience, MAX_CHAT_PER_PARTNER),
        chatsUsed: 0,
        questionsAsked: {
            smalltalk: false,
            probe: false,
            boundary: false
        },
        riskTier: descriptor.riskTier,
        diseaseIds: descriptor.diseaseIds.slice(),
        boundaryId: descriptor.boundary.id,
        boundaryClue: descriptor.boundary.clue ? {
            id: "boundary-visible",
            revealed: true,
            tone: toToneClass(descriptor.boundary.clue.tone),
            text: descriptor.boundary.clue.text,
            detail: descriptor.boundary.clue.detail || ""
        } : null,
        disabledActions: descriptor.boundary.disabledActions.slice(),
        flaggedByTestkit: false,
        visibleClues,
        discoveredQuestionClues: {},
        questionBlueprints,
        tutorialIntroLines: descriptor.tutorial?.introLines ? clone(descriptor.tutorial.introLines) : null,
        testSignal: deriveTestSignal(descriptor.riskTier, descriptor.diseaseIds, descriptor.safetyScore, descriptor.honesty),
        contradictionCount: 0
    };
}

function buildVisibleClues(run, descriptor) {
    const clues = [];
    const riskBand = scoreBand(55 + descriptor.pushiness - descriptor.safetyScore + descriptor.diseaseIds.length * 12);

    if (riskBand === "high") {
        clues.push(clone(pick(run, descriptor.scene.visibleRisk)));
    } else if (descriptor.safetyScore >= 68) {
        clues.push(clone(pick(run, descriptor.scene.visibleSafe)));
    } else {
        clues.push(clone(pick(run, descriptor.scene.visibleRisk.concat(descriptor.scene.visibleSafe))));
    }

    const genericPool = descriptor.riskTier === "high"
        ? GENERATED_CLUES.visible.high
        : descriptor.riskTier === "safe"
            ? GENERATED_CLUES.visible.safe
            : GENERATED_CLUES.visible.uncertain;
    clues.push(clone(pick(run, genericPool)));

    return clues.map((clue, index) => ({
        id: `surface-${index}`,
        revealed: true,
        tone: toToneClass(clue.tone),
        text: clue.text,
        detail: clue.detail || ""
    }));
}

function buildScriptedQuestionBlueprints(descriptor) {
    return Object.fromEntries(
        CHAT_ORDER.map((type) => {
            const scripted = descriptor.tutorial.questionClues[type];
            return [
                type,
                {
                    type,
                    replyMode: descriptor.tutorial.replyModes[type],
                    clue: {
                        id: type,
                        revealed: false,
                        tone: toToneClass(scripted.tone),
                        text: scripted.text,
                        detail: scripted.detail || "",
                        contradiction: Boolean(scripted.contradiction)
                    }
                }
            ];
        })
    );
}

function buildQuestionBlueprints(run, descriptor) {
    return {
        smalltalk: {
            type: "smalltalk",
            replyMode: descriptor.riskTier === "safe" ? "safe" : descriptor.riskTier === "high" ? "risky" : "mixed",
            clue: buildSmalltalkClue(run, descriptor)
        },
        probe: {
            type: "probe",
            replyMode: descriptor.lieType === "honest" && descriptor.riskTier === "safe" ? "honest_safe" : descriptor.lieType,
            clue: buildProbeClue(descriptor)
        },
        boundary: {
            type: "boundary",
            replyMode: descriptor.boundary.id === "condom_only" || descriptor.safetyScore >= 70
                ? "boundary_safe"
                : descriptor.pushiness >= 68
                    ? "pressure"
                    : "mixed",
            clue: buildBoundaryClue(descriptor)
        }
    };
}

function buildSmalltalkClue(run, descriptor) {
    const pool = descriptor.riskTier === "safe" ? descriptor.scene.smalltalkSafe : descriptor.scene.smalltalkRisk;
    const base = clone(pick(run, pool));
    return {
        id: "smalltalk",
        revealed: false,
        tone: toToneClass(base.tone),
        text: base.text,
        detail: ""
    };
}

function buildProbeClue(descriptor) {
    if (descriptor.lieType === "honest" && descriptor.riskTier === "safe") {
        return {
            id: "probe",
            revealed: false,
            tone: "safe",
            text: formatText(GENERATED_CLUES.probe.honest, { detail: TEST_HISTORY.recent_clean }),
            detail: ""
        };
    }

    if (descriptor.lieType === "hard_deny") {
        return {
            id: "probe",
            revealed: false,
            tone: "warning",
            text: GENERATED_CLUES.probe.hardDeny,
            detail: "",
            contradiction: true
        };
    }

    if (descriptor.lieType === "half_truth") {
        return {
            id: "probe",
            revealed: false,
            tone: "warning",
            text: formatText(GENERATED_CLUES.probe.halfTruth, { detail: TEST_HISTORY.vague_safe }),
            detail: "",
            contradiction: true
        };
    }

    if (descriptor.riskTier === "high") {
        return {
            id: "probe",
            revealed: false,
            tone: "risk",
            text: formatText(GENERATED_CLUES.probe.highRisk, { detail: TEST_HISTORY.recent_risk }),
            detail: "",
            contradiction: descriptor.lieType !== "honest"
        };
    }

    return {
        id: "probe",
        revealed: false,
        tone: "caution",
        text: formatText(GENERATED_CLUES.probe.unknown, { detail: TEST_HISTORY.unknown }),
        detail: "",
        contradiction: descriptor.lieType !== "honest"
    };
}

function buildBoundaryClue(descriptor) {
    if (descriptor.boundary.id === "condom_only" || descriptor.safetyScore >= 74) {
        return {
            id: "boundary",
            revealed: false,
            tone: "safe",
            text: GENERATED_CLUES.boundary.safe,
            detail: ""
        };
    }

    if (descriptor.boundary.id === "no_condom" || descriptor.pushiness >= 78) {
        return {
            id: "boundary",
            revealed: false,
            tone: "risk",
            text: GENERATED_CLUES.boundary.pressure,
            detail: ""
        };
    }

    if (descriptor.boundary.id === "oral_only" || descriptor.boundary.id === "no_oral") {
        return {
            id: "boundary",
            revealed: false,
            tone: "caution",
            text: GENERATED_CLUES.boundary.constraint,
            detail: ""
        };
    }

    return {
        id: "boundary",
        revealed: false,
        tone: "warning",
        text: GENERATED_CLUES.boundary.mixed,
        detail: ""
    };
}

function rollDiseases(run, riskTier, safetyScore) {
    const baseChance = riskTier === "high" ? 0.72 : riskTier === "uncertain" ? 0.34 : 0.08;
    const adjustedChance = clamp(baseChance - (safetyScore - 50) / 180, 0.03, 0.84);

    if (!chance(run, adjustedChance)) {
        return [];
    }

    const pool = getDiseasePoolForTier(riskTier);
    const count = riskTier === "high" && chance(run, 0.32) ? 2 : 1;
    return drawUnique(run, pool, count);
}

function deriveLieType(persona, honesty, pushiness, riskTier) {
    if (persona.lieType === "honest" && honesty >= 70) {
        return "honest";
    }

    if (persona.lieType === "hard_deny" || honesty <= 22) {
        return "hard_deny";
    }

    if (persona.lieType === "half_truth" || (honesty < 52 && riskTier !== "safe")) {
        return "half_truth";
    }

    if (persona.lieType === "charm_push" || pushiness >= 72) {
        return "charm_push";
    }

    return "deflect";
}

function deriveTestSignal(riskTier, diseaseIds, safetyScore, honesty) {
    if (diseaseIds.length === 0) {
        if (riskTier === "uncertain" && safetyScore < 50) {
            return "uncertain";
        }

        return "negative";
    }

    if (riskTier === "high" && honesty < 36) {
        return "uncertain";
    }

    return "positive";
}

function buildReply(run, questionType, replyMode) {
    const replySet = COMMON_COPY.replyTemplates[questionType] || {};
    const pool = replySet[replyMode]
        || replySet.safe
        || replySet.mixed
        || replySet.honest
        || replySet.boundary_safe
        || ["..."];
    return pick(run, pool);
}

function getPanicClue(questionType) {
    const text = COMMON_COPY.panicClues[questionType];
    return {
        tone: questionType === "probe" ? "warning" : "caution",
        text
    };
}

function createEvent({
    title,
    icon,
    lines,
    tone = "default",
    closeMode = "close",
    closeLabel = null,
    disease = null,
    criticalReason = null,
    casebookUnlocks = null,
    polishSpec = null
}) {
    return {
        title,
        icon,
        lines,
        tone,
        closeMode,
        closeLabel: closeLabel || (closeMode === "restart" ? FEEDBACK_COPY.restart : FEEDBACK_COPY.next),
        disease,
        criticalReason,
        casebookUnlocks,
        polishSpec
    };
}

function advanceTurn(run, frustrationDelta, anxietyDelta) {
    run.turn += 1;
    run.frustration = clamp(run.frustration + frustrationDelta, 0, 100);
    run.anxiety = clamp(run.anxiety + anxietyDelta, 0, 100);

    if (run.anxiety > 20) {
        run.anxiety = clamp(run.anxiety + GAME_CONFIG.anxietyPassiveGain, 0, 100);
    }
}

function buildActionLocks(partner) {
    return {
        oral_condom: partner.disabledActions.includes("oral_condom")
            ? { disabled: true, reason: partner.boundaryClue?.detail || BATTLE_COPY.locked }
            : { disabled: false, reason: "" },
        sex_condom: partner.disabledActions.includes("sex_condom")
            ? { disabled: true, reason: partner.boundaryClue?.detail || BATTLE_COPY.locked }
            : { disabled: false, reason: "" },
        oral_raw: partner.disabledActions.includes("oral_raw")
            ? { disabled: true, reason: partner.boundaryClue?.detail || BATTLE_COPY.locked }
            : { disabled: false, reason: "" },
        sex_raw: partner.disabledActions.includes("sex_raw")
            ? { disabled: true, reason: partner.boundaryClue?.detail || BATTLE_COPY.locked }
            : { disabled: false, reason: "" }
    };
}

function getClueSlots(partner) {
    const slots = [];

    partner.visibleClues.forEach((clue) => {
        slots.push(clone(clue));
    });

    if (partner.boundaryClue) {
        slots.push(clone(partner.boundaryClue));
    }

    CHAT_ORDER.forEach((type) => {
        const discovered = partner.discoveredQuestionClues[type];
        if (discovered) {
            slots.push(clone(discovered));
            return;
        }

        slots.push({
            id: `hidden-${type}`,
            revealed: false,
            tone: "hidden",
            text: BATTLE_COPY.hiddenClue,
            detail: CHAT_DEFS[type].prompt
        });
    });

    return slots;
}

function buildChatUi(partner, run) {
    const remaining = Math.max(0, partner.patienceMax - partner.chatsUsed);
    const disabledByPanic = run.gameOver;
    const disabledByPatience = remaining <= 0;

    return {
        available: !disabledByPatience && !disabledByPanic,
        remaining,
        options: CHAT_ORDER.map((type) => ({
            id: type,
            label: CHAT_DEFS[type].label,
            prompt: CHAT_DEFS[type].prompt,
            disabled: disabledByPanic || disabledByPatience || partner.questionsAsked[type],
            reason: partner.questionsAsked[type]
                ? BATTLE_COPY.chatAsked
                : disabledByPatience
                    ? BATTLE_COPY.chatSpent
                    : ""
        }))
    };
}

function buildSummary(run) {
    return {
        turnsSurvived: run.turn - 1,
        enjoyCount: run.stats.enjoyCount,
        leaveCount: run.stats.leaveCount,
        missCount: run.stats.missCount,
        escapeCount: run.stats.escapeCount,
        infectedCount: run.stats.infectedCount
    };
}

function buildUiState(run) {
    const partner = run.currentPartner;
    const history = run.history.map((item) => ({
        avatar: item.avatar,
        sceneLabel: item.sceneLabel,
        clues: item.clues.slice(),
        diseases: item.diseases.map((key) => DISEASES[key].name),
        outcomeTone: item.outcomeTone,
        outcomeLabel: item.outcomeLabel,
        reason: item.reason
    }));

    return {
        mode: run.mode,
        runPhase: run.gameOver ? "result" : "active",
        stats: {
            frustration: run.frustration,
            anxiety: run.anxiety,
            turn: run.turn,
            testkit: run.items.testkit,
            panicMode: run.anxiety >= GAME_CONFIG.panicAt
        },
        player: {
            infected: run.player.infected,
            infectionName: run.player.infectionKey ? DISEASES[run.player.infectionKey].name : null
        },
        partner: partner ? {
            avatar: partner.avatar,
            opener: partner.opener,
            sceneLabel: partner.sceneLabel,
            flagged: partner.flaggedByTestkit,
            clues: getClueSlots(partner),
            actionLocks: buildActionLocks(partner),
            chat: buildChatUi(partner, run)
        } : null,
        history,
        summary: run.gameOver ? buildSummary(run) : null,
        gameOver: run.gameOver
    };
}

function buildIntroEvent(run) {
    const lines = run.currentPartner?.tutorialIntroLines;
    if (!lines || lines.length === 0) {
        return null;
    }

    return createEvent({
        title: COMMON_COPY.events.introTitle,
        icon: ICONS.intro,
        lines,
        closeMode: "close"
    });
}

function getActionOutcomeTone(run, partner, infectedThisTurn, actionType) {
    if (actionType === "refuse") {
        return partner.diseaseIds.length > 0 ? OUTCOME_META.leave : OUTCOME_META.miss;
    }

    if (infectedThisTurn) {
        return OUTCOME_META.infected;
    }

    if (partner.diseaseIds.length > 0) {
        return OUTCOME_META.escape;
    }

    return OUTCOME_META.enjoy;
}

function recordHistory(run, partner, actionType, infectedThisTurn, reason) {
    const outcome = getActionOutcomeTone(run, partner, infectedThisTurn, actionType);
    run.history.push({
        avatar: partner.avatar,
        sceneLabel: partner.sceneLabel,
        clues: getClueSlots(partner).filter((clue) => clue.revealed).map((clue) => clue.text),
        diseases: partner.diseaseIds.slice(),
        actionType,
        outcomeTone: outcome.tone,
        outcomeLabel: outcome.label,
        reason
    });

    if (outcome.tone === "leave") {
        run.stats.leaveCount += 1;
    } else if (outcome.tone === "miss") {
        run.stats.missCount += 1;
    } else if (outcome.tone === "escape") {
        run.stats.escapeCount += 1;
    } else if (outcome.tone === "infected") {
        run.stats.infectedCount += 1;
    } else if (outcome.tone === "enjoy") {
        run.stats.enjoyCount += 1;
    }
}

function attemptInfection(run, partner, actionType) {
    if (run.player.infected || partner.diseaseIds.length === 0 || actionType === "refuse") {
        return false;
    }

    const actionDef = ACTION_DEFS[actionType];
    for (const diseaseKey of partner.diseaseIds) {
        const disease = DISEASES[diseaseKey];
        const actionChance = actionDef.risk[disease.riskType] || 0;
        const partnerModifier = partner.riskTier === "high" ? 2.0 : partner.riskTier === "uncertain" ? 1.2 : 0.6;
        const safetyModifier = clamp(1 - partner.safetyScore / 150, 0.35, 0.95);
        const finalChance = clamp(actionChance * partnerModifier * safetyModifier, 0, 0.95);

        if (chance(run, finalChance)) {
            run.player.infected = true;
            run.player.infectionKey = diseaseKey;
            return true;
        }
    }

    return false;
}

function createNextPartnerIfNeeded(run) {
    if (!run.gameOver) {
        run.currentPartner = createPartner(run);
    }
}

function buildCriticalReason(run, endingId) {
    if (endingId === "survive") {
        return run.stats.leaveCount > 0
            ? COMMON_COPY.criticalReasons.surviveLeave
            : COMMON_COPY.criticalReasons.surviveStay;
    }

    if (endingId === "bad_win") {
        return COMMON_COPY.criticalReasons.bad_win;
    }

    if (endingId === "burnout") {
        return COMMON_COPY.criticalReasons.burnout;
    }

    if (endingId === "breakdown") {
        return COMMON_COPY.criticalReasons.breakdown;
    }

    return COMMON_COPY.criticalReasons.confirmed_infection;
}

function buildCasebookUnlocks(run, endingId = null, diseaseKey = null, encounteredPartner = null) {
    const unlocks = {
        personas: [],
        lieTypes: [],
        endings: [],
        diseases: [],
        titles: []
    };

    const partner = encounteredPartner || run.currentPartner;
    if (partner) {
        unlocks.personas.push({
            id: partner.personaId,
            label: CASEBOOK.personas[partner.personaId]
        });
        unlocks.lieTypes.push({
            id: partner.lieType,
            label: CASEBOOK.lieTypes[partner.lieType]
        });
    }

    if (endingId) {
        unlocks.endings.push({
            id: endingId,
            label: CASEBOOK.endings[endingId]
        });
    }

    const diseaseIds = diseaseKey ? [diseaseKey] : partner?.diseaseIds || [];
    diseaseIds.forEach((id) => {
        unlocks.diseases.push({
            id,
            label: DISEASES[id].name
        });
    });

    if (endingId) {
        const summary = buildSummary(run);
        TITLES.forEach((rule) => {
            if (rule.predicate(run, { ...summary, endingId })) {
                unlocks.titles.push({
                    id: rule.id,
                    label: rule.label
                });
            }
        });
    }

    return unlocks;
}

function mergeEventUnlocks(event, unlocks) {
    if (event) {
        event.casebookUnlocks = unlocks;
    }
}

function buildEndingEvent(run, endingId, extraLines = [], diseaseKey = null) {
    run.gameOver = true;
    const summary = buildSummary(run);
    const endingCopy = COMMON_COPY.endingEvents[endingId];
    const disease = diseaseKey ? {
        name: DISEASES[diseaseKey].name,
        transmission: DISEASES[diseaseKey].transmission
    } : null;
    const criticalReason = buildCriticalReason(run, endingId);
    const unlocks = buildCasebookUnlocks(run, endingId, diseaseKey);

    const lines = endingCopy.lines.map((text, index) => ({
        tone: index === 0 ? (endingId === "survive" ? "success" : "warning") : "muted",
        text
    })).concat(extraLines).concat([
        { tone: "muted", text: `${FEEDBACK_COPY.summaryTurns} ${summary.turnsSurvived}` }
    ]);

    return {
        event: createEvent({
            title: endingCopy.title,
            icon: ICONS[endingId],
            tone: endingId === "survive" ? "success" : "danger",
            lines,
            closeMode: "restart",
            closeLabel: FEEDBACK_COPY.restart,
            disease,
            criticalReason,
            casebookUnlocks: unlocks,
            polishSpec: {
                kind: "ending",
                frame: {
                    mode: run.mode,
                    endingId,
                    title: endingCopy.title,
                    criticalReason,
                    disease: disease?.name || null,
                    infected: run.player.infected,
                    turnsSurvived: summary.turnsSurvived
                }
            }
        }),
        unlocks
    };
}

function applyChat(run, questionType) {
    if (run.gameOver || !run.currentPartner) {
        throw new Error("GAME_NOT_ACTIVE");
    }

    const def = CHAT_DEFS[questionType];
    if (!def) {
        throw new Error("UNKNOWN_CHAT_TYPE");
    }

    const partner = run.currentPartner;
    if (partner.questionsAsked[questionType]) {
        throw new Error("CHAT_ALREADY_USED");
    }

    if (partner.chatsUsed >= partner.patienceMax || partner.chatsUsed >= MAX_CHAT_PER_PARTNER) {
        throw new Error("CHAT_EXHAUSTED");
    }

    advanceTurn(run, def.frustrationCost, def.anxietyGain);

    if (run.frustration >= GAME_CONFIG.burnoutAt) {
        return buildEndingEvent(run, "burnout");
    }

    if (run.anxiety >= GAME_CONFIG.breakdownAt) {
        return buildEndingEvent(run, "breakdown");
    }

    const blueprint = partner.questionBlueprints[questionType];
    const panicMode = run.anxiety >= GAME_CONFIG.panicAt;
    const panicClue = getPanicClue(questionType);
    const clue = panicMode
        ? {
            id: questionType,
            revealed: true,
            tone: panicClue.tone,
            text: panicClue.text,
            detail: blueprint.clue.detail || ""
        }
        : {
            ...clone(blueprint.clue),
            revealed: true
        };
    partner.discoveredQuestionClues[questionType] = clue;
    partner.questionsAsked[questionType] = true;
    partner.chatsUsed += 1;

    if (blueprint.clue.contradiction) {
        partner.contradictionCount += 1;
        run.stats.contradictionsSeen += 1;
    }

    const reply = buildReply(run, questionType, blueprint.replyMode);
    const unlocks = buildCasebookUnlocks(run, null, null, partner);
    const lines = [
        { tone: "default", text: reply },
        { tone: clue.tone, text: clue.text }
    ];

    // AI insight takes over lines via prepareEventForClient

    return {
        event: createEvent({
            title: def.label,
            icon: ICONS[questionType],
            lines,
            closeMode: "close",
            casebookUnlocks: unlocks,
            polishSpec: {
                kind: "chat",
                frame: {
                    mode: run.mode,
                    persona: partner.personaLabel,
                    scene: partner.sceneLabel,
                    topic: questionType,
                    replyMode: blueprint.replyMode,
                    contradiction: Boolean(blueprint.clue.contradiction),
                    fallback: lines[0].text
                }
            }
        }),
        unlocks
    };
}

function applyTestkit(run) {
    if (run.gameOver || !run.currentPartner) {
        throw new Error("GAME_NOT_ACTIVE");
    }

    if (run.items.testkit <= 0) {
        throw new Error("NO_TESTKIT");
    }

    run.items.testkit -= 1;
    const partner = run.currentPartner;
    partner.flaggedByTestkit = partner.testSignal === "positive";
    const unlocks = buildCasebookUnlocks(run, null, null, partner);
    const eventCopy = COMMON_COPY.events.testkit;
    let title;
    let icon;
    let lines;

    if (partner.testSignal === "positive") {
        title = eventCopy.positiveTitle;
        icon = ICONS.positive;
        lines = eventCopy.positiveLines.map((line, index) => ({
            tone: index === 0 ? "danger" : index === 1 ? "warning" : "muted",
            text: formatText(line, { diseases: formatDiseaseNames(partner.diseaseIds) })
        }));
    } else if (partner.testSignal === "uncertain") {
        title = eventCopy.uncertainTitle;
        icon = ICONS.uncertain;
        lines = eventCopy.uncertainLines.map((line, index) => ({
            tone: index === 0 ? "warning" : "muted",
            text: line
        }));
    } else {
        title = eventCopy.negativeTitle;
        icon = ICONS.negative;
        lines = eventCopy.negativeLines.map((line, index) => ({
            tone: index === 0 ? "success" : "muted",
            text: line
        }));
    }

    if (!partner.discoveredQuestionClues.smalltalk) {
        const previewClue = clone(partner.questionBlueprints.smalltalk.clue);
        previewClue.revealed = true;
        previewClue.tone = previewClue.tone === "risk" ? "warning" : previewClue.tone;
        previewClue.text = `${eventCopy.previewPrefix}${previewClue.text}`;
        partner.discoveredQuestionClues.smalltalk = previewClue;
        lines.push({ tone: previewClue.tone, text: previewClue.text });
    }

    return {
        event: createEvent({
            title,
            icon,
            lines,
            closeMode: "close",
            casebookUnlocks: unlocks
        }),
        unlocks
    };
}

function applyHospital(run) {
    if (run.gameOver || !run.currentPartner) {
        throw new Error("GAME_NOT_ACTIVE");
    }

    advanceTurn(run, GAME_CONFIG.hospitalUrgeCost, 0);
    if (run.frustration >= GAME_CONFIG.burnoutAt) {
        return buildEndingEvent(run, "burnout");
    }

    run.anxiety = 0;

    if (run.player.infected) {
        return buildEndingEvent(run, "confirmed_infection", [], run.player.infectionKey);
    }

    return {
        event: createEvent({
            title: COMMON_COPY.events.hospital.title,
            icon: ICONS.hospital,
            lines: COMMON_COPY.events.hospital.lines.map((line, index) => ({
                tone: index === 0 ? "success" : "muted",
                text: line
            })),
            closeMode: "close"
        }),
        unlocks: {
            personas: [],
            lieTypes: [],
            endings: [],
            diseases: [],
            titles: []
        }
    };
}

function applyRefuse(run) {
    if (run.gameOver || !run.currentPartner) {
        throw new Error("GAME_NOT_ACTIVE");
    }

    const partner = clone(run.currentPartner);
    const eventCopy = COMMON_COPY.events.refuse;
    const reason = partner.diseaseIds.length > 0 ? eventCopy.leaveHighRisk : eventCopy.leaveSafe;
    recordHistory(run, partner, "refuse", false, reason);
    advanceTurn(run, ACTION_DEFS.refuse.urgeDelta, ACTION_DEFS.refuse.anxietyDelta);

    if (run.frustration >= GAME_CONFIG.burnoutAt) {
        return buildEndingEvent(run, "burnout");
    }

    createNextPartnerIfNeeded(run);
    const unlocks = buildCasebookUnlocks(run, null, null, partner);

    return {
        event: createEvent({
            title: eventCopy.title,
            icon: ICONS.refuse,
            lines: [
                {
                    tone: partner.diseaseIds.length > 0 ? "success" : "muted",
                    text: reason
                },
                { tone: "warning", text: `+${ACTION_DEFS.refuse.urgeDelta}` }
            ],
            closeMode: "continue",
            closeLabel: FEEDBACK_COPY.next,
            casebookUnlocks: unlocks
        }),
        unlocks
    };
}

function applySexualAction(run, actionType) {
    if (run.gameOver || !run.currentPartner) {
        throw new Error("GAME_NOT_ACTIVE");
    }

    const action = ACTION_DEFS[actionType];
    if (!action || !action.reward) {
        throw new Error("UNKNOWN_ACTION");
    }

    const locks = buildActionLocks(run.currentPartner);
    if (locks[actionType] && locks[actionType].disabled) {
        throw new Error("ACTION_LOCKED");
    }

    const partner = clone(run.currentPartner);
    const infectedThisTurn = attemptInfection(run, partner, actionType);
    const frustrationDelta = GAME_CONFIG.passiveGain - action.reward;
    advanceTurn(run, frustrationDelta, action.anxietyDelta);
    recordHistory(run, partner, actionType, infectedThisTurn, ACTION_DEFS[actionType].label);

    if (actionType === "oral_raw" || actionType === "sex_raw") {
        run.stats.rawActs += 1;
    }

    if (run.frustration >= GAME_CONFIG.burnoutAt) {
        return buildEndingEvent(run, "burnout");
    }

    if (run.anxiety >= GAME_CONFIG.breakdownAt) {
        return buildEndingEvent(run, "breakdown");
    }

    if (run.frustration <= 0) {
        return buildEndingEvent(
            run,
            run.player.infected ? "bad_win" : "survive",
            [],
            run.player.infected ? run.player.infectionKey : null
        );
    }

    createNextPartnerIfNeeded(run);

    const sexCopy = COMMON_COPY.events.sexAction;
    const lines = [
        {
            tone: "success",
            text: formatText(sexCopy.release, {
                reward: action.reward,
                delta: frustrationDelta >= 0 ? `+${frustrationDelta}` : frustrationDelta
            })
        }
    ];

    if (action.anxietyDelta > 0) {
        lines.push({
            tone: "warning",
            text: formatText(sexCopy.anxiety, { delta: action.anxietyDelta })
        });
    }

    if (infectedThisTurn) {
        lines.push({ tone: "warning", text: sexCopy.infected });
    } else if (partner.diseaseIds.length > 0) {
        lines.push({ tone: "muted", text: sexCopy.escaped });
    } else {
        lines.push({ tone: "muted", text: sexCopy.clean });
    }

    const unlocks = buildCasebookUnlocks(run, null, null, partner);
    return {
        event: createEvent({
            title: sexCopy.title,
            icon: ICONS[actionType],
            lines,
            closeMode: "continue",
            closeLabel: FEEDBACK_COPY.next,
            casebookUnlocks: unlocks
        }),
        unlocks
    };
}

function applyAction(run, actionType) {
    if (actionType === "use_testkit") {
        return applyTestkit(run);
    }

    if (actionType === "hospital") {
        return applyHospital(run);
    }

    if (actionType === "refuse") {
        return applyRefuse(run);
    }

    return applySexualAction(run, actionType);
}

function assertRunShape(run) {
    if (!run || run.version !== SESSION_VERSION || !SUPPORTED_MODES.includes(run.mode)) {
        throw new Error("INVALID_SESSION");
    }
}

function normalizeUnlocks(unlocks) {
    return unlocks || {
        personas: [],
        lieTypes: [],
        endings: [],
        diseases: [],
        titles: []
    };
}

export function startRunPayload({ tutorialStage, seed, mode }) {
    const run = createRun({ tutorialStage, seed, mode });
    const introEvent = buildIntroEvent(run);
    const unlocks = buildCasebookUnlocks(run, null, null, run.currentPartner);
    if (introEvent) {
        mergeEventUnlocks(introEvent, unlocks);
    }

    return {
        run,
        uiState: buildUiState(run),
        introEvent,
        nextTutorialStage: Math.min(run.tutorialStageApplied + 1, 3),
        unlocks
    };
}

export function chatPayload(runInput, questionType) {
    const run = clone(runInput);
    assertRunShape(run);
    const result = applyChat(run, questionType);
    return {
        run,
        uiState: buildUiState(run),
        event: result.event,
        unlocks: normalizeUnlocks(result.unlocks)
    };
}

export function actionPayload(runInput, actionType) {
    const run = clone(runInput);
    assertRunShape(run);
    const result = applyAction(run, actionType);
    return {
        run,
        uiState: buildUiState(run),
        event: result.event,
        unlocks: normalizeUnlocks(result.unlocks)
    };
}

function getSecret(env) {
    return String(env.SESSION_SECRET || "dev-session-secret");
}

function encodeBase64Url(bytes) {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
    }

    let binary = "";
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(input) {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);

    if (typeof Buffer !== "undefined") {
        return new Uint8Array(Buffer.from(padded, "base64"));
    }

    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signBytes(bytes, env) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(getSecret(env)),
        {
            name: "HMAC",
            hash: "SHA-256"
        },
        false,
        ["sign", "verify"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, bytes);
    return new Uint8Array(signature);
}

export async function issueSessionToken(run, env = {}) {
    const payload = new TextEncoder().encode(JSON.stringify(run));
    const signature = await signBytes(payload, env);
    return `${encodeBase64Url(payload)}.${encodeBase64Url(signature)}`;
}

export async function readSessionToken(token, env = {}) {
    if (!token || typeof token !== "string" || !token.includes(".")) {
        throw new Error("INVALID_SESSION");
    }

    const [payloadPart, signaturePart] = token.split(".");
    const payloadBytes = decodeBase64Url(payloadPart);
    const signatureBytes = decodeBase64Url(signaturePart);
    const expected = await signBytes(payloadBytes, env);

    if (expected.length !== signatureBytes.length) {
        throw new Error("INVALID_SESSION");
    }

    for (let index = 0; index < expected.length; index += 1) {
        if (expected[index] !== signatureBytes[index]) {
            throw new Error("INVALID_SESSION");
        }
    }

    return JSON.parse(new TextDecoder().decode(payloadBytes));
}

async function parseJsonBody(request) {
    try {
        return await request.json();
    } catch {
        throw new Error("INVALID_JSON");
    }
}

function hasAiBinding(env) {
    return Boolean(env && env.AI && typeof env.AI.run === "function");
}

function makePolishSeed(run, salt = 0) {
    return (run.runSeed ^ Math.imul(run.turn + 11, 2654435761) ^ salt) >>> 0;
}

function parseAiJsonCandidate(candidate) {
    if (!candidate) {
        return null;
    }

    if (typeof candidate === "object") {
        return candidate;
    }

    if (typeof candidate !== "string") {
        return null;
    }

    const trimmed = candidate.trim();
    if (!trimmed) {
        return null;
    }

    try {
        return JSON.parse(trimmed);
    } catch {
        return null;
    }
}

function extractAiJson(result) {
    if (!result) {
        return null;
    }

    if (typeof result.response === "object" && result.response) {
        return result.response;
    }

    if (typeof result.response === "string") {
        return parseAiJsonCandidate(result.response);
    }

    const content = result.choices?.[0]?.message?.content;
    if (typeof content === "string") {
        return parseAiJsonCandidate(content) || { text: content.trim() };
    }

    if (Array.isArray(content)) {
        const merged = content.map((part) => {
            if (typeof part === "string") {
                return part;
            }

            return part?.text || "";
        }).join("").trim();

        return parseAiJsonCandidate(merged) || (merged ? { text: merged } : null);
    }

    if (typeof result === "string") {
        return parseAiJsonCandidate(result) || { text: result.trim() };
    }

    return null;
}

async function withTimeout(promise, timeoutMs) {
    let timeoutId = null;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
    }
}

async function runAiJson(env, schemaName, schema, messages, seed) {
    if (!hasAiBinding(env)) {
        return null;
    }

    try {
        const result = await withTimeout(
            env.AI.run(AI_MODEL, {
                messages,
                seed,
                temperature: 0.2,
                max_tokens: 80,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: schemaName,
                        strict: true,
                        schema
                    }
                }
            }),
            AI_TIMEOUT_MS
        );

        return extractAiJson(result);
    } catch (error) {
        console.warn("Workers AI polish fallback:", error.message || error);
        return null;
    }
}

async function polishChatEvent(event, run, env) {
    const frame = event.polishSpec?.frame;
    const response = await runAiJson(
        env,
        "chat_polish",
        {
            type: "object",
            properties: {
                text: { type: "string" },
                insight: { type: "string" }
            },
            required: ["text", "insight"],
            additionalProperties: false
        },
        [
            {
                role: "system",
                content: COPY.ai.chat.system
            },
            {
                role: "user",
                content: JSON.stringify(frame)
            }
        ],
        makePolishSeed(run, 17)
    );

    // event.lines[0] was the chat text, we'll replace it entirely below
    if (typeof response?.insight === "string" && response.insight.trim()) {
        const insight = response.insight.trim();
        event.aiInsight = insight;
        // 彻底替换 event.lines，只展示AI心理剖析，移除任何程序生成的对话
        event.lines = [{ tone: "warning", text: "💭 " + insight }];
        if (run.currentPartner && frame.topic) {
            run.currentPartner.discoveredQuestionClues[frame.topic].text = insight;
        }
    }
}

async function polishEndingEvent(event, run, env) {
    const frame = event.polishSpec?.frame;
    const response = await runAiJson(
        env,
        "ending_polish",
        {
            type: "object",
            properties: {
                summary: { type: "string" }
            },
            required: ["summary"],
            additionalProperties: false
        },
        [
            {
                role: "system",
                content: COPY.ai.ending.system
            },
            {
                role: "user",
                content: JSON.stringify(frame)
            }
        ],
        makePolishSeed(run, 41)
    );

    if (typeof response?.summary === "string" && response.summary.trim()) {
        event.criticalReason = response.summary.trim();
    }
}

async function prepareEventForClient(event, run, env) {
    if (!event) {
        return event;
    }

    const prepared = clone(event);
    if (prepared.polishSpec?.kind === "chat") {
        await polishChatEvent(prepared, run, env);
    } else if (prepared.polishSpec?.kind === "ending") {
        await polishEndingEvent(prepared, run, env);
    }

    delete prepared.polishSpec;
    return prepared;
}

function bootstrapPayload(env = {}) {
    return {
        ok: true,
        app: {
            name: "month-pass-simulator",
            version: env.APP_VERSION || COPY.version,
            aiEnabled: hasAiBinding(env),
            mode: "worker-authoritative"
        },
        endpoints: {
            health: "/api/health",
            start: "/api/game/start",
            chat: "/api/game/chat",
            action: "/api/game/action"
        },
        features: {
            runtimeConfig: true,
            workerRequired: true,
            chatQuestions: true,
            casebook: true,
            modes: SUPPORTED_MODES.slice(),
            aiPolish: hasAiBinding(env)
        },
        copyVersion: COPY.version,
        modes: SUPPORTED_MODES.map((mode) => ({
            id: mode,
            label: BATTLE_COPY.modeLabel[mode]
        }))
    };
}

export async function handleApiRequest(request, env = {}) {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: JSON_HEADERS
        });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
        if (request.method !== "GET") {
            return methodNotAllowed(["GET", "OPTIONS"]);
        }

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
        if (request.method !== "GET") {
            return methodNotAllowed(["GET", "OPTIONS"]);
        }

        return json(bootstrapPayload(env), 200, { "cache-control": "no-store" });
    }

    if (url.pathname === "/api/game/start") {
        if (request.method !== "POST") {
            return methodNotAllowed(["POST", "OPTIONS"]);
        }

        try {
            const body = await parseJsonBody(request);
            const mode = body.mode || DEFAULT_MODE_ID;
            if (!SUPPORTED_MODES.includes(mode)) {
                return badRequest("Unsupported mode.");
            }

            const payload = startRunPayload({
                tutorialStage: body.tutorialStage,
                mode
            });
            const introEvent = await prepareEventForClient(payload.introEvent, payload.run, env);
            payload.uiState = buildUiState(payload.run);
            const sessionToken = await issueSessionToken(payload.run, env);

            return json(
                {
                    ok: true,
                    sessionToken,
                    uiState: payload.uiState,
                    introEvent,
                    nextTutorialStage: payload.nextTutorialStage,
                    casebookUnlocks: payload.unlocks
                },
                200,
                { "cache-control": "no-store" }
            );
        } catch (error) {
            if (error.message === "INVALID_JSON") {
                return badRequest("Invalid JSON body.");
            }

            return json(
                {
                    ok: false,
                    error: "INTERNAL_ERROR",
                    message: error.message
                },
                500,
                { "cache-control": "no-store" }
            );
        }
    }

    if (url.pathname === "/api/game/chat") {
        if (request.method !== "POST") {
            return methodNotAllowed(["POST", "OPTIONS"]);
        }

        try {
            const body = await parseJsonBody(request);
            const run = await readSessionToken(body.sessionToken, env);
            const payload = chatPayload(run, body.questionType);
            const event = await prepareEventForClient(payload.event, payload.run, env);
            payload.uiState = buildUiState(payload.run);
            const sessionToken = await issueSessionToken(payload.run, env);

            return json(
                {
                    ok: true,
                    sessionToken,
                    uiState: payload.uiState,
                    event,
                    casebookUnlocks: payload.unlocks
                },
                200,
                { "cache-control": "no-store" }
            );
        } catch (error) {
            if (["INVALID_JSON", "INVALID_SESSION"].includes(error.message)) {
                return badRequest(error.message === "INVALID_JSON" ? "Invalid JSON body." : "Session token is invalid.");
            }

            return badRequest("Unable to process chat action.", error.message);
        }
    }

    if (url.pathname === "/api/game/action") {
        if (request.method !== "POST") {
            return methodNotAllowed(["POST", "OPTIONS"]);
        }

        try {
            const body = await parseJsonBody(request);
            const run = await readSessionToken(body.sessionToken, env);
            const payload = actionPayload(run, body.actionType);
            const sessionToken = await issueSessionToken(payload.run, env);
            const event = await prepareEventForClient(payload.event, payload.run, env);

            return json(
                {
                    ok: true,
                    sessionToken,
                    uiState: payload.uiState,
                    event,
                    casebookUnlocks: payload.unlocks
                },
                200,
                { "cache-control": "no-store" }
            );
        } catch (error) {
            if (["INVALID_JSON", "INVALID_SESSION"].includes(error.message)) {
                return badRequest(error.message === "INVALID_JSON" ? "Invalid JSON body." : "Session token is invalid.");
            }

            return badRequest("Unable to process action.", error.message);
        }
    }

    return notFound(url.pathname);
}

export {
    ACTION_DEFS,
    CASEBOOK,
    CHAT_DEFS,
    DISEASES,
    GAME_CONFIG
};
