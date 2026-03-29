import test from "node:test";
import assert from "node:assert/strict";

import {
    actionPayload,
    chatPayload,
    handleApiRequest,
    issueSessionToken,
    readSessionToken,
    startRunPayload
} from "../worker/src/game-engine.mjs";

const env = {
    APP_ENV: "test",
    APP_VERSION: "2026-03-29-test",
    SESSION_SECRET: "test-secret"
};

test("same seed and same choices stay deterministic", async () => {
    const runA = startRunPayload({ tutorialStage: 3, seed: 424242, mode: "male" }).run;
    const runB = startRunPayload({ tutorialStage: 3, seed: 424242, mode: "male" }).run;

    const stepA1 = chatPayload(runA, "smalltalk");
    const stepB1 = chatPayload(runB, "smalltalk");
    const stepA2 = actionPayload(stepA1.run, "sex_condom");
    const stepB2 = actionPayload(stepB1.run, "sex_condom");

    assert.deepEqual(stepA1.uiState, stepB1.uiState);
    assert.deepEqual(stepA1.event, stepB1.event);
    assert.deepEqual(stepA2.uiState, stepB2.uiState);
    assert.deepEqual(stepA2.event, stepB2.event);
});

test("session token rejects tampering", async () => {
    const run = startRunPayload({ tutorialStage: 3, seed: 7, mode: "male" }).run;
    const token = await issueSessionToken(run, env);
    const parsed = await readSessionToken(token, env);
    assert.equal(parsed.runSeed, run.runSeed);

    const [payloadPart, signaturePart] = token.split(".");
    const tamperedPayload = `${payloadPart.slice(0, 4)}${payloadPart[4] === "a" ? "b" : "a"}${payloadPart.slice(5)}`;
    const tampered = `${tamperedPayload}.${signaturePart}`;
    await assert.rejects(() => readSessionToken(tampered, env), /INVALID_SESSION/);
});

test("tutorial 1 teaches red flags and tutorial 2 exposes contradictions", () => {
    const stage0 = startRunPayload({ tutorialStage: 0, seed: 11, mode: "male" });
    assert.equal(stage0.uiState.partner.sceneLabel, "夜店散场后");
    assert.ok(stage0.introEvent.lines[0].text.includes("红旗"));

    const stage1 = startRunPayload({ tutorialStage: 1, seed: 12, mode: "male" });
    const afterProbe = chatPayload(stage1.run, "probe");
    const contradiction = afterProbe.uiState.partner.clues.find((clue) => clue.revealed && clue.id === "probe");
    assert.ok(contradiction.text.includes("打岔"));
    assert.ok(afterProbe.event.lines.some((line) => line.text.includes("矛盾")));
});

test("testkit stays a strong clue instead of full reveal", () => {
    const stage1 = startRunPayload({ tutorialStage: 1, seed: 12, mode: "male" });
    const afterTest = actionPayload(stage1.run, "use_testkit");
    const hiddenCount = afterTest.uiState.partner.clues.filter((clue) => !clue.revealed).length;

    assert.ok(hiddenCount >= 1);
    assert.equal(afterTest.uiState.stats.testkit, 0);
});

test("chat is capped at two times per partner", () => {
    const stage2 = startRunPayload({ tutorialStage: 2, seed: 77, mode: "male" });
    const afterFirst = chatPayload(stage2.run, "smalltalk");
    const afterSecond = chatPayload(afterFirst.run, "probe");

    assert.throws(() => chatPayload(afterSecond.run, "boundary"), /CHAT_EXHAUSTED/);
});

test("known constraints lock forbidden actions in ui state", () => {
    const stage2 = startRunPayload({ tutorialStage: 2, seed: 77, mode: "male" });
    assert.equal(stage2.uiState.partner.actionLocks.sex_condom.disabled, true);
    assert.equal(stage2.uiState.partner.actionLocks.sex_raw.disabled, true);
    assert.equal(stage2.uiState.partner.actionLocks.oral_raw.disabled, false);
});

test("api start and invalid session return expected status codes", async () => {
    const startResponse = await handleApiRequest(
        new Request("https://example.com/api/game/start", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tutorialStage: 0, mode: "male" })
        }),
        env
    );
    assert.equal(startResponse.status, 200);

    const invalidResponse = await handleApiRequest(
        new Request("https://example.com/api/game/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionToken: "bad.token", questionType: "probe" })
        }),
        env
    );
    assert.equal(invalidResponse.status, 400);
});
