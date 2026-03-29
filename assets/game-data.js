window.GAME_DATA = {
    MODE: "male",
    STORAGE_KEYS: {
        tutorialStage: "month-pass-tutorial-stage-v2",
        casebook: "month-pass-casebook-v2"
    },
    CHAT_TYPES: [
        {
            id: "smalltalk",
            label: "套话",
            prompt: "聊生活细节，容易漏出场景和近况。"
        },
        {
            id: "probe",
            label: "追问",
            prompt: "问检测和时间线，容易炸出矛盾。"
        },
        {
            id: "boundary",
            label: "压边界",
            prompt: "试探套、口、插入底线和安全态度。"
        }
    ],
    CASEBOOK_SECTIONS: [
        { id: "personas", title: "已见人格" },
        { id: "lieTypes", title: "已见话术" },
        { id: "endings", title: "已达成结局" },
        { id: "diseases", title: "已确认病原" },
        { id: "titles", title: "已得称号" }
    ]
};
