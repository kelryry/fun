(async () => {
    const data = window.GAME_DATA;

    if (!data) {
        console.error("GAME_DATA is missing.");
        return;
    }

    const state = {
        runtime: null,
        sessionToken: null,
        uiState: null,
        busy: false,
        workerReady: false,
        currentMode: "male",
        nextButtonMode: "close",
        casebook: loadCasebook(),
        tutorialStage: loadTutorialStage()
    };

    const dom = {
        body: document.body,
        gameContainer: document.getElementById("game-container"),
        gameContent: document.getElementById("game-content"),
        introModal: document.getElementById("intro-modal"),
        helpModal: document.getElementById("help-modal"),
        casebookModal: document.getElementById("casebook-modal"),
        feedbackOverlay: document.getElementById("feedback-overlay"),
        frustrationBar: document.getElementById("frustration-bar"),
        frustrationValue: document.getElementById("frustration-val"),
        anxietyBar: document.getElementById("anxiety-bar"),
        anxietyValue: document.getElementById("anxiety-val"),
        panicWarning: document.getElementById("panic-warning"),
        turnCount: document.getElementById("turn-count"),
        testkitCount: document.getElementById("item-testkit"),
        modeChip: document.getElementById("mode-chip"),
        avatarEmoji: document.getElementById("avatar-emoji"),
        partnerStatus: document.getElementById("partner-status"),
        sceneLabel: document.getElementById("scene-label"),
        flirtText: document.getElementById("flirt-text"),
        tagsContainer: document.getElementById("tags-container"),
        chatButton: document.getElementById("btn-chat"),
        chatButtonLabel: document.getElementById("chat-button-label"),
        chatButtonNote: document.getElementById("chat-button-note"),
        chatPanel: document.getElementById("chat-panel"),
        chatOptionButtons: Array.from(document.querySelectorAll("[data-question-type]")),
        feedbackIcon: document.getElementById("feedback-icon"),
        feedbackTitle: document.getElementById("feedback-title"),
        feedbackMessage: document.getElementById("feedback-message"),
        diseaseReport: document.getElementById("disease-report"),
        diseaseContent: document.getElementById("disease-content"),
        criticalReason: document.getElementById("critical-reason"),
        unlockCard: document.getElementById("unlock-card"),
        historyContainer: document.getElementById("history-container"),
        historyList: document.getElementById("history-list"),
        nextButton: document.getElementById("next-btn"),
        restartButton: document.getElementById("restart-btn"),
        buildChip: document.getElementById("build-chip"),
        runtimeNote: document.getElementById("runtime-note"),
        startButtons: Array.from(document.querySelectorAll("[data-mode]")),
        helpOpenButton: document.getElementById("open-help-btn"),
        helpCloseButtons: document.querySelectorAll("[data-close-help]"),
        casebookOpenButtons: [
            document.getElementById("open-casebook-help-btn"),
            document.getElementById("open-casebook-feedback-btn")
        ].filter(Boolean),
        casebookCloseButtons: document.querySelectorAll("[data-close-casebook]"),
        casebookFeedbackButton: document.getElementById("open-casebook-feedback-btn"),
        hospitalButton: document.getElementById("go-hospital-btn"),
        testkitButton: document.getElementById("use-testkit-btn"),
        actionButtons: Array.from(document.querySelectorAll("[data-action]")),
        casebookSummary: document.getElementById("casebook-summary"),
        casebookLists: Object.fromEntries(
            data.CASEBOOK_SECTIONS.map((section) => [
                section.id,
                document.getElementById(`casebook-${section.id}`)
            ])
        )
    };

    function setHidden(element, hidden) {
        if (element) {
            element.hidden = hidden;
        }
    }

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    function setWidth(element, value) {
        if (element) {
            element.style.width = value;
        }
    }

    function createEmptyCasebook() {
        return {
            personas: {},
            lieTypes: {},
            endings: {},
            diseases: {},
            titles: {}
        };
    }

    function loadCasebook() {
        try {
            const raw = window.localStorage.getItem(data.STORAGE_KEYS.casebook);
            if (!raw) {
                return createEmptyCasebook();
            }

            const parsed = JSON.parse(raw);
            return {
                ...createEmptyCasebook(),
                ...parsed
            };
        } catch (error) {
            console.warn("Failed to load casebook.", error);
            return createEmptyCasebook();
        }
    }

    function saveCasebook() {
        window.localStorage.setItem(data.STORAGE_KEYS.casebook, JSON.stringify(state.casebook));
    }

    function loadTutorialStage() {
        const raw = Number(window.localStorage.getItem(data.STORAGE_KEYS.tutorialStage));
        if (Number.isNaN(raw) || raw < 0) {
            return 0;
        }

        return Math.min(raw, 3);
    }

    function saveTutorialStage(value) {
        state.tutorialStage = value;
        window.localStorage.setItem(data.STORAGE_KEYS.tutorialStage, String(value));
    }

    function getModeMeta(mode) {
        return data.MODES[mode] || data.MODES.male;
    }

    function updateModeChip(mode) {
        state.currentMode = mode;
        setText(dom.modeChip, getModeMeta(mode).label);
    }

    function updateBuildStatus(mode, detail, ready = false) {
        setText(dom.buildChip, mode);
        setText(dom.runtimeNote, detail);
        dom.startButtons.forEach((button) => {
            button.disabled = !ready;
        });
        state.workerReady = ready;
    }

    async function loadRuntimeConfig() {
        const apiBase = dom.body.dataset.apiBase || "/api";
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 1800);

        updateBuildStatus("服务器检查中", "正在确认服务器有没有接住这一局……", false);

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
            updateBuildStatus(
                "服务器在线",
                payload.app.aiEnabled
                    ? "双视角已上线，聊天和终局复盘会更像真人说话。"
                    : "双视角已上线，聊天和终局复盘先走稳定模板。",
                true
            );
        } catch (error) {
            console.warn("Bootstrap failed.", error);
            state.runtime = null;
            updateBuildStatus(
                "服务器离线",
                "服务器没接上，这一版暂时不能开局。",
                false
            );
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    async function apiPost(path, payload) {
        const apiBase = dom.body.dataset.apiBase || "/api";
        const response = await fetch(`${apiBase}${path}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok || body.ok === false) {
            const message = body.message || `Request failed: ${response.status}`;
            const detail = body.detail ? ` (${body.detail})` : "";
            throw new Error(`${message}${detail}`);
        }

        return body;
    }

    function setBusy(isBusy) {
        state.busy = isBusy;
        const disabled = isBusy || !state.uiState || state.uiState.gameOver;

        dom.chatButton.disabled = isBusy || !state.uiState?.partner?.chat?.available;
        dom.chatOptionButtons.forEach((button) => {
            button.disabled = isBusy || button.disabled;
        });
        dom.testkitButton.disabled = disabled;
        dom.hospitalButton.disabled = disabled;
        dom.actionButtons.forEach((button) => {
            if (!isBusy) {
                return;
            }

            button.disabled = true;
        });
    }

    function bindEvents() {
        dom.startButtons.forEach((button) => {
            button.addEventListener("click", () => startGame(button.dataset.mode || "male"));
        });
        dom.helpOpenButton.addEventListener("click", () => toggleHelp(true));
        dom.helpModal.addEventListener("click", (event) => {
            if (event.target === dom.helpModal) {
                toggleHelp(false);
            }
        });

        dom.helpCloseButtons.forEach((button) => {
            button.addEventListener("click", () => toggleHelp(false));
        });

        dom.casebookOpenButtons.forEach((button) => {
            button.addEventListener("click", () => toggleCasebook(true));
        });

        dom.casebookCloseButtons.forEach((button) => {
            button.addEventListener("click", () => toggleCasebook(false));
        });

        dom.casebookModal.addEventListener("click", (event) => {
            if (event.target === dom.casebookModal) {
                toggleCasebook(false);
            }
        });

        dom.chatButton.addEventListener("click", () => {
            if (!state.uiState?.partner?.chat?.available || state.busy) {
                return;
            }

            setHidden(dom.chatPanel, !dom.chatPanel.hidden);
        });

        dom.chatOptionButtons.forEach((button) => {
            button.addEventListener("click", () => askQuestion(button.dataset.questionType));
        });

        dom.testkitButton.addEventListener("click", () => performAction("use_testkit"));
        dom.hospitalButton.addEventListener("click", () => performAction("hospital"));

        dom.actionButtons.forEach((button) => {
            button.addEventListener("click", () => performAction(button.dataset.action));
        });

        dom.nextButton.addEventListener("click", () => {
            setHidden(dom.feedbackOverlay, true);
            state.nextButtonMode = "close";
        });

        dom.restartButton.addEventListener("click", returnToIntro);
    }

    function toggleHelp(force) {
        const shouldShow = typeof force === "boolean" ? force : dom.helpModal.hidden;
        setHidden(dom.helpModal, !shouldShow);
    }

    function toggleCasebook(force) {
        const shouldShow = typeof force === "boolean" ? force : dom.casebookModal.hidden;
        if (shouldShow) {
            renderCasebook();
        }

        setHidden(dom.casebookModal, !shouldShow);
    }

    function resetFeedbackState() {
        dom.feedbackTitle.dataset.tone = "default";
        setText(dom.feedbackTitle, "");
        setText(dom.feedbackIcon, "");
        dom.feedbackMessage.innerHTML = "";
        dom.diseaseContent.innerHTML = "";
        dom.criticalReason.innerHTML = "";
        dom.unlockCard.innerHTML = "";
        setHidden(dom.diseaseReport, true);
        setHidden(dom.criticalReason, true);
        setHidden(dom.unlockCard, true);
        setHidden(dom.historyContainer, true);
        setHidden(dom.nextButton, false);
        setHidden(dom.restartButton, true);
        setHidden(dom.casebookFeedbackButton, true);
        dom.nextButton.textContent = "继续";
        state.nextButtonMode = "close";
        if (dom.historyContainer) {
            dom.historyContainer.open = true;
        }
    }

    function renderCasebook() {
        const totals = Object.fromEntries(
            Object.keys(state.casebook).map((key) => [key, Object.keys(state.casebook[key] || {}).length])
        );

        dom.casebookSummary.innerHTML = "";
        [
            `已见人格 ${totals.personas}`,
            `已见话术 ${totals.lieTypes}`,
            `已达成结局 ${totals.endings}`,
            `已确认病原 ${totals.diseases}`,
            `已得称号 ${totals.titles}`
        ].forEach((text) => {
            const line = document.createElement("p");
            line.textContent = text;
            dom.casebookSummary.appendChild(line);
        });

        data.CASEBOOK_SECTIONS.forEach((section) => {
            const container = dom.casebookLists[section.id];
            container.innerHTML = "";
            const entries = Object.values(state.casebook[section.id] || {});

            if (entries.length === 0) {
                const empty = document.createElement("span");
                empty.className = "casebook-empty";
                empty.textContent = "还没记下东西";
                container.appendChild(empty);
                return;
            }

            entries
                .sort((left, right) => left.label.localeCompare(right.label, "zh-Hans-CN"))
                .forEach((entry) => {
                    const chip = document.createElement("span");
                    chip.className = "casebook-chip";
                    chip.textContent = entry.label;
                    container.appendChild(chip);
                });
        });
    }

    function mergeCasebookUnlocks(unlocks) {
        if (!unlocks) {
            return [];
        }

        const added = [];
        Object.entries(unlocks).forEach(([section, entries]) => {
            if (!state.casebook[section] || !Array.isArray(entries)) {
                return;
            }

            entries.forEach((entry) => {
                if (!entry || !entry.id || state.casebook[section][entry.id]) {
                    return;
                }

                state.casebook[section][entry.id] = entry;
                added.push(entry.label);
            });
        });

        if (added.length > 0) {
            saveCasebook();
        }

        return added;
    }

    function renderLines(container, lines) {
        container.innerHTML = "";
        lines.forEach((line) => {
            const paragraph = document.createElement("p");
            paragraph.className = `feedback-line feedback-line--${line.tone || "default"}`;
            paragraph.textContent = line.text;
            container.appendChild(paragraph);
        });
    }

    function renderSummary(container, summary) {
        if (!summary) {
            return;
        }

        const panel = document.createElement("div");
        panel.className = "summary-stats";
        panel.innerHTML = `
            <h4 class="summary-stats__title">生涯统计</h4>
            <div class="summary-stats__grid">
                <div class="summary-stats__row"><span>✅ 理智享受</span><strong>${summary.enjoyCount}</strong></div>
                <div class="summary-stats__row"><span>🛡️ 正确离开</span><strong>${summary.leaveCount}</strong></div>
                <div class="summary-stats__row"><span>😰 死里逃生</span><strong>${summary.escapeCount}</strong></div>
                <div class="summary-stats__row"><span>👋 遗憾错过</span><strong>${summary.missCount}</strong></div>
                <div class="summary-stats__row summary-stats__row--danger"><span>💀 被感染次数</span><strong>${summary.infectedCount}</strong></div>
            </div>
            <div class="summary-stats__footer">
                <span>⏱️ 存活回合</span>
                <strong>${summary.turnsSurvived}</strong>
            </div>
        `;
        container.appendChild(panel);
    }

    function renderUnlocks(unlockLabels) {
        dom.unlockCard.innerHTML = "";
        if (unlockLabels.length === 0) {
            setHidden(dom.unlockCard, true);
            return;
        }

        const title = document.createElement("strong");
        title.className = "unlock-card__title";
        title.textContent = "案件簿新增记录";
        dom.unlockCard.appendChild(title);

        unlockLabels.forEach((label) => {
            const chip = document.createElement("span");
            chip.className = "casebook-chip";
            chip.textContent = label;
            dom.unlockCard.appendChild(chip);
        });

        setHidden(dom.unlockCard, false);
    }

    function renderHistoryList(history) {
        dom.historyList.innerHTML = "";

        history.forEach((item) => {
            const entry = document.createElement("div");
            const cluesMarkup = item.clues
                .map((clue) => `<span class="history-tag">${escapeHtml(clue)}</span>`)
                .join("");
            const diseaseMarkup = item.diseases.length > 0
                ? `<span class="history-disease">携带: ${item.diseases.map((name) => escapeHtml(name)).join("，")}</span>`
                : "<span class=\"history-safe\">健康</span>";

            entry.className = "history-entry";
            entry.innerHTML = `
                <div class="history-avatar">
                    <span>${item.avatar}</span>
                    ${item.diseases.length > 0 ? "<span class=\"history-status\">🦠</span>" : ""}
                </div>
                <div class="history-copy">
                    <div class="history-scene">${escapeHtml(item.sceneLabel)}</div>
                    <div class="history-tags">${cluesMarkup}</div>
                    <div class="history-subline">${diseaseMarkup}</div>
                    <div class="history-subline history-subline--reason">${escapeHtml(item.reason || "")}</div>
                </div>
                <div class="history-outcome history-outcome--${item.outcomeTone}">
                    ${escapeHtml(item.outcomeLabel)}
                </div>
            `;

            dom.historyList.appendChild(entry);
        });

        setHidden(dom.historyContainer, history.length === 0);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#39;");
    }

    function showEvent(event, uiState, addedUnlocks) {
        resetFeedbackState();
        setText(dom.feedbackTitle, event.title);
        setText(dom.feedbackIcon, event.icon);
        dom.feedbackTitle.dataset.tone = event.tone || "default";
        renderLines(dom.feedbackMessage, event.lines || []);
        renderSummary(dom.feedbackMessage, uiState.summary);

        if (event.disease) {
            dom.diseaseContent.innerHTML = `<p><b>确诊：</b>${escapeHtml(event.disease.name)}</p><p><b>途径：</b>${escapeHtml(event.disease.transmission)}</p>`;
            setHidden(dom.diseaseReport, false);
        }

        if (event.criticalReason) {
            dom.criticalReason.textContent = event.criticalReason;
            setHidden(dom.criticalReason, false);
        }

        renderUnlocks(addedUnlocks);
        if (uiState.gameOver) {
            renderHistoryList(uiState.history || []);
            dom.historyContainer.open = true;
        } else {
            dom.historyList.innerHTML = "";
            setHidden(dom.historyContainer, true);
        }

        if (event.closeMode === "restart") {
            setHidden(dom.nextButton, true);
            setHidden(dom.restartButton, false);
            setHidden(dom.casebookFeedbackButton, false);
        } else {
            setText(dom.nextButton, event.closeLabel || "继续");
            state.nextButtonMode = event.closeMode || "close";
        }

        setHidden(dom.feedbackOverlay, false);
    }

    function renderClues(clues) {
        dom.tagsContainer.innerHTML = "";
        clues.forEach((clue) => {
            const chip = document.createElement("div");
            if (!clue.revealed) {
                chip.className = "tag tag--hidden";
                chip.innerHTML = "<span>❓</span><span>隐藏信息</span>";
                chip.title = clue.detail || "";
            } else {
                chip.className = `tag tag--${clue.tone || "neutral"}`;
                chip.innerHTML = `<span class="tag-icon">${getClueIcon(clue.tone)}</span><span>${escapeHtml(clue.text)}</span>`;
                chip.title = clue.detail || "";
            }

            dom.tagsContainer.appendChild(chip);
        });
    }

    function getClueIcon(tone) {
        if (tone === "risk") {
            return "⚠️";
        }

        if (tone === "warning") {
            return "☣️";
        }

        if (tone === "safe") {
            return "🛡️";
        }

        if (tone === "constraint") {
            return "🚫";
        }

        if (tone === "caution") {
            return "🟠";
        }

        if (tone === "hidden") {
            return "❓";
        }

        return "⏺";
    }

    function syncChatOptions(chatState) {
        setText(dom.chatButtonLabel, chatState.label || "试探 / 聊天");
        setText(dom.chatButtonNote, chatState.available ? `还剩 ${chatState.remaining} 次` : "聊不动了");
        dom.chatButton.disabled = state.busy || !chatState.available;

        dom.chatOptionButtons.forEach((button) => {
            const option = chatState.options.find((item) => item.id === button.dataset.questionType);
            if (!option) {
                return;
            }

            button.disabled = state.busy || option.disabled;
            button.innerHTML = `<strong>${option.label}</strong><span>${option.reason || option.prompt}</span>`;
        });

        if (!chatState.available) {
            setHidden(dom.chatPanel, true);
        }
    }

    function syncActionLocks(actionLocks) {
        dom.actionButtons.forEach((button) => {
            const actionType = button.dataset.action;
            const actionState = actionLocks[actionType];
            const lock = button.querySelector(".action-lock");
            if (!actionState || !actionState.disabled) {
                button.disabled = state.busy;
                button.classList.remove("is-disabled");
                if (lock) {
                    lock.remove();
                }
                return;
            }

            button.disabled = true;
            button.classList.add("is-disabled");
            if (lock) {
                lock.textContent = "对方拒绝";
            } else {
                const overlay = document.createElement("span");
                overlay.className = "action-lock";
                overlay.textContent = "对方拒绝";
                button.appendChild(overlay);
            }
            button.title = actionState.reason || "";
        });
    }

    function renderUiState(uiState) {
        state.uiState = uiState;
        updateModeChip(uiState.mode || "male");
        setWidth(dom.frustrationBar, `${uiState.stats.frustration}%`);
        setText(dom.frustrationValue, `${uiState.stats.frustration}%`);
        setWidth(dom.anxietyBar, `${uiState.stats.anxiety}%`);
        setText(dom.anxietyValue, `${uiState.stats.anxiety}%`);
        setText(dom.turnCount, String(uiState.stats.turn).padStart(2, "0"));
        setText(dom.testkitCount, `x${uiState.stats.testkit}`);
        dom.testkitCount.classList.toggle("is-empty", uiState.stats.testkit === 0);
        setHidden(dom.panicWarning, !uiState.stats.panicMode);
        dom.gameContent.classList.toggle("panic-mode", uiState.stats.panicMode);

        const partner = uiState.partner;
        if (!partner) {
            return;
        }

        setText(dom.avatarEmoji, partner.avatar);
        setText(dom.sceneLabel, `场景：${partner.sceneLabel}`);
        setText(dom.flirtText, `“${partner.opener}”`);
        setHidden(dom.partnerStatus, !partner.flagged);
        renderClues(partner.clues);
        syncChatOptions(partner.chat);
        syncActionLocks(partner.actionLocks);

        dom.testkitButton.disabled = state.busy || uiState.stats.testkit <= 0 || uiState.gameOver;
        dom.hospitalButton.disabled = state.busy || uiState.gameOver;
    }

    function syncPostBusyControls() {
        if (!state.uiState?.partner) {
            return;
        }

        syncChatOptions(state.uiState.partner.chat);
        syncActionLocks(state.uiState.partner.actionLocks);
        dom.testkitButton.disabled = state.busy || state.uiState.stats.testkit <= 0 || state.uiState.gameOver;
        dom.hospitalButton.disabled = state.busy || state.uiState.gameOver;
    }

    async function withBusy(task) {
        if (state.busy) {
            return;
        }

        setBusy(true);

        try {
            await task();
        } catch (error) {
            showFatalEdgeError(error);
        } finally {
            setBusy(false);
            syncPostBusyControls();
        }
    }

    async function startGame(mode = "male") {
        if (!state.workerReady) {
            return;
        }

        await withBusy(async () => {
            const payload = await apiPost("/game/start", {
                tutorialStage: state.tutorialStage,
                mode
            });
            const addedUnlocks = mergeCasebookUnlocks(payload.casebookUnlocks);

            state.sessionToken = payload.sessionToken;
            saveTutorialStage(payload.nextTutorialStage);
            renderUiState(payload.uiState);
            updateModeChip(mode);
            setHidden(dom.introModal, true);
            setHidden(dom.gameContainer, false);
            setHidden(dom.helpModal, true);
            setHidden(dom.casebookModal, true);
            setHidden(dom.chatPanel, true);

            if (payload.introEvent) {
                showEvent(payload.introEvent, payload.uiState, addedUnlocks);
            }
        });
    }

    async function askQuestion(questionType) {
        if (!state.sessionToken) {
            return;
        }

        await withBusy(async () => {
            const payload = await apiPost("/game/chat", {
                sessionToken: state.sessionToken,
                questionType
            });
            const addedUnlocks = mergeCasebookUnlocks(payload.casebookUnlocks);

            state.sessionToken = payload.sessionToken;
            renderUiState(payload.uiState);
            setHidden(dom.chatPanel, true);
            showEvent(payload.event, payload.uiState, addedUnlocks);
        });
    }

    async function performAction(actionType) {
        if (!state.sessionToken) {
            return;
        }

        await withBusy(async () => {
            const payload = await apiPost("/game/action", {
                sessionToken: state.sessionToken,
                actionType
            });
            const addedUnlocks = mergeCasebookUnlocks(payload.casebookUnlocks);

            state.sessionToken = payload.sessionToken;
            renderUiState(payload.uiState);
            setHidden(dom.chatPanel, true);
            showEvent(payload.event, payload.uiState, addedUnlocks);
        });
    }

    function returnToIntro() {
        state.sessionToken = null;
        state.uiState = null;
        setHidden(dom.feedbackOverlay, true);
        setHidden(dom.helpModal, true);
        setHidden(dom.casebookModal, true);
        setHidden(dom.gameContainer, true);
        setHidden(dom.chatPanel, true);
        setHidden(dom.introModal, false);
        updateModeChip(state.currentMode);
        renderCasebook();
    }

    function showFatalEdgeError(error) {
        console.error(error);
        updateBuildStatus("服务器异常", "服务器刚才断了一下，这局没法继续。", false);
        resetFeedbackState();
        showEvent(
            {
                title: "服务器中断",
                icon: "⚠️",
                tone: "danger",
                lines: [
                    { tone: "danger", text: "这次请求没被服务器接住，当前进度断掉了。" },
                    { tone: "muted", text: "返回首页后可以再开一局。" }
                ],
                closeMode: "restart",
                closeLabel: "返回首页"
            },
            {
                history: state.uiState?.history || [],
                summary: state.uiState?.summary || null
            },
            []
        );
    }

    bindEvents();
    renderCasebook();
    updateModeChip(state.currentMode);
    await loadRuntimeConfig();
})();
