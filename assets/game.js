(async () => {
    const data = window.GAME_DATA;

    if (!data) {
        console.error("GAME_DATA is missing.");
        return;
    }

    const { CONFIG, AVATARS, DISEASES, FLIRT_LINES, ALL_TAGS } = data;
    const state = {
        frustration: CONFIG.startFrustration,
        anxiety: 0,
        turn: 1,
        items: { testkit: 1 },
        currentPartner: null,
        isInfected: false,
        infectionData: null,
        isGameOver: false,
        history: [],
        nextButtonMode: "continue",
        runtime: null
    };

    const dom = {
        body: document.body,
        gameContainer: document.getElementById("game-container"),
        gameContent: document.getElementById("game-content"),
        introModal: document.getElementById("intro-modal"),
        helpModal: document.getElementById("help-modal"),
        feedbackOverlay: document.getElementById("feedback-overlay"),
        frustrationBar: document.getElementById("frustration-bar"),
        frustrationValue: document.getElementById("frustration-val"),
        anxietyBar: document.getElementById("anxiety-bar"),
        anxietyValue: document.getElementById("anxiety-val"),
        panicWarning: document.getElementById("panic-warning"),
        turnCount: document.getElementById("turn-count"),
        testkitCount: document.getElementById("item-testkit"),
        avatarEmoji: document.getElementById("avatar-emoji"),
        partnerStatus: document.getElementById("partner-status"),
        flirtText: document.getElementById("flirt-text"),
        tagsContainer: document.getElementById("tags-container"),
        chatButton: document.getElementById("btn-chat"),
        feedbackIcon: document.getElementById("feedback-icon"),
        feedbackTitle: document.getElementById("feedback-title"),
        feedbackMessage: document.getElementById("feedback-message"),
        diseaseReport: document.getElementById("disease-report"),
        diseaseContent: document.getElementById("disease-content"),
        historyContainer: document.getElementById("history-container"),
        historyList: document.getElementById("history-list"),
        nextButton: document.getElementById("next-btn"),
        restartButton: document.getElementById("restart-btn"),
        buildChip: document.getElementById("build-chip"),
        runtimeNote: document.getElementById("runtime-note"),
        startButton: document.getElementById("start-game-btn"),
        helpOpenButton: document.getElementById("open-help-btn"),
        helpCloseButtons: document.querySelectorAll("[data-close-help]"),
        hospitalButton: document.getElementById("go-hospital-btn"),
        testkitButton: document.getElementById("use-testkit-btn"),
        actionButtons: Array.from(document.querySelectorAll("[data-action]"))
    };

    const ACTION_BUTTON_IDS = [
        "btn-oral-condom",
        "btn-oral-raw",
        "btn-sex-condom",
        "btn-sex-raw"
    ];

    function setHidden(element, hidden) {
        if (!element) {
            return;
        }
        element.hidden = hidden;
    }

    function updateBuildStatus(mode, detail) {
        dom.buildChip.textContent = mode;
        dom.runtimeNote.textContent = detail;
    }

    async function loadRuntimeConfig() {
        const apiBase = dom.body.dataset.apiBase || "/api";
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 1500);

        updateBuildStatus("静态模式", "Pages 可独立运行；Worker 接通后会在这里显示 Edge 状态。");

        try {
            const response = await fetch(`${apiBase}/bootstrap`, {
                headers: { Accept: "application/json" },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Bootstrap request failed: ${response.status}`);
            }

            const payload = await response.json();
            state.runtime = payload;

            const version = payload.app && payload.app.version ? ` · ${payload.app.version}` : "";
            const aiStatus = payload.app && payload.app.aiEnabled ? "AI 边界已启用" : "AI 边界已预留";

            updateBuildStatus("Edge 已连接", `${aiStatus}${version}`);
        } catch (error) {
            console.warn("Falling back to static runtime.", error);
            state.runtime = null;
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function bindEvents() {
        dom.startButton.addEventListener("click", startGame);
        dom.helpOpenButton.addEventListener("click", () => toggleHelp(true));
        dom.helpModal.addEventListener("click", (event) => {
            if (event.target === dom.helpModal) {
                toggleHelp(false);
            }
        });

        dom.helpCloseButtons.forEach((button) => {
            button.addEventListener("click", () => toggleHelp(false));
        });

        dom.testkitButton.addEventListener("click", () => useItem("testkit"));
        dom.hospitalButton.addEventListener("click", goToHospital);

        dom.actionButtons.forEach((button) => {
            button.addEventListener("click", () => takeAction(button.dataset.action));
        });

        dom.nextButton.addEventListener("click", () => {
            if (state.nextButtonMode === "close") {
                setHidden(dom.feedbackOverlay, true);
                state.nextButtonMode = "continue";
                dom.nextButton.textContent = "继续";
                return;
            }

            nextTurn();
        });

        dom.restartButton.addEventListener("click", returnToIntro);
    }

    function toggleHelp(force) {
        const shouldShow = typeof force === "boolean" ? force : dom.helpModal.hidden;
        setHidden(dom.helpModal, !shouldShow);
    }

    function resetFeedbackState() {
        dom.feedbackTitle.dataset.tone = "default";
        dom.feedbackTitle.textContent = "";
        dom.feedbackIcon.textContent = "";
        dom.feedbackMessage.innerHTML = "";
        dom.diseaseContent.innerHTML = "";
        setHidden(dom.diseaseReport, true);
        setHidden(dom.historyContainer, true);
        setHidden(dom.nextButton, false);
        setHidden(dom.restartButton, true);
        dom.nextButton.textContent = "继续";
        state.nextButtonMode = "continue";
    }

    function startGame() {
        setHidden(dom.introModal, true);
        setHidden(dom.gameContainer, false);
        initGame();
    }

    function returnToIntro() {
        resetFeedbackState();
        setHidden(dom.feedbackOverlay, true);
        setHidden(dom.gameContainer, true);
        setHidden(dom.helpModal, true);
        setHidden(dom.introModal, false);
    }

    function initGame() {
        state.frustration = CONFIG.startFrustration;
        state.anxiety = 0;
        state.turn = 1;
        state.items = { testkit: 1 };
        state.currentPartner = null;
        state.isInfected = false;
        state.infectionData = null;
        state.isGameOver = false;
        state.history = [];

        resetFeedbackState();
        updateStatsUI();
        generateNewPartner();
    }

    function getTagTone(tag) {
        if (tag.constraint) {
            return "constraint";
        }

        if (tag.color.includes("red") || tag.color.includes("rose")) {
            return "risk";
        }

        if (tag.color.includes("purple")) {
            return "warning";
        }

        if (tag.color.includes("emerald") || tag.color.includes("sky")) {
            return "safe";
        }

        if (tag.color.includes("amber")) {
            return "caution";
        }

        return "neutral";
    }

    function getTagIcon(tag) {
        if (tag.constraint) {
            return "🚫";
        }

        const tone = getTagTone(tag);

        if (tone === "risk") {
            return "⚠️";
        }

        if (tone === "warning") {
            return "☣️";
        }

        if (tone === "safe") {
            return "🛡️";
        }

        if (tone === "caution") {
            return "🟠";
        }

        return "⏺";
    }

    function generateNewPartner() {
        const numTags = Math.floor(Math.random() * 2) + 3;
        const partnerTags = [];
        const selectedIndices = new Set();
        const isCarrier = Math.random() < 0.4;
        const hasConstraint = Math.random() < 0.4;

        let loopLimit = 0;
        while (partnerTags.length < numTags && loopLimit < 100) {
            loopLimit += 1;
            const idx = Math.floor(Math.random() * ALL_TAGS.length);

            if (selectedIndices.has(idx)) {
                continue;
            }

            const tagTemplate = ALL_TAGS[idx];

            if (isCarrier && partnerTags.length === 0 && !tagTemplate.color.includes("red") && !tagTemplate.color.includes("purple")) {
                continue;
            }

            if (hasConstraint && !partnerTags.some((tag) => tag.constraint) && !tagTemplate.constraint && loopLimit < 50) {
                continue;
            }

            const currentConstraints = partnerTags.map((tag) => tag.constraint).filter(Boolean);
            if (tagTemplate.constraint) {
                if (tagTemplate.constraint === "no_oral" && currentConstraints.includes("oral_only")) {
                    continue;
                }
                if (tagTemplate.constraint === "oral_only" && currentConstraints.includes("no_oral")) {
                    continue;
                }
            }

            selectedIndices.add(idx);

            let isHidden = false;
            const currentHiddenCount = partnerTags.filter((tag) => !tag.revealed).length;
            if (currentHiddenCount === 0 && tagTemplate.hiddenChance > 0) {
                isHidden = Math.random() < tagTemplate.hiddenChance;
            }

            partnerTags.push({
                ...tagTemplate,
                revealed: !isHidden
            });
        }

        if (partnerTags.every((tag) => !tag.revealed) && partnerTags[0]) {
            partnerTags[0].revealed = true;
        }

        let activeDiseases = [];

        if (Math.random() < 0.05) {
            const keys = Object.keys(DISEASES);
            activeDiseases.push(keys[Math.floor(Math.random() * keys.length)]);
        }

        partnerTags.forEach((tag) => {
            if (tag.risk) {
                Object.entries(tag.risk).forEach(([diseaseKey, probability]) => {
                    if (Math.random() < probability && !activeDiseases.includes(diseaseKey)) {
                        activeDiseases.push(diseaseKey);
                    }
                });
            }

            if (tag.safeChance && Math.random() < tag.safeChance) {
                activeDiseases = [];
            }
        });

        state.currentPartner = {
            tags: partnerTags,
            diseases: activeDiseases,
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
        };

        renderPartner();
    }

    function updateStatsUI() {
        dom.frustrationBar.style.width = `${state.frustration}%`;
        dom.frustrationValue.textContent = `${state.frustration}%`;
        dom.anxietyBar.style.width = `${state.anxiety}%`;
        dom.anxietyValue.textContent = `${state.anxiety}%`;
        dom.turnCount.textContent = String(state.turn).padStart(2, "0");
        dom.testkitCount.textContent = `x${state.items.testkit}`;
        dom.testkitCount.classList.toggle("is-empty", state.items.testkit === 0);

        if (state.anxiety >= 80) {
            dom.gameContent.classList.add("panic-mode");
            setHidden(dom.panicWarning, false);
        } else {
            dom.gameContent.classList.remove("panic-mode");
            setHidden(dom.panicWarning, true);
        }
    }

    function resetActionButtons() {
        ACTION_BUTTON_IDS.forEach((id) => {
            const button = document.getElementById(id);

            button.disabled = false;
            button.classList.remove("is-disabled");

            const overlay = button.querySelector(".action-lock");
            if (overlay) {
                overlay.remove();
            }
        });
    }

    function disableActionButton(id) {
        const button = document.getElementById(id);

        if (!button || button.disabled) {
            return;
        }

        button.disabled = true;
        button.classList.add("is-disabled");

        const overlay = document.createElement("span");
        overlay.className = "action-lock";
        overlay.textContent = "对方拒绝";
        button.appendChild(overlay);
    }

    function applyConstraints(constraints) {
        constraints.forEach((constraint) => {
            if (constraint === "no_condom") {
                disableActionButton("btn-oral-condom");
                disableActionButton("btn-sex-condom");
            } else if (constraint === "condom_only") {
                disableActionButton("btn-oral-raw");
                disableActionButton("btn-sex-raw");
            } else if (constraint === "no_oral") {
                disableActionButton("btn-oral-condom");
                disableActionButton("btn-oral-raw");
            } else if (constraint === "oral_only") {
                disableActionButton("btn-sex-condom");
                disableActionButton("btn-sex-raw");
            }
        });
    }

    function renderPartner() {
        const partner = state.currentPartner;
        const container = dom.tagsContainer;
        const constraints = [];
        const isPanic = state.anxiety >= 80;
        let hiddenCount = 0;

        dom.avatarEmoji.textContent = partner.avatar;
        dom.flirtText.textContent = `"${FLIRT_LINES[Math.floor(Math.random() * FLIRT_LINES.length)]}"`;
        setHidden(dom.partnerStatus, true);
        container.innerHTML = "";

        partner.tags.forEach((tag) => {
            const forceHide = isPanic && Math.random() < 0.5;
            const chip = document.createElement("div");

            if (!tag.revealed || forceHide) {
                hiddenCount += 1;
                chip.className = "tag tag--hidden";
                chip.innerHTML = isPanic ? "<span class=\"tag-blur\">???</span>" : "<span>❓</span> 隐藏信息";
            } else {
                if (tag.constraint) {
                    constraints.push(tag.constraint);
                }

                chip.className = `tag tag--${getTagTone(tag)} tag--reveal`;
                chip.title = tag.clue || "";
                chip.innerHTML = `<span class="tag-icon">${getTagIcon(tag)}</span><span>${tag.text}</span>`;
            }

            container.appendChild(chip);
        });

        resetActionButtons();
        if (constraints.length > 0) {
            applyConstraints(constraints);
        }

        if (hiddenCount === 0 && !isPanic) {
            dom.chatButton.disabled = true;
            dom.chatButton.classList.add("is-disabled");
            dom.chatButton.innerHTML = "<span>💬</span><span>已完全了解</span>";
        } else {
            dom.chatButton.disabled = false;
            dom.chatButton.classList.remove("is-disabled");
            dom.chatButton.innerHTML = "<span>💬</span><span>试探 / 聊天</span><span class=\"button-note\">压抑值+3</span>";
        }
    }

    function advanceTime(frustrationDelta, anxietyDelta = 0) {
        state.turn += 1;
        state.frustration += frustrationDelta;
        state.anxiety += anxietyDelta;

        if (state.anxiety > 20) {
            state.anxiety += CONFIG.anxietyGainPassive;
        }

        if (state.frustration > 100) {
            state.frustration = 100;
        }

        if (state.anxiety > 100) {
            state.anxiety = 100;
        }

        updateStatsUI();

        if (state.frustration >= 100) {
            showGameOver(
                "欲火焚身",
                "长期的压抑让你彻底失去了理智。你无法再思考后果，在绝望中发生了一次随机的高危行为。",
                "🤯"
            );
            return true;
        }

        if (state.anxiety >= 100) {
            showGameOver(
                "精神崩溃",
                "巨大的心理压力压垮了你。你开始出现幻觉，被送往了精神病院，游戏结束。",
                "😵‍💫"
            );
            return true;
        }

        return false;
    }

    function recordHistory(action, infectedThisTurn) {
        const partner = state.currentPartner;
        const isDiseased = partner.diseases.length > 0;
        let outcomeLabel = "";
        let outcomeTone = "neutral";

        if (action === "refuse") {
            if (isDiseased) {
                outcomeLabel = "🛡️ 正确离开";
                outcomeTone = "leave";
            } else {
                outcomeLabel = "👋 遗憾错过";
                outcomeTone = "miss";
            }
        } else if (infectedThisTurn) {
            outcomeLabel = "💀 被 ta 感染";
            outcomeTone = "infected";
        } else if (isDiseased) {
            outcomeLabel = "😰 死里逃生";
            outcomeTone = "escape";
        } else {
            outcomeLabel = "✅ 理智享受";
            outcomeTone = "enjoy";
        }

        state.history.push({
            avatar: partner.avatar,
            tags: partner.tags.map((tag) => ({ text: tag.text })),
            diseases: partner.diseases.slice(),
            action,
            outcomeLabel,
            outcomeTone
        });
    }

    function renderHistoryList() {
        dom.historyList.innerHTML = "";

        state.history.forEach((item) => {
            const entry = document.createElement("div");
            const tagsMarkup = item.tags
                .map((tag) => `<span class="history-tag">${tag.text}</span>`)
                .join("");

            const diseaseMarkup = item.diseases.length > 0
                ? `<span class="history-disease">携带: ${item.diseases.map((key) => DISEASES[key].name).join("，")}</span>`
                : "<span class=\"history-safe\">健康</span>";

            entry.className = "history-entry";
            entry.innerHTML = `
                <div class="history-avatar">
                    <span>${item.avatar}</span>
                    ${item.diseases.length > 0 ? "<span class=\"history-status\">🦠</span>" : ""}
                </div>
                <div class="history-copy">
                    <div class="history-tags">${tagsMarkup}</div>
                    <div class="history-subline">${diseaseMarkup}</div>
                </div>
                <div class="history-outcome history-outcome--${item.outcomeTone}">
                    ${item.outcomeLabel}
                </div>
            `;

            dom.historyList.appendChild(entry);
        });
    }

    function useItem(type) {
        if (type !== "testkit" || state.items.testkit <= 0 || !state.currentPartner) {
            return;
        }

        state.items.testkit -= 1;

        const partner = state.currentPartner;
        let message = "";
        let icon = "";

        if (partner.diseases.length > 0) {
            const names = partner.diseases.map((key) => DISEASES[key].name).join("、");
            message = "<span class=\"u-danger\">⚠️ 阳性反应！</span><br>病原体：" + names + "。<br>请立即离开。";
            icon = "🦠";
            setHidden(dom.partnerStatus, false);
        } else {
            message = "<span class=\"u-success\">✅ 阴性。</span><br>未检测到常见病原体。<br><span class=\"u-muted\">注：无法检测窗口期极短的病毒。</span>";
            icon = "🛡️";
        }

        partner.tags.forEach((tag) => {
            tag.revealed = true;
        });

        renderPartner();
        updateStatsUI();
        showFeedback("检测结果", message, icon, true);
    }

    function goToHospital() {
        const survived = !advanceTime(CONFIG.hospitalCost, 0);

        if (!survived) {
            return;
        }

        state.anxiety = 0;
        updateStatsUI();

        if (state.isInfected) {
            showGameOver(
                "确诊感染",
                "很遗憾，医院的检查结果显示你已感染。<br>之前的侥幸心理终究没能救你。",
                "🏥",
                state.infectionData
            );
            return;
        }

        showFeedback(
            "虚惊一场",
            "<span class=\"u-success\">检测结果阴性。</span><br>你身体是健康的。心理压力已清空，但你也为此浪费了宝贵的时间。",
            "🏥",
            true
        );
    }

    function nextTurn() {
        setHidden(dom.feedbackOverlay, true);
        resetFeedbackState();
        generateNewPartner();
    }

    function takeAction(actionType) {
        if (state.frustration >= 100 || state.anxiety >= 100 || !state.currentPartner) {
            return;
        }

        if (actionType === "chat") {
            const hiddenIndices = state.currentPartner.tags
                .map((tag, index) => (!tag.revealed ? index : -1))
                .filter((index) => index !== -1);

            if (hiddenIndices.length > 0) {
                const pickedIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
                state.currentPartner.tags[pickedIndex].revealed = true;
            }

            if (!advanceTime(CONFIG.chatCost, 0)) {
                renderPartner();
            }
            return;
        }

        const partner = state.currentPartner;
        let infectedThisTurn = false;

        if (actionType === "refuse") {
            recordHistory("refuse", false);

            if (!advanceTime(CONFIG.passiveGain + CONFIG.refuseCost, 0)) {
                showFeedback("继续寻找", "你选择了离开。压抑值上升，但至少你暂时是安全的。", "🏃");
            }
            return;
        }

        const reduction = CONFIG.rewards[actionType];
        const anxietyGain = CONFIG.stress[actionType];

        if (!state.isInfected && partner.diseases.length > 0) {
            for (const diseaseKey of partner.diseases) {
                const disease = DISEASES[diseaseKey];
                let chance = 0;

                if (actionType === "sex_raw") {
                    chance = 0.95;
                } else if (actionType === "oral_raw") {
                    chance = disease.riskType.includes("skin") || disease.riskType.includes("mucous") ? 0.5 : 0.1;
                } else if (actionType === "sex_condom") {
                    if (disease.riskType === "skin_hair") {
                        chance = 1.0;
                    } else if (disease.riskType === "contact") {
                        chance = 0.3;
                    } else {
                        chance = 0.02;
                    }
                } else if (actionType === "oral_condom") {
                    chance = 0.01;
                }

                if (Math.random() < chance) {
                    state.isInfected = true;
                    state.infectionData = disease;
                    infectedThisTurn = true;
                    break;
                }
            }
        }

        recordHistory(actionType, infectedThisTurn);

        state.frustration -= reduction;
        const frustrationDelta = CONFIG.passiveGain - reduction;

        if (advanceTime(frustrationDelta, anxietyGain)) {
            return;
        }

        if (state.frustration < 0) {
            state.frustration = 0;
            updateStatsUI();
        }

        if (state.frustration === 0) {
            if (state.isInfected) {
                showGameOver(
                    "糟糕的胜利",
                    "你的压抑值清零了，你感到无比轻松...<br>但在几天后，你的身体开始出现异常反应。<br>你虽然释放了欲望，却输掉了健康。",
                    "🥀",
                    state.infectionData
                );
            } else {
                showWin();
            }
            return;
        }

        let title = "宣泄与不安";
        let icon = "🍬";
        let message = `欲望得到了释放。<br>生理压抑 <span class="u-success">-${reduction}</span>`;

        if (anxietyGain > 5) {
            message += `<br>心理压力 <span class="u-warning">+${anxietyGain}</span>`;
            icon = "😰";
        }

        if (state.isInfected) {
            message += "<br><span class=\"u-muted\">你感觉到了一丝异样，但也许只是错觉...？</span>";
        } else if (partner.diseases.length > 0) {
            message += "<br><span class=\"u-muted\">虽然过程很惊险，但你似乎运气不错...暂时。</span>";
        }

        showFeedback(title, message, icon);
    }

    function getStatsHTML() {
        const counts = { enjoy: 0, escape: 0, leave: 0, miss: 0, infected: 0 };

        state.history.forEach((item) => {
            if (item.outcomeTone === "enjoy") {
                counts.enjoy += 1;
            } else if (item.outcomeTone === "escape") {
                counts.escape += 1;
            } else if (item.outcomeTone === "leave") {
                counts.leave += 1;
            } else if (item.outcomeTone === "miss") {
                counts.miss += 1;
            } else if (item.outcomeTone === "infected") {
                counts.infected += 1;
            }
        });

        return `
            <div class="summary-stats">
                <h4 class="summary-stats__title">生涯统计</h4>
                <div class="summary-stats__grid">
                    <div class="summary-stats__row"><span>✅ 理智享受</span><strong>${counts.enjoy}</strong></div>
                    <div class="summary-stats__row"><span>🛡️ 正确离开</span><strong>${counts.leave}</strong></div>
                    <div class="summary-stats__row"><span>😰 死里逃生</span><strong>${counts.escape}</strong></div>
                    <div class="summary-stats__row"><span>👋 遗憾错过</span><strong>${counts.miss}</strong></div>
                    <div class="summary-stats__row summary-stats__row--danger"><span>💀 被感染次数</span><strong>${counts.infected}</strong></div>
                </div>
                <div class="summary-stats__footer">
                    <span>⏱️ 存活回合</span>
                    <strong>${state.turn - 1}</strong>
                </div>
            </div>
        `;
    }

    function showFeedback(title, message, icon, isSimpleAlert = false) {
        resetFeedbackState();
        dom.feedbackTitle.textContent = title;
        dom.feedbackIcon.textContent = icon;
        dom.feedbackMessage.innerHTML = message;
        setHidden(dom.feedbackOverlay, false);

        if (isSimpleAlert) {
            state.nextButtonMode = "close";
            dom.nextButton.textContent = "关闭";
        }
    }

    function showGameOver(title, message, icon, disease = null) {
        state.isGameOver = true;
        resetFeedbackState();

        dom.feedbackTitle.textContent = title;
        dom.feedbackTitle.dataset.tone = "danger";
        dom.feedbackIcon.textContent = icon;
        dom.feedbackMessage.innerHTML = message + getStatsHTML();

        if (disease) {
            dom.diseaseContent.innerHTML = `<p><b>确诊：</b>${disease.name}</p><p><b>途径：</b>${disease.transmission}</p>`;
            setHidden(dom.diseaseReport, false);
        }

        renderHistoryList();
        setHidden(dom.historyContainer, false);
        setHidden(dom.nextButton, true);
        setHidden(dom.restartButton, false);
        setHidden(dom.feedbackOverlay, false);
    }

    function showWin() {
        state.isGameOver = true;
        resetFeedbackState();

        dom.feedbackTitle.textContent = "幸存者";
        dom.feedbackTitle.dataset.tone = "success";
        dom.feedbackIcon.textContent = "✨";
        dom.feedbackMessage.innerHTML =
            "你成功清零了压抑值，且身体健康。<br><br>在这场充满迷雾和风险的游戏中，你靠着谨慎、策略和一点运气活了下来。" +
            getStatsHTML();

        renderHistoryList();
        setHidden(dom.historyContainer, false);
        setHidden(dom.nextButton, true);
        setHidden(dom.restartButton, false);
        setHidden(dom.feedbackOverlay, false);
    }

    bindEvents();
    await loadRuntimeConfig();
})();
