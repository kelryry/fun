(async () => {
    const DEFAULT_DATA = {
        STORAGE_KEYS: {
            tutorialStage: "month-pass-tutorial-stage-v2",
            casebook: "month-pass-casebook-v2"
        },
        COPY_URL: "/content/game-copy.json",
        CASEBOOK_SECTION_IDS: ["personas", "lieTypes", "endings", "diseases", "titles"]
    };

    const runtimeData = window.GAME_DATA || {};
    const data = {
        ...DEFAULT_DATA,
        ...runtimeData,
        STORAGE_KEYS: {
            ...DEFAULT_DATA.STORAGE_KEYS,
            ...(runtimeData.STORAGE_KEYS || {})
        },
        CASEBOOK_SECTION_IDS: Array.isArray(runtimeData.CASEBOOK_SECTION_IDS) && runtimeData.CASEBOOK_SECTION_IDS.length > 0
            ? runtimeData.CASEBOOK_SECTION_IDS
            : DEFAULT_DATA.CASEBOOK_SECTION_IDS
    };

    const state = {
        copy: null,
        runtime: null,
        sessionToken: null,
        uiState: null,
        busy: false,
        workerReady: false,
        currentMode: "male",
        casebook: loadCasebook(),
        tutorialStage: loadTutorialStage()
    };

    const dom = {
        body: document.body,
        titleNode: document.querySelector("title"),
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
        frustrationLabel: document.getElementById("frustration-label"),
        anxietyLabel: document.getElementById("anxiety-label"),
        panicWarning: document.getElementById("panic-warning"),
        turnLabel: document.getElementById("turn-label"),
        turnCount: document.getElementById("turn-count"),
        testkitLabel: document.getElementById("testkit-label"),
        testkitCount: document.getElementById("item-testkit"),
        hospitalLabel: document.getElementById("hospital-label"),
        hospitalNote: document.getElementById("hospital-note"),
        modeChip: document.getElementById("mode-chip"),
        avatarEmoji: document.getElementById("avatar-emoji"),
        partnerStatus: document.getElementById("partner-status"),
        sceneLabel: document.getElementById("scene-label"),
        flirtText: document.getElementById("flirt-text"),
        clueTitle: document.getElementById("clue-title"),
        tagsContainer: document.getElementById("tags-container"),
        chatButton: document.getElementById("btn-chat"),
        chatButtonLabel: document.getElementById("chat-button-label"),
        chatButtonNote: document.getElementById("chat-button-note"),
        chatPanel: document.getElementById("chat-panel"),
        chatPanelHint: document.getElementById("chat-panel-hint"),
        chatOptionButtons: Array.from(document.querySelectorAll("[data-question-type]")),
        feedbackIcon: document.getElementById("feedback-icon"),
        feedbackTitle: document.getElementById("feedback-title"),
        feedbackMessage: document.getElementById("feedback-message"),
        diseaseReport: document.getElementById("disease-report"),
        diseaseContent: document.getElementById("disease-content"),
        criticalReason: document.getElementById("critical-reason"),
        unlockCard: document.getElementById("unlock-card"),
        historyContainer: document.getElementById("history-container"),
        historyTitle: document.getElementById("history-title"),
        historyToggleMeta: document.getElementById("history-toggle-meta"),
        historyList: document.getElementById("history-list"),
        nextButton: document.getElementById("next-btn"),
        restartButton: document.getElementById("restart-btn"),
        runtimeChip: document.getElementById("runtime-chip"),
        runtimeNote: document.getElementById("runtime-note"),
        introTitle: document.getElementById("intro-title"),
        introKicker: document.getElementById("intro-kicker"),
        introLines: document.getElementById("intro-lines"),
        startButtons: Array.from(document.querySelectorAll("[data-mode]")),
        helpOpenButtons: Array.from(document.querySelectorAll("[data-open-help]")),
        helpCloseButtons: document.querySelectorAll("[data-close-help]"),
        helpTitle: document.getElementById("help-title"),
        helpSections: document.getElementById("help-sections"),
        casebookOpenButtons: Array.from(document.querySelectorAll("[data-open-casebook]")),
        casebookCloseButtons: document.querySelectorAll("[data-close-casebook]"),
        casebookTitle: document.getElementById("casebook-title"),
        casebookSummary: document.getElementById("casebook-summary"),
        casebookSectionBlocks: Array.from(document.querySelectorAll("[data-casebook-section]")),
        casebookLists: Object.fromEntries(
            data.CASEBOOK_SECTION_IDS.map((sectionId) => [
                sectionId,
                document.getElementById(`casebook-${sectionId}`)
            ])
        ),
        hospitalButton: document.getElementById("go-hospital-btn"),
        testkitButton: document.getElementById("use-testkit-btn"),
        actionButtons: Array.from(document.querySelectorAll("[data-action]")),
        actionTextNodes: {
            oral_condom: {
                title: document.getElementById("action-oral-condom-title"),
                note: document.getElementById("action-oral-condom-note")
            },
            sex_condom: {
                title: document.getElementById("action-sex-condom-title"),
                note: document.getElementById("action-sex-condom-note")
            },
            oral_raw: {
                title: document.getElementById("action-oral-raw-title"),
                note: document.getElementById("action-oral-raw-note")
            },
            sex_raw: {
                title: document.getElementById("action-sex-raw-title"),
                note: document.getElementById("action-sex-raw-note")
            },
            refuse: {
                title: document.getElementById("action-refuse-title"),
                note: document.getElementById("action-refuse-note")
            }
        }
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

    function formatText(template, vars = {}) {
        return String(template || "").replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
    }

    function getCopy() {
        return state.copy;
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

    async function loadCopy() {
        const response = await fetch(data.COPY_URL, {
            headers: { Accept: "application/json" },
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Copy request failed: ${response.status}`);
        }

        state.copy = await response.json();
    }

    function getModeLabel(mode) {
        const copy = getCopy();
        return copy.shell.battle.modeLabel[mode] || copy.shell.battle.modeLabel.male;
    }

    function renderHelp() {
        const copy = getCopy();
        dom.helpSections.innerHTML = "";

        copy.shell.help.sections.forEach((section) => {
            const block = document.createElement("section");
            block.className = "help-section";

            const title = document.createElement("h3");
            title.className = "help-section__title";
            title.textContent = section.title;
            block.appendChild(title);

            section.lines.forEach((line) => {
                const paragraph = document.createElement("p");
                paragraph.className = "help-section__line";
                paragraph.textContent = line;
                block.appendChild(paragraph);
            });

            dom.helpSections.appendChild(block);
        });
    }

    function renderStaticCopy() {
        const copy = getCopy();

        setText(dom.titleNode, copy.shell.pageTitle);
        document.title = copy.shell.pageTitle;
        setText(dom.introTitle, copy.shell.intro.title);
        setText(dom.introKicker, copy.shell.intro.kicker);
        setText(dom.helpTitle, copy.shell.help.title);
        setText(dom.casebookTitle, copy.shell.casebook.title);
        setText(dom.turnLabel, copy.shell.battle.turn);
        setText(dom.frustrationLabel, copy.shell.battle.frustration);
        setText(dom.anxietyLabel, copy.shell.battle.anxiety);
        setText(dom.panicWarning, copy.shell.battle.panic);
        setText(dom.clueTitle, copy.shell.battle.cluesTitle);
        setText(dom.testkitLabel, copy.shell.battle.testkit);
        setText(dom.hospitalLabel, copy.shell.battle.hospital);
        setText(dom.hospitalNote, copy.shell.battle.hospitalNote);
        setText(dom.chatPanelHint, copy.shell.battle.chatPanelHint);
        setText(dom.historyTitle, copy.shell.feedback.historyTitle);
        setText(dom.historyToggleMeta, copy.shell.feedback.historyToggle);
        setText(dom.nextButton, copy.shell.feedback.next);
        setText(dom.restartButton, copy.shell.feedback.restart);

        dom.introLines.innerHTML = "";
        copy.shell.intro.lines.forEach((line) => {
            const paragraph = document.createElement("p");
            paragraph.className = "intro-line";
            paragraph.textContent = line;
            dom.introLines.appendChild(paragraph);
        });

        dom.startButtons.forEach((button) => {
            const mode = button.dataset.mode || "male";
            button.textContent = copy.shell.intro.modeButtons[mode] || mode;
        });

        dom.helpOpenButtons.forEach((button) => {
            if (button.id === "open-help-btn") {
                button.textContent = copy.shell.intro.helpButton;
            }
        });

        setText(dom.casebookOpenButtons.find((button) => button.id === "open-casebook-help-btn"), copy.shell.help.openCasebook);
        setText(dom.casebookOpenButtons.find((button) => button.id === "open-casebook-feedback-btn"), copy.shell.feedback.openCasebook);
        setText(dom.helpCloseButtons[0], copy.shell.help.close);
        setText(dom.helpCloseButtons[1], copy.shell.help.close);
        setText(dom.casebookCloseButtons[0], copy.shell.casebook.close);
        setText(dom.casebookCloseButtons[1], copy.shell.casebook.close);

        Object.entries(copy.ui.actions).forEach(([actionId, actionCopy]) => {
            const nodes = dom.actionTextNodes[actionId];
            if (!nodes) {
                return;
            }

            setText(nodes.title, actionCopy.title);
            setText(nodes.note, actionCopy.note);
        });

        dom.chatOptionButtons.forEach((button) => {
            const questionType = button.dataset.questionType;
            const optionCopy = copy.ui.chat[questionType];
            button.innerHTML = `<strong>${escapeHtml(optionCopy.label)}</strong><span>${escapeHtml(optionCopy.prompt)}</span>`;
        });

        dom.casebookSectionBlocks.forEach((section) => {
            const id = section.dataset.casebookSection;
            const title = section.querySelector(".casebook-section__title");
            setText(title, copy.shell.casebook.sections[id]);
        });

        renderHelp();
        renderCasebook();
        syncRuntimeStatus("checking", false);
        updateModeChip(state.currentMode);
    }

    function updateModeChip(mode) {
        state.currentMode = mode;
        setText(dom.modeChip, getModeLabel(mode));
    }

    function syncRuntimeStatus(stateKey, ready) {
        const runtimeCopy = getCopy().shell.intro.runtime[stateKey];
        setText(dom.runtimeChip, runtimeCopy.chip);
        setText(dom.runtimeNote, runtimeCopy.note);
        dom.startButtons.forEach((button) => {
            button.disabled = !ready;
        });
        state.workerReady = ready;
    }

    async function loadRuntimeConfig() {
        const apiBase = dom.body.dataset.apiBase || "/api";
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 1800);

        syncRuntimeStatus("checking", false);

        try {
            const response = await fetch(`${apiBase}/bootstrap`, {
                headers: { Accept: "application/json" },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Bootstrap request failed: ${response.status}`);
            }

            state.runtime = await response.json();
            syncRuntimeStatus(state.runtime.features?.aiPolish ? "onlineAi" : "online", true);
        } catch (error) {
            console.warn("Bootstrap failed.", error);
            state.runtime = null;
            syncRuntimeStatus("offline", false);
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
        const gameOver = Boolean(state.uiState?.gameOver);
        dom.chatButton.disabled = isBusy || !state.uiState?.partner?.chat?.available || gameOver;
        dom.testkitButton.disabled = isBusy || !state.uiState || gameOver;
        dom.hospitalButton.disabled = isBusy || !state.uiState || gameOver;
        dom.chatOptionButtons.forEach((button) => {
            button.disabled = isBusy || button.disabled;
        });
        dom.actionButtons.forEach((button) => {
            if (isBusy) {
                button.disabled = true;
            }
        });
    }

    function bindEvents() {
        dom.startButtons.forEach((button) => {
            button.addEventListener("click", () => startGame(button.dataset.mode || "male"));
        });

        dom.helpOpenButtons.forEach((button) => {
            button.addEventListener("click", () => toggleHelp(true));
        });

        dom.helpModal.addEventListener("click", (event) => {
            if (event.target === dom.helpModal) {
                toggleHelp(false);
            }
        });

        dom.casebookModal.addEventListener("click", (event) => {
            if (event.target === dom.casebookModal) {
                toggleCasebook(false);
            }
        });

        dom.helpCloseButtons.forEach((button) => {
            button.addEventListener("click", () => toggleHelp(false));
        });

        dom.casebookCloseButtons.forEach((button) => {
            button.addEventListener("click", () => toggleCasebook(false));
        });

        dom.casebookOpenButtons.forEach((button) => {
            button.addEventListener("click", () => toggleCasebook(true));
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
        setHidden(dom.casebookOpenButtons.find((button) => button.id === "open-casebook-feedback-btn"), true);
        setText(dom.nextButton, getCopy().shell.feedback.next);
        if (dom.historyContainer) {
            dom.historyContainer.open = true;
        }
    }

    function renderCasebook() {
        const copy = getCopy();
        const totals = Object.fromEntries(
            Object.keys(state.casebook).map((key) => [key, Object.keys(state.casebook[key] || {}).length])
        );

        dom.casebookSummary.innerHTML = "";
        data.CASEBOOK_SECTION_IDS.forEach((sectionId) => {
            const line = document.createElement("p");
            line.textContent = `${copy.shell.casebook.summary[sectionId]} ${totals[sectionId]}`;
            dom.casebookSummary.appendChild(line);
        });

        data.CASEBOOK_SECTION_IDS.forEach((sectionId) => {
            const container = dom.casebookLists[sectionId];
            container.innerHTML = "";
            const entries = Object.values(state.casebook[sectionId] || {});

            if (entries.length === 0) {
                const empty = document.createElement("span");
                empty.className = "casebook-empty";
                empty.textContent = copy.shell.casebook.empty;
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

        const feedbackCopy = getCopy().shell.feedback;
        const panel = document.createElement("div");
        panel.className = "summary-stats";
        panel.innerHTML = `
            <h4 class="summary-stats__title">${escapeHtml(feedbackCopy.summaryTitle)}</h4>
            <div class="summary-stats__grid">
                <div class="summary-stats__row"><span>${escapeHtml(feedbackCopy.summaryRows.enjoy)}</span><strong>${summary.enjoyCount}</strong></div>
                <div class="summary-stats__row"><span>${escapeHtml(feedbackCopy.summaryRows.leave)}</span><strong>${summary.leaveCount}</strong></div>
                <div class="summary-stats__row"><span>${escapeHtml(feedbackCopy.summaryRows.escape)}</span><strong>${summary.escapeCount}</strong></div>
                <div class="summary-stats__row"><span>${escapeHtml(feedbackCopy.summaryRows.miss)}</span><strong>${summary.missCount}</strong></div>
                <div class="summary-stats__row summary-stats__row--danger"><span>${escapeHtml(feedbackCopy.summaryRows.infected)}</span><strong>${summary.infectedCount}</strong></div>
            </div>
            <div class="summary-stats__footer">
                <span>${escapeHtml(feedbackCopy.summaryTurns)}</span>
                <strong>${summary.turnsSurvived}</strong>
            </div>
        `;
        container.appendChild(panel);
    }

    function renderUnlocks(unlockLabels) {
        const copy = getCopy();
        dom.unlockCard.innerHTML = "";
        if (unlockLabels.length === 0) {
            setHidden(dom.unlockCard, true);
            return;
        }

        const title = document.createElement("strong");
        title.className = "unlock-card__title";
        title.textContent = copy.shell.casebook.unlock;
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
        const feedbackCopy = getCopy().shell.feedback;
        dom.historyList.innerHTML = "";

        history.forEach((item) => {
            const entry = document.createElement("div");
            const cluesMarkup = item.clues
                .map((clue) => `<span class="history-tag">${escapeHtml(clue)}</span>`)
                .join("");
            const diseaseMarkup = item.diseases.length > 0
                ? `<span class="history-disease">${escapeHtml(feedbackCopy.carrier)}: ${item.diseases.map((name) => escapeHtml(name)).join("，")}</span>`
                : `<span class="history-safe">${escapeHtml(feedbackCopy.healthy)}</span>`;

            entry.className = "history-entry";
            entry.innerHTML = `
                <div class="history-avatar">
                    <span>${escapeHtml(item.avatar)}</span>
                    ${item.diseases.length > 0 ? "<span class=\"history-status\">🦠</span>" : ""}
                </div>
                <div class="history-copy">
                    <div class="history-scene">${escapeHtml(item.sceneLabel)}</div>
                    <div class="history-tags">${cluesMarkup}</div>
                    <div class="history-subline">${diseaseMarkup}</div>
                    ${item.reason ? `<div class="history-subline history-subline--reason">${escapeHtml(item.reason)}</div>` : ""}
                </div>
                <div class="history-outcome history-outcome--${escapeHtml(item.outcomeTone)}">
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
            const feedbackCopy = getCopy().shell.feedback;
            dom.diseaseContent.innerHTML = `<p><b>${escapeHtml(feedbackCopy.diseaseName)}：</b>${escapeHtml(event.disease.name)}</p><p><b>${escapeHtml(feedbackCopy.diseaseRoute)}：</b>${escapeHtml(event.disease.transmission)}</p>`;
            setHidden(dom.diseaseReport, false);
        }

        if (event.criticalReason) {
            setText(dom.criticalReason, event.criticalReason);
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
            setHidden(dom.casebookOpenButtons.find((button) => button.id === "open-casebook-feedback-btn"), false);
        } else {
            setText(dom.nextButton, event.closeLabel || getCopy().shell.feedback.next);
        }

        setHidden(dom.feedbackOverlay, false);
    }

    function renderClues(clues) {
        const battleCopy = getCopy().shell.battle;
        dom.tagsContainer.innerHTML = "";
        clues.forEach((clue) => {
            const chip = document.createElement("div");
            if (!clue.revealed) {
                chip.className = "tag tag--hidden";
                chip.innerHTML = `<span>❓</span><span>${escapeHtml(battleCopy.hiddenClue)}</span>`;
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
        const battleCopy = getCopy().shell.battle;
        setText(dom.chatButtonLabel, battleCopy.chat);
        setText(
            dom.chatButtonNote,
            chatState.available
                ? formatText(battleCopy.chatRemaining, { count: chatState.remaining })
                : battleCopy.chatExhausted
        );
        dom.chatButton.disabled = state.busy || !chatState.available;

        dom.chatOptionButtons.forEach((button) => {
            const option = chatState.options.find((item) => item.id === button.dataset.questionType);
            if (!option) {
                return;
            }

            button.disabled = state.busy || option.disabled;
            button.innerHTML = `<strong>${escapeHtml(option.label)}</strong><span>${escapeHtml(option.reason || option.prompt)}</span>`;
        });

        if (!chatState.available) {
            setHidden(dom.chatPanel, true);
        }
    }

    function syncActionLocks(actionLocks) {
        const lockedText = getCopy().shell.battle.locked;
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
                button.title = "";
                return;
            }

            button.disabled = true;
            button.classList.add("is-disabled");
            if (lock) {
                lock.textContent = lockedText;
            } else {
                const overlay = document.createElement("span");
                overlay.className = "action-lock";
                overlay.textContent = lockedText;
                button.appendChild(overlay);
            }
            button.title = actionState.reason || "";
        });
    }

    function renderUiState(uiState) {
        const battleCopy = getCopy().shell.battle;
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
        setText(dom.sceneLabel, `${battleCopy.scenePrefix} · ${partner.sceneLabel}`);
        setText(dom.flirtText, partner.opener);
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
        renderCasebook();
        updateModeChip(state.currentMode);
    }

    function showFatalEdgeError(error) {
        console.error(error);
        syncRuntimeStatus("error", false);
        resetFeedbackState();
        const runtimeCopy = getCopy().shell.intro.runtime;
        showEvent(
            {
                title: runtimeCopy.fatalTitle,
                icon: "⚠️",
                tone: "danger",
                lines: runtimeCopy.fatalLines.map((line, index) => ({
                    tone: index === 0 ? "danger" : "muted",
                    text: line
                })),
                closeMode: "restart",
                closeLabel: getCopy().shell.feedback.restart
            },
            {
                history: state.uiState?.history || [],
                summary: state.uiState?.summary || null,
                gameOver: true
            },
            []
        );
    }

    try {
        await loadCopy();
        renderStaticCopy();
        bindEvents();
        await loadRuntimeConfig();
    } catch (error) {
        console.error(error);
        document.body.textContent = "Failed to load game copy.";
    }
})();
