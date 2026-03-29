const JSON_HEADERS = {
    "content-type": "application/json; charset=UTF-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
};

const SESSION_VERSION = 3;
const DEFAULT_MODE_ID = "male";
const SUPPORTED_MODES = ["male", "female"];
const AI_MODEL = "@cf/zai-org/glm-4.7-flash";
const AI_TIMEOUT_MS = 1800;
const MAX_CHAT_PER_PARTNER = 2;
const CHAT_ORDER = ["smalltalk", "probe", "boundary"];
const CHAT_DEFS = {
    smalltalk: {
        label: "套话",
        shortLabel: "套话",
        prompt: "聊生活细节，容易漏出场景和近况。",
        frustrationCost: 2,
        anxietyGain: 0
    },
    probe: {
        label: "追问",
        shortLabel: "追问",
        prompt: "问检测和时间线，容易炸出矛盾。",
        frustrationCost: 3,
        anxietyGain: 1
    },
    boundary: {
        label: "压边界",
        shortLabel: "压边界",
        prompt: "试探套、口、插入底线和安全态度。",
        frustrationCost: 3,
        anxietyGain: 2
    }
};

const ACTION_DEFS = {
    refuse: {
        label: "换一个",
        urgeDelta: 8,
        anxietyDelta: 0
    },
    oral_condom: {
        label: "戴套口交",
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
        label: "戴套性交",
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
        label: "无套口交",
        reward: 16,
        anxietyDelta: 14,
        risk: {
            fluid: 0.18,
            contact: 0.22,
            skin: 0.18,
            fluid_mucous: 0.22,
            skin_hair: 0.18
        }
    },
    sex_raw: {
        label: "无套性交",
        reward: 24,
        anxietyDelta: 28,
        risk: {
            fluid: 0.58,
            contact: 0.48,
            skin: 0.36,
            fluid_mucous: 0.5,
            skin_hair: 0.32
        }
    },
    use_testkit: {
        label: "检测对方"
    },
    hospital: {
        label: "去医院检查",
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
        name: "艾滋病 (HIV)",
        transmission: "体液传播",
        riskType: "fluid"
    },
    SYPHILIS: {
        key: "SYPHILIS",
        name: "梅毒",
        transmission: "接触传播",
        riskType: "contact"
    },
    HERPES: {
        key: "HERPES",
        name: "疱疹",
        transmission: "皮肤接触",
        riskType: "skin"
    },
    HPV: {
        key: "HPV",
        name: "尖锐湿疣",
        transmission: "接触传播",
        riskType: "contact"
    },
    GONORRHEA: {
        key: "GONORRHEA",
        name: "淋病",
        transmission: "体液粘膜",
        riskType: "fluid_mucous"
    },
    CRABS: {
        key: "CRABS",
        name: "阴虱",
        transmission: "密切接触",
        riskType: "skin_hair"
    }
};

const CASEBOOK = {
    personas: {
        cautious_rookie: "老实谨慎",
        slick_liar: "油滑老手",
        hard_deny: "嘴硬高危",
        fake_sweet: "假装纯情",
        edge_pusher: "急色压线",
        shy_clean: "社恐但安全"
    },
    lieTypes: {
        honest: "真诚直说",
        deflect: "回避打岔",
        half_truth: "半真半假",
        hard_deny: "死不承认",
        charm_push: "调情施压"
    },
    endings: {
        survive: "幸存者",
        bad_win: "糟糕的胜利",
        burnout: "欲火焚身",
        breakdown: "精神崩溃",
        confirmed_infection: "确诊感染"
    },
    titles: {
        cold_hunter: "冷静猎手",
        contradiction_sniffer: "嘴硬鉴定师",
        raw_gambler: "赌命上头王",
        close_call: "死里逃生专业户",
        bad_luck_lover: "侥幸赌徒"
    }
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
        label: "老实谨慎",
        voice: "gentle",
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
        label: "油滑老手",
        voice: "slick",
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
        label: "嘴硬高危",
        voice: "hard",
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
        label: "假装纯情",
        voice: "sweet",
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
        label: "急色压线",
        voice: "thirsty",
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
        label: "社恐但安全",
        voice: "shy",
        lieType: "honest",
        honestyRange: [74, 92],
        safetyRange: [76, 94],
        pushinessRange: [6, 22],
        patienceRange: [2, 3],
        riskBias: -28,
        boundaryPool: ["oral_only", "no_oral", "condom_only"]
    }
];

const SCENES = [
    {
        id: "dorm",
        label: "男生宿舍",
        riskBias: 4,
        openerPool: [
            "门一关，他先压低声音说室友快回来了。",
            "宿舍灯很白，空气里带着一点洗衣液味。",
            "他把桌上的游戏手柄扫到一边，给你腾了个位置。"
        ],
        visibleRisk: [
            { text: "桌上还摊着上一位留下的奶茶杯", tone: "warning" },
            { text: "手机一直亮着，像在同时回别人消息", tone: "warning" }
        ],
        visibleSafe: [
            { text: "桌角整齐摆着没拆封的安全套", tone: "safe" },
            { text: "他一进门就先去洗手", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他说今晚已经跑了两间寝室，语气像赶场。", tone: "risk" },
            { text: "他顺嘴提到刚和上一个人分开没多久。", tone: "warning" }
        ],
        smalltalkSafe: [
            { text: "他说自己平时很少见网友，今晚是冲动失手。", tone: "safe" },
            { text: "他提起明早还有课，明显不想把局面搞太大。", tone: "safe" }
        ]
    },
    {
        id: "hotel",
        label: "快捷酒店",
        riskBias: 8,
        openerPool: [
            "房门一刷开，廉价香薰和空调冷气一起扑出来。",
            "酒店床单看着很新，但他显然比你更熟这条路线。",
            "他把房卡丢到桌上，像已经来过很多次。"
        ],
        visibleRisk: [
            { text: "床头放着拆了一半的阻断药盒", tone: "risk" },
            { text: "洗手台边有一次性牙刷被拆了两份", tone: "warning" }
        ],
        visibleSafe: [
            { text: "他主动把安全套放到你看得见的地方", tone: "safe" },
            { text: "垃圾桶里只有未拆封的洗漱用品包装", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他说这家店前台都认识他了。", tone: "risk" },
            { text: "他笑着说自己最讨厌留名字，像来这儿成习惯了。", tone: "warning" }
        ],
        smalltalkSafe: [
            { text: "他说是临时起意订的房，明显没有熟练到令人发毛。", tone: "safe" },
            { text: "他嫌房间太脏，先换了两遍一次性床单。", tone: "safe" }
        ]
    },
    {
        id: "club",
        label: "夜店散场后",
        riskBias: 14,
        openerPool: [
            "音乐刚停，他还带着酒气和汗味。",
            "你们站在夜店门口的灯牌下，他眼神已经很上头。",
            "耳边还在轰鸣，他说话都要凑很近。"
        ],
        visibleRisk: [
            { text: "他身上有一股刺鼻的化学甜味", tone: "risk" },
            { text: "手腕上还挂着陌生人的入场手环", tone: "warning" }
        ],
        visibleSafe: [
            { text: "他先问你清不清醒，再决定要不要继续。", tone: "safe" },
            { text: "他坚持先去买水和套，说别酒后犯蠢。", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他含糊提到今晚已经和别人贴过几轮了。", tone: "risk" },
            { text: "他对上一个人的名字毫无印象，只记得长相。", tone: "warning" }
        ],
        smalltalkSafe: [
            { text: "他说自己本来想直接回家，是你让他临时改主意。", tone: "safe" },
            { text: "他抱怨朋友把他一个人丢下，像并不常这么玩。", tone: "safe" }
        ]
    },
    {
        id: "street",
        label: "深夜街边",
        riskBias: 6,
        openerPool: [
            "夜风很凉，他把外套拉链拉到最上面。",
            "你们站在便利店门口，谁都没完全放松。",
            "路边车灯一晃一晃，他说再磨蹭天都亮了。"
        ],
        visibleRisk: [
            { text: "他坚持去公厕或公园，说快点解决就行", tone: "risk" },
            { text: "他说不开房，嫌留下痕迹麻烦", tone: "warning" }
        ],
        visibleSafe: [
            { text: "他先提议换个更干净更安全的地方", tone: "safe" },
            { text: "他明确说不想在街边乱来，太脏也太冒险", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他对今晚去过哪儿闪烁其词，像不想你拼出完整路线。", tone: "warning" },
            { text: "他说自己一向随缘，能约上谁算谁。", tone: "risk" }
        ],
        smalltalkSafe: [
            { text: "他说自己只是下班太晚，压根没规划今晚。", tone: "safe" },
            { text: "他反复看表，像还有点想撤。", tone: "safe" }
        ]
    },
    {
        id: "home",
        label: "对方家里",
        riskBias: 2,
        openerPool: [
            "门口鞋柜很整齐，屋里有一点淡淡沐浴露味。",
            "客厅灯开着，他完全没有刻意营造气氛。",
            "你一进门就看见桌上还有没收好的外卖盒。"
        ],
        visibleRisk: [
            { text: "茶几上还摆着两只没洗的酒杯", tone: "warning" },
            { text: "垃圾桶里露出刚拆封的阻断药说明书", tone: "risk" }
        ],
        visibleSafe: [
            { text: "洗手台摆着近期体检单和消毒用品", tone: "safe" },
            { text: "他先问你要不要洗澡、漱口，再继续聊", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他说这套房只是偶尔来住，像不太想让你知道真实生活。", tone: "warning" },
            { text: "他解释上一个人只是朋友，但说法前后很绕。", tone: "risk" }
        ],
        smalltalkSafe: [
            { text: "他说自己平时更宅，今天属于突然发疯。", tone: "safe" },
            { text: "他提到明早还要早起，明显不想折腾太久。", tone: "safe" }
        ]
    }
];

const FEMALE_SCENES = [
    {
        id: "home",
        label: "他家客厅",
        riskBias: 4,
        openerPool: [
            "他把门一关就凑近了，像屋里只剩你和他这点呼吸声。",
            "客厅收得挺干净，但他看你的眼神比屋子更有侵略性。",
            "他把外卖盒往旁边一推，像下一步就准备把你往沙发里按。"
        ],
        visibleRisk: [
            { text: "茶几上放着没丢的拆封套盒，像今晚不是第一局", tone: "warning" },
            { text: "洗手台上摆着拆过的阻断药说明书", tone: "risk" }
        ],
        visibleSafe: [
            { text: "他先问你要不要洗澡、漱口，再继续聊", tone: "safe" },
            { text: "他把套和湿巾直接放到你看得见的地方", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他说“你别多想”，可屋里像刚送走过别人。", tone: "risk" },
            { text: "他对上一个来过这里的人解释得太快，像早排练过。", tone: "warning" }
        ],
        smalltalkSafe: [
            { text: "他说自己平时不太带人回家，今晚更像一时上头。", tone: "safe" },
            { text: "他提到第二天一早还要上班，不像打算狠狠干一整夜。", tone: "safe" }
        ]
    },
    {
        id: "hotel",
        label: "酒店房间",
        riskBias: 10,
        openerPool: [
            "房门一关，他就顺手把链条也扣上了，熟练得有点吓人。",
            "酒店床单很白，他的眼神却一点都不干净。",
            "他把房卡往桌上一甩，像这一套流程已经跑熟了。"
        ],
        visibleRisk: [
            { text: "床头那包套已经拆了一个，像你不是今晚唯一被约来的人", tone: "risk" },
            { text: "浴室里丢着两副一次性拖鞋", tone: "warning" }
        ],
        visibleSafe: [
            { text: "他先问你底线，再问你想不想继续", tone: "safe" },
            { text: "他嫌酒店脏，先让你看了一眼全新的套和湿巾", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他说这家店前台都快认识他了，像拿开房当日常。", tone: "risk" },
            { text: "他对最近约过几个人说得很滑，像只想把你哄上床。", tone: "warning" }
        ],
        smalltalkSafe: [
            { text: "他说是临时起意开房，话里那点慌张不像假的。", tone: "safe" },
            { text: "他承认自己也有点紧张，怕你觉得他太急。", tone: "safe" }
        ]
    },
    {
        id: "club",
        label: "酒吧散场后",
        riskBias: 14,
        openerPool: [
            "他身上还带着酒气，话却已经往床上拐了。",
            "酒吧门口的灯打在他脸上，他看你的眼神像只剩下最直白的欲望。",
            "音乐刚停，他贴过来说话，像生怕你清醒下来。"
        ],
        visibleRisk: [
            { text: "他手腕上还挂着别人的手绳，像刚和人贴完没多久", tone: "risk" },
            { text: "他话里一直催你快点，像怕你想明白后反悔", tone: "warning" }
        ],
        visibleSafe: [
            { text: "他先问你清不清醒，再问你要不要继续", tone: "safe" },
            { text: "他坚持先去买水和套，说别拿身体赌酒劲", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他说今晚“就玩玩”，语气却像已经换过好几轮。", tone: "risk" },
            { text: "他连上一个贴过的人叫什么都记不清。", tone: "warning" }
        ],
        smalltalkSafe: [
            { text: "他说原本准备回家，是你让他临时改主意。", tone: "safe" },
            { text: "他抱怨朋友把他一个人丢下，像并不常这么疯。", tone: "safe" }
        ]
    },
    {
        id: "street",
        label: "深夜街边",
        riskBias: 6,
        openerPool: [
            "夜风很冷，他却只想把你往更偏的地方带。",
            "便利店灯牌一晃一晃，他说再磨蹭就没那股火了。",
            "他嘴上说尊重你，脚下却一直把你往死角领。"
        ],
        visibleRisk: [
            { text: "他不想开房，只想找个偏地方赶紧来一下", tone: "risk" },
            { text: "他一提留下记录就皱眉，像特别怕被谁知道", tone: "warning" }
        ],
        visibleSafe: [
            { text: "他先提议换个更安全更干净的地方", tone: "safe" },
            { text: "他说街边太脏也太险，不想拿你身体乱赌", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他对今晚去过哪儿闪烁其词，像不想让你拼出完整路线。", tone: "warning" },
            { text: "他说自己向来随缘，能拉到谁就算谁。", tone: "risk" }
        ],
        smalltalkSafe: [
            { text: "他说刚下班脑子发热才会站在这儿，自己都觉得离谱。", tone: "safe" },
            { text: "他看了几次时间，像还想给自己留退路。", tone: "safe" }
        ]
    },
    {
        id: "car",
        label: "车里",
        riskBias: 8,
        openerPool: [
            "车门一关，空间立刻变得只剩下体温和呼吸。",
            "他把空调调低，视线却一直往你腿上滑。",
            "狭小的车厢里，他每一句话都像在试你会不会松口。"
        ],
        visibleRisk: [
            { text: "中控台上丢着陌生发圈和拆过的湿巾", tone: "warning" },
            { text: "他嫌开房麻烦，像更爱把人哄进这种没退路的空间", tone: "risk" }
        ],
        visibleSafe: [
            { text: "他主动说车里不合适，真要继续也得换地方", tone: "safe" },
            { text: "他把套放进你手里，让你自己决定要不要继续", tone: "safe" }
        ],
        smalltalkRisk: [
            { text: "他说自己常这样兜风顺手约人，熟练得让人发毛。", tone: "risk" },
            { text: "他把过去几次约会讲得很轻，像把风险当夜生活的配菜。", tone: "warning" }
        ],
        smalltalkSafe: [
            { text: "他说今晚更像冲动开错了门，语气里有点心虚。", tone: "safe" },
            { text: "他承认自己嘴上厉害，真到临门一脚反而会踩刹车。", tone: "safe" }
        ]
    }
];

const SCENE_PACKS = {
    male: SCENES,
    female: FEMALE_SCENES
};

const BOUNDARY_PROFILES = {
    open_all: {
        id: "open_all",
        clue: null,
        disabledActions: []
    },
    condom_only: {
        id: "condom_only",
        clue: {
            text: "明确拒绝无套提议",
            tone: "constraint",
            detail: "【限制】只接受全程戴套。"
        },
        disabledActions: ["oral_raw", "sex_raw"]
    },
    no_condom: {
        id: "no_condom",
        clue: {
            text: "一提到套就开始皱眉",
            tone: "constraint",
            detail: "【限制】对戴套这件事很抗拒。"
        },
        disabledActions: ["oral_condom", "sex_condom"]
    },
    no_oral: {
        id: "no_oral",
        clue: {
            text: "嘴上有伤，拒绝口交",
            tone: "constraint",
            detail: "【限制】只接受非口部玩法。"
        },
        disabledActions: ["oral_condom", "oral_raw"]
    },
    oral_only: {
        id: "oral_only",
        clue: {
            text: "只敢做边缘试探，不肯真往深里走",
            tone: "constraint",
            detail: "【限制】只接受口或边缘玩法。"
        },
        disabledActions: ["sex_condom", "sex_raw"]
    }
};

const VOICES = {
    gentle: {
        openings: ["他很认真地想了一下才回答。", "他语速不快，像怕说错话。", "他先看了你一眼，才慢慢开口。"],
        deflects: ["我真没想糊弄你。", "你要是介意，我可以直接说不做。", "我不太会包装自己。"] ,
        closes: ["你想清楚再决定。", "别勉强自己。", "我能配合。"]
    },
    slick: {
        openings: ["他笑了一下，像早准备好说辞。", "他把问题接得很顺，几乎不带停顿。", "他靠近半步，先把气氛往轻松里带。"],
        deflects: ["都出来玩了，别查户口。", "真要这么严，你不如带我去医院。", "你别把夜生活问成审讯。"] ,
        closes: ["真怕的话就选最稳的。", "别把气氛问死。", "我可不想让今晚冷掉。"]
    },
    hard: {
        openings: ["他明显有点不耐烦。", "他先皱了皱眉，像被问烦了。", "他答得很冲，几乎不愿解释。"],
        deflects: ["爱信不信。", "你要不舒服就走。", "别老拿那些破问题试我。"] ,
        closes: ["能玩就玩，不能玩算了。", "我没空一直解释。", "别墨迹。"]
    },
    sweet: {
        openings: ["他先露出一个很无害的笑。", "他语气温温的，像在安抚你。", "他回答前会先轻声喊你一声。"],
        deflects: ["你别把我想得那么坏。", "我知道你怕，所以我才想哄你放心。", "我不是那种乱来的人。"] ,
        closes: ["你舒服最重要。", "不安心就慢一点。", "我会顺着你。"]
    },
    thirsty: {
        openings: ["他几乎等不及你把问题问完。", "他一边回你，一边还在往前压。", "他笑得很急，像只想尽快推进。"],
        deflects: ["你先别问这么细。", "爽完再聊行不行。", "你也不是来背体检手册的吧。"] ,
        closes: ["你选一个快点。", "别再吊着我。", "今晚我真不想空手回去。"]
    },
    shy: {
        openings: ["他耳尖有点红，说话很轻。", "他盯着别处回你，像不太擅长这种场面。", "他回答前先抿了下嘴。"],
        deflects: ["我不是在躲，只是有点紧张。", "你问得太直接了，我得想一下。", "我不太会说这些。"] ,
        closes: ["你要是觉得怪，我们可以停。", "我不急。", "你舒服就好。"]
    }
};

const TEST_HISTORY = {
    recent_clean: "上个月刚做过检测，还留着结果截图。",
    vague_safe: "说是前阵子测过，但日期记不清了。",
    unknown: "一问检测时间就开始含糊其辞。",
    recent_risk: "嘴上说最近没事，细问才发现这周换人很频繁。"
};

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
        predicate: (run, summary) => summary.endingId === "bad_win"
    }
];

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

function getRiskLabel(riskTier) {
    if (riskTier === "high") {
        return "高危";
    }

    if (riskTier === "uncertain") {
        return "可疑";
    }

    return "低危";
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
    const scriptsByMode = {
        male: [
            {
                id: "tutorial-red-flag",
                stage: 0,
                introLines: [
                    { tone: "warning", text: "教学 1/3：红旗都快贴到脸上了，走人就是赢。" },
                    { tone: "muted", text: "第一课先学会别让下半身把你拖去送命。" }
                ],
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
                opener: "他一贴上来就急着把你往更深的地方拱，像根本不打算给你冷静时间。",
                visibleClues: [
                    { text: "身上带着刺鼻的化学甜味", tone: "risk" },
                    { text: "一直催你别开灯、别问太多", tone: "warning" }
                ],
                questionBlueprints: {
                    smalltalk: {
                        replyMode: "risky",
                        clue: { text: "你一套话，他反而顺嘴说漏自己今晚已经换过两场。", tone: "risk" }
                    },
                    probe: {
                        replyMode: "hard_deny",
                        clue: { text: "你追问检测，他只会顶嘴，连上次检测时间都说不清。", tone: "warning", contradiction: true }
                    },
                    boundary: {
                        replyMode: "pressure",
                        clue: { text: "他不在乎你舒不舒服，只想尽快推进到最冒险那一步。", tone: "risk" }
                    }
                }
            },
            {
                id: "tutorial-fake-safe",
                stage: 1,
                introLines: [
                    { tone: "warning", text: "教学 2/3：看着干净，不代表说得圆。" },
                    { tone: "muted", text: "这局要学会用追问去掀他的漂亮话。" }
                ],
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
                opener: "他笑得很温柔，屋里也收拾得干净，第一眼几乎像个能放心脱衣服的人。",
                visibleClues: [
                    { text: "洗手台摆着整齐的清洁用品", tone: "safe" },
                    { text: "明确说无套不聊", tone: "constraint", detail: "【限制】只接受全程戴套。" }
                ],
                questionBlueprints: {
                    smalltalk: {
                        replyMode: "soft_safe",
                        clue: { text: "他把自己说得像很少出来，但细节里总像背稿。", tone: "warning" }
                    },
                    probe: {
                        replyMode: "half_truth",
                        clue: { text: "他说“上周刚测过”，但你一追医院和日期，他立刻开始打岔。", tone: "warning", contradiction: true }
                    },
                    boundary: {
                        replyMode: "boundary_safe",
                        clue: { text: "他嘴上说尊重边界，但总在暗暗试探你能不能更快更近。", tone: "caution" }
                    }
                }
            },
            {
                id: "tutorial-safe-boundary",
                stage: 2,
                introLines: [
                    { tone: "success", text: "教学 3/3：怪，不等于危险。" },
                    { tone: "muted", text: "这局要学会把“边界硬”跟“人很脏”拆开。" }
                ],
                personaId: "shy_clean",
                sceneId: "dorm",
                riskTier: "safe",
                diseaseIds: [],
                boundaryId: "oral_only",
                honesty: 88,
                safetyScore: 90,
                pushiness: 8,
                patience: 3,
                lieType: "honest",
                opener: "他看起来比你还紧张，像你再多靠近一点他都可能脸红到缩回去。",
                visibleClues: [
                    { text: "说话小声，生怕室友听见", tone: "neutral" },
                    { text: "只敢做边缘试探，不肯真往深里走", tone: "constraint", detail: "【限制】只接受口或边缘玩法。" }
                ],
                questionBlueprints: {
                    smalltalk: {
                        replyMode: "safe",
                        clue: { text: "他承认自己经验少，今晚更像是被你推着来的。", tone: "safe" }
                    },
                    probe: {
                        replyMode: "honest_safe",
                        clue: { text: "他能准确说出上次检测的时间和地点，没有躲闪。", tone: "safe" }
                    },
                    boundary: {
                        replyMode: "boundary_safe",
                        clue: { text: "他的底线很明确，但不是想骗你冒险，而是真的胆子小。", tone: "safe" }
                    }
                }
            }
        ],
        female: [
            {
                id: "tutorial-red-flag-female",
                stage: 0,
                introLines: [
                    { tone: "warning", text: "教学 1/3：他越急着把你往床上哄，越要先踩刹车。" },
                    { tone: "muted", text: "第一课先学会识别那种拿欲望压你松口的人。" }
                ],
                personaId: "edge_pusher",
                sceneId: "club",
                riskTier: "high",
                diseaseIds: ["SYPHILIS", "GONORRHEA"],
                boundaryId: "no_condom",
                honesty: 22,
                safetyScore: 18,
                pushiness: 90,
                patience: 1,
                lieType: "charm_push",
                opener: "他一靠近就把话往“别想了，跟我走”上带，像只想趁你脑子还热。",
                visibleClues: [
                    { text: "一直催你别磨蹭，像怕你稍微清醒就翻脸", tone: "risk" },
                    { text: "你一提安全感，他就笑着把话题往气氛上带", tone: "warning" }
                ],
                questionBlueprints: {
                    smalltalk: {
                        replyMode: "risky",
                        clue: { text: "你一套话，他顺嘴漏出今晚刚和别人散场。", tone: "risk" }
                    },
                    probe: {
                        replyMode: "charm_push",
                        clue: { text: "你追问检测记录，他只会笑着哄你别扫兴，日期一句都说不清。", tone: "warning", contradiction: true }
                    },
                    boundary: {
                        replyMode: "pressure",
                        clue: { text: "你一压边界，他立刻开始试探你能不能把套和底线一起往后挪。", tone: "risk" }
                    }
                }
            },
            {
                id: "tutorial-fake-safe-female",
                stage: 1,
                introLines: [
                    { tone: "warning", text: "教学 2/3：会给你安全感，不代表真安全。" },
                    { tone: "muted", text: "这局要学会从温柔和体面里抓说辞漏洞。" }
                ],
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
                opener: "他屋里很干净，说话也温柔，第一眼像那种会让人放下防备的男的。",
                visibleClues: [
                    { text: "套和湿巾摆得很显眼，像故意让你看见", tone: "safe" },
                    { text: "嘴上说无套不聊", tone: "constraint", detail: "【限制】只接受全程戴套。" }
                ],
                questionBlueprints: {
                    smalltalk: {
                        replyMode: "soft_safe",
                        clue: { text: "他把自己包装得很克制，可细节里总像背熟了台词。", tone: "warning" }
                    },
                    probe: {
                        replyMode: "half_truth",
                        clue: { text: "他说“前阵子刚测过”，但你一问日期和医院，他立刻开始绕。", tone: "warning", contradiction: true }
                    },
                    boundary: {
                        replyMode: "boundary_safe",
                        clue: { text: "他嘴上说尊重你，实际一直在试探你能不能更快脱防备。", tone: "caution" }
                    }
                }
            },
            {
                id: "tutorial-safe-boundary-female",
                stage: 2,
                introLines: [
                    { tone: "success", text: "教学 3/3：边界很硬，不代表他想坑你。" },
                    { tone: "muted", text: "这局要学会区分“他谨慎”跟“他有鬼”。" }
                ],
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
                opener: "他嘴上也有火，但一直踩着刹车，像怕自己一冲动就越线。",
                visibleClues: [
                    { text: "他主动把套塞到你手里，让你自己决定", tone: "safe" },
                    { text: "一提到底线，他先把安全放在前面", tone: "constraint", detail: "【限制】只接受全程戴套。" }
                ],
                questionBlueprints: {
                    smalltalk: {
                        replyMode: "safe",
                        clue: { text: "他承认自己也会上头，但更怕把事情搞脏。", tone: "safe" }
                    },
                    probe: {
                        replyMode: "honest_safe",
                        clue: { text: "他能清楚说出上次检测时间和结果，没有闪躲。", tone: "safe" }
                    },
                    boundary: {
                        replyMode: "boundary_safe",
                        clue: { text: "他的底线很明确，重点是怕你吃亏，不是怕自己扫兴。", tone: "safe" }
                    }
                }
            }
        ]
    };

    const scripts = scriptsByMode[mode] || scriptsByMode[DEFAULT_MODE_ID];
    return scripts[stage] || null;
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
        personaLabel: descriptor.persona.label,
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
        riskLabel: getRiskLabel(descriptor.riskTier),
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
        const mixedPool = descriptor.scene.visibleRisk.concat(descriptor.scene.visibleSafe);
        clues.push(clone(pick(run, mixedPool)));
    }

    if (descriptor.riskTier === "high") {
        clues.push(clone(pick(run, [
            { text: "你一进门就感觉他对风险这件事过于轻描淡写", tone: "warning" },
            { text: "他说话总在把问题往“别扫兴”上带", tone: "risk" },
            { text: "他看起来很会这套，熟练得让人不舒服", tone: "warning" }
        ])));
    } else if (descriptor.riskTier === "safe") {
        clues.push(clone(pick(run, [
            { text: "他先问你最近有没有做检测", tone: "safe" },
            { text: "他对清洁和套都比你更上心", tone: "safe" },
            { text: "他宁可慢一点，也不想乱来", tone: "safe" }
        ])));
    } else {
        clues.push(clone(pick(run, [
            { text: "第一眼挑不出大问题，但也没有完全放心的感觉", tone: "caution" },
            { text: "他的安全感有点像刻意做出来的", tone: "warning" },
            { text: "他看起来像会说漂亮话的人", tone: "caution" }
        ])));
    }

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
            const scripted = descriptor.tutorial.questionBlueprints[type];
            return [
                type,
                {
                    type,
                    replyMode: scripted.replyMode,
                    clue: {
                        id: type,
                        revealed: false,
                        tone: toToneClass(scripted.clue.tone),
                        text: scripted.clue.text,
                        detail: scripted.clue.detail || "",
                        contradiction: Boolean(scripted.clue.contradiction)
                    }
                }
            ];
        })
    );
}

function buildQuestionBlueprints(run, descriptor) {
    const probeClue = buildProbeClue(run, descriptor);
    const smalltalkClue = buildSmalltalkClue(run, descriptor);
    const boundaryClue = buildBoundaryClue(run, descriptor);

    return {
        smalltalk: {
            type: "smalltalk",
            replyMode: descriptor.riskTier === "safe" ? "safe" : descriptor.riskTier === "high" ? "risky" : "mixed",
            clue: smalltalkClue
        },
        probe: {
            type: "probe",
            replyMode: descriptor.lieType,
            clue: probeClue
        },
        boundary: {
            type: "boundary",
            replyMode: descriptor.boundary.id === "condom_only" || descriptor.safetyScore >= 70 ? "boundary_safe" : descriptor.pushiness >= 68 ? "pressure" : "mixed",
            clue: boundaryClue
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

function buildProbeClue(run, descriptor) {
    if (descriptor.lieType === "honest" && descriptor.riskTier === "safe") {
        return {
            id: "probe",
            revealed: false,
            tone: "safe",
            text: `他能直接说出：${TEST_HISTORY.recent_clean}`,
            detail: ""
        };
    }

    if (descriptor.lieType === "hard_deny") {
        return {
            id: "probe",
            revealed: false,
            tone: "warning",
            text: "你一追检测时间，他就开始炸毛，只剩情绪没有信息。",
            detail: "",
            contradiction: true
        };
    }

    if (descriptor.lieType === "half_truth") {
        return {
            id: "probe",
            revealed: false,
            tone: "warning",
            text: `他说“应该没事”，但越问越像：${TEST_HISTORY.vague_safe}`,
            detail: "",
            contradiction: true
        };
    }

    if (descriptor.riskTier === "high") {
        return {
            id: "probe",
            revealed: false,
            tone: "risk",
            text: `一聊到检测，他就露出破绽：${TEST_HISTORY.recent_risk}`,
            detail: "",
            contradiction: descriptor.lieType !== "honest"
        };
    }

    return {
        id: "probe",
        revealed: false,
        tone: "caution",
        text: `他给了你一个模糊答案，整体更接近：${TEST_HISTORY.unknown}`,
        detail: "",
        contradiction: descriptor.lieType !== "honest"
    };
}

function buildBoundaryClue(run, descriptor) {
    if (descriptor.boundary.id === "condom_only" || descriptor.safetyScore >= 74) {
        return {
            id: "boundary",
            revealed: false,
            tone: "safe",
            text: "一聊到底线，他先把“戴套”放在最前面，态度比你还坚决。",
            detail: ""
        };
    }

    if (descriptor.boundary.id === "no_condom" || descriptor.pushiness >= 78) {
        return {
            id: "boundary",
            revealed: false,
            tone: "risk",
            text: "你一压边界，他立刻开始把话题往“别扫兴”“就赌一把”上拐。",
            detail: ""
        };
    }

    if (descriptor.boundary.id === "oral_only" || descriptor.boundary.id === "no_oral") {
        return {
            id: "boundary",
            revealed: false,
            tone: "caution",
            text: "他的底线很具体，不像在装，而是真的有明确限制。",
            detail: ""
        };
    }

    return {
        id: "boundary",
        revealed: false,
        tone: "warning",
        text: "他嘴上说都行，但每当你提到防护细节，眼神都会飘一下。",
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

function buildReply(run, partner, questionType, mode) {
    const voice = VOICES[PERSONAS.find((item) => item.id === partner.personaId).voice];
    const opening = pick(run, voice.openings);
    const close = pick(run, voice.closes);
    let core = "";
    let tail = "";

    if (questionType === "smalltalk") {
        if (mode === "safe" || mode === "soft_safe") {
            core = pick(run, [
                "“我平时真没这么疯，今晚算我色迷心窍。”",
                "“最近忙得跟狗一样，真不是天天出来找人滚床单。”",
                "“今晚之前我都在忙自己的事，临时起火才会站到你面前。”"
            ]);
        } else if (mode === "risky") {
            core = pick(run, [
                "“别问得像查岗，我今晚也就顺路出来放个火。”",
                "“你放心，我熟归熟，不代表我脏到见谁都上。”",
                "“这种局我确实不止玩过一次，但你别一副要给我立案的样子。”"
            ]);
        } else {
            core = pick(run, [
                "“你要问我最近干嘛，我能说，但你别盯着那点细节不放。”",
                "“我不是没见过人，只是没你想得那么乱。”",
                "“你真想听，我能聊，只不过有些事没必要摊得太明白。”"
            ]);
        }
    } else if (questionType === "probe") {
        if (mode === "honest" || mode === "honest_safe") {
            core = pick(run, [
                "“上次检测是前阵子，在医院做的，结果我还留着。”",
                "“你问检测我能直接说，时间、地方、结果都对得上。”",
                "“这事我不跟你打马虎眼，该做的检查我做过。”"
            ]);
        } else if (mode === "hard_deny") {
            core = pick(run, [
                "“我没事，你爱信不信，别把裤子还没脱就问成审讯。”",
                "“你老追着检测问什么，我说了没事就是没事。”",
                "“真要这么不放心，你现在就走，别在这儿磨我。”"
            ]);
            tail = pick(run, voice.deflects);
        } else if (mode === "half_truth") {
            core = pick(run, [
                "“前阵子测过吧，反正没出事，你别揪着日期不放。”",
                "“我不是不告诉你，只是这种细节真没必要一条条报账。”",
                "“结果大差不差是干净的，至于哪天做的你别逼我背台词。”"
            ]);
            tail = pick(run, voice.deflects);
        } else if (mode === "charm_push") {
            core = pick(run, [
                "“你先别这么紧，真想稳一点我也能配合，别把气氛弄凉。”",
                "“你再这么盘我，我都要怀疑你是来抓人还是来上床的。”",
                "“我懂你怕什么，但你也别把每句话都问成病历。”"
            ]);
            tail = pick(run, voice.deflects);
        } else {
            core = pick(run, [
                "“这事我能说，但你别指望我把每个时间点都背给你。”",
                "“不是我故意躲，你这么问谁都会先想想怎么回答。”",
                "“我没想骗你，只是有些问题你问得真够直的。”"
            ]);
            tail = pick(run, voice.deflects);
        }
    } else {
        if (mode === "boundary_safe") {
            core = pick(run, [
                "“想继续可以，但套必须戴，别拿上头当借口。”",
                "“我可以跟你玩，但底线得先说死，风险别想往我身上甩。”",
                "“你要是真想碰，那就按最稳的来，别一热就乱来。”"
            ]);
        } else if (mode === "pressure") {
            core = pick(run, [
                "“别聊那么细，真到那一步你身体比脑子诚实。”",
                "“都到这儿了，你不会还想一层层给自己上锁吧？”",
                "“你先别把气氛掐死，真爽起来的时候没人还记得这些。”"
            ]);
            tail = pick(run, voice.deflects);
        } else {
            core = pick(run, [
                "“我不是完全没底线，只是也没你想得那么规规矩矩。”",
                "“你要我现在把每一步说死，我也做不到那么假正经。”",
                "“边界我有，但不是每句话都想说得像合同。”"
            ]);
        }
    }

    return [opening, core, tail, close].filter(Boolean).join(" ");
}

function getPanicClue(questionType) {
    if (questionType === "probe") {
        return {
            tone: "warning",
            text: "你太上头了，只记住他在回避，具体细节全糊成一团。"
        };
    }

    if (questionType === "boundary") {
        return {
            tone: "caution",
            text: "你只抓到一个印象：他对边界态度不够让人放心。"
        };
    }

    return {
        tone: "caution",
        text: "你听见了不少话，却只留下一个模糊感觉：这人不太对劲。"
    };
}

function createEvent({ title, icon, lines, tone = "default", closeMode = "close", closeLabel = null, disease = null, criticalReason = null, casebookUnlocks = null, polishSpec = null }) {
    return {
        title,
        icon,
        lines,
        tone,
        closeMode,
        closeLabel: closeLabel || (closeMode === "close" ? "关闭" : "继续"),
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
            ? { disabled: true, reason: partner.boundaryClue?.detail || "对方拒绝" }
            : { disabled: false, reason: "" },
        sex_condom: partner.disabledActions.includes("sex_condom")
            ? { disabled: true, reason: partner.boundaryClue?.detail || "对方拒绝" }
            : { disabled: false, reason: "" },
        oral_raw: partner.disabledActions.includes("oral_raw")
            ? { disabled: true, reason: partner.boundaryClue?.detail || "对方拒绝" }
            : { disabled: false, reason: "" },
        sex_raw: partner.disabledActions.includes("sex_raw")
            ? { disabled: true, reason: partner.boundaryClue?.detail || "对方拒绝" }
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
            text: "隐藏信息",
            detail: CHAT_DEFS[type].prompt
        });
    });

    return slots;
}

function buildChatUi(partner, run) {
    const remaining = Math.max(0, partner.patienceMax - partner.chatsUsed);
    const disabledByPanic = run.gameOver;
    const disabledByPatience = remaining <= 0;
    const options = CHAT_ORDER.map((type) => ({
        id: type,
        label: CHAT_DEFS[type].label,
        shortLabel: CHAT_DEFS[type].shortLabel,
        prompt: CHAT_DEFS[type].prompt,
        disabled: disabledByPanic || disabledByPatience || partner.questionsAsked[type],
        reason: partner.questionsAsked[type]
            ? "这个问题已经问过了"
            : disabledByPatience
                ? "他已经懒得继续跟你扯了"
                : ""
    }));

    return {
        available: !disabledByPatience && !disabledByPanic,
        remaining,
        label: disabledByPatience ? "他开始不耐烦了" : `试探 / 聊天 · 还剩 ${remaining} 次`,
        options
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
    const summary = run.gameOver ? buildSummary(run) : null;

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
        summary,
        gameOver: run.gameOver
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

function buildIntroEvent(run) {
    const lines = run.currentPartner?.tutorialIntroLines;
    if (!lines || lines.length === 0) {
        return null;
    }

    return createEvent({
        title: "先别急着脱",
        icon: "🕵️",
        lines,
        closeMode: "close"
    });
}

function getActionOutcomeTone(run, partner, infectedThisTurn, actionType) {
    const diseased = partner.diseaseIds.length > 0;

    if (actionType === "refuse") {
        return diseased ? { tone: "leave", label: "🛡️ 正确离开" } : { tone: "miss", label: "👋 遗憾错过" };
    }

    if (infectedThisTurn) {
        return { tone: "infected", label: "💀 被 ta 感染" };
    }

    if (diseased) {
        return { tone: "escape", label: "😰 死里逃生" };
    }

    return { tone: "enjoy", label: "✅ 理智享受" };
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
        const partnerModifier = partner.riskTier === "high" ? 1.15 : partner.riskTier === "uncertain" ? 0.85 : 0.45;
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
    if (run.gameOver) {
        return;
    }

    run.currentPartner = createPartner(run);
}

function buildEndingEvent(run, endingId, extraLines = [], diseaseKey = null) {
    run.gameOver = true;
    const summary = buildSummary(run);
    const base = {
        survive: {
            title: "幸存者",
            icon: "✨",
            tone: "success",
            lines: [
                { tone: "success", text: "你把这团火泄干净了，身体也还没被谁留下脏账。" },
                { tone: "muted", text: "这次你赢的不是侥幸，是你没被气氛骗上床。"}
            ]
        },
        bad_win: {
            title: "糟糕的胜利",
            icon: "🥀",
            tone: "danger",
            lines: [
                { tone: "warning", text: "当晚是爽到了，几天后身体还是替你把这笔烂账结了。" },
                { tone: "muted", text: "你赢了那一下，输给了后劲。"}
            ]
        },
        burnout: {
            title: "欲火焚身",
            icon: "🤯",
            tone: "danger",
            lines: [
                { tone: "warning", text: "压抑一路烧穿了脑子，你后面看到的已经不是人，是泄火工具。" },
                { tone: "muted", text: "你不是输给了谁，是输给了自己越来越急的那团火。"}
            ]
        },
        breakdown: {
            title: "精神崩溃",
            icon: "😵‍💫",
            tone: "danger",
            lines: [
                { tone: "warning", text: "心理压力彻底爆表，你已经没本事分清谁在撩你，谁在坑你。" },
                { tone: "muted", text: "恐慌一上头，所有细节都被你自己抹平了。"}
            ]
        },
        confirmed_infection: {
            title: "确诊感染",
            icon: "🏥",
            tone: "danger",
            lines: [
                { tone: "warning", text: "医院把你最后那点侥幸按死了，报告单比谁都冷。 " },
                { tone: "muted", text: "延迟判决终于落下，只是砸你头上的不是好运。"}
            ]
        }
    }[endingId];

    const disease = diseaseKey ? {
        name: DISEASES[diseaseKey].name,
        transmission: DISEASES[diseaseKey].transmission
    } : null;
    const criticalReason = buildCriticalReason(run, endingId);
    const unlocks = buildCasebookUnlocks(run, endingId, diseaseKey);

    return {
        event: createEvent({
            title: base.title,
            icon: base.icon,
            tone: base.tone,
            lines: base.lines.concat(extraLines).concat([
                { tone: "muted", text: `本局共撑过 ${summary.turnsSurvived} 回合。` }
            ]),
            closeMode: "restart",
            closeLabel: "返回首页",
            disease,
            criticalReason,
            casebookUnlocks: unlocks,
            polishSpec: {
                kind: "ending",
                frame: {
                    mode: run.mode,
                    endingId,
                    title: base.title,
                    summary,
                    criticalReason,
                    disease: disease?.name || null,
                    infected: run.player.infected
                }
            }
        }),
        unlocks
    };
}

function buildCriticalReason(run, endingId) {
    if (endingId === "survive") {
        if (run.stats.leaveCount > 0) {
            return "你能全身而退，不是因为你不色，是因为你该抽身的时候真抽了。";
        }

        return "你能活下来，关键是没把“看着能睡”误判成“真的安全”。";
    }

    if (endingId === "bad_win" || endingId === "confirmed_infection") {
        return "你输在把“当场没翻车”误判成了“这人真没毒”。";
    }

    if (endingId === "burnout") {
        return "你输在那团火越烧越急，最后谁都被你看成灭火器。";
    }

    return "你输在压力把脑子拧坏了，后面分不清真线索和自我哄骗。";
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

    const summary = endingId ? buildSummary(run) : null;
    if (summary) {
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
    if (!event) {
        return;
    }

    event.casebookUnlocks = unlocks;
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
    const clue = panicMode
        ? {
            id: questionType,
            revealed: true,
            tone: getPanicClue(questionType).tone,
            text: getPanicClue(questionType).text,
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

    const reply = buildReply(run, partner, questionType, blueprint.replyMode);
    const unlocks = buildCasebookUnlocks(run, null, null, partner);
    const lines = [
        { tone: "default", text: reply },
        { tone: clue.tone, text: clue.text }
    ];

    if (blueprint.clue.contradiction && !panicMode) {
        lines.push({ tone: "warning", text: "这句回答有明显矛盾味，你最好记住。" });
    } else if (panicMode) {
        lines.push({ tone: "muted", text: "恐慌让你抓不住更细的地方，只留下了模糊印象。" });
    }

    const event = createEvent({
        title: CHAT_DEFS[questionType].label,
        icon: questionType === "probe" ? "🧪" : questionType === "boundary" ? "🧭" : "💬",
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
                fallback: lines[0].text,
                clue: clue.text
            }
        }
    });

    return {
        event,
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
    let lines;
    let icon;

    if (partner.testSignal === "positive") {
        icon = "🦠";
        lines = [
            { tone: "danger", text: "试纸出现阳性反应。" },
            { tone: "warning", text: `它至少提示出这些风险：${formatDiseaseNames(partner.diseaseIds)}。` },
            { tone: "muted", text: "这是强线索，不代表你已经知道全部真相。" }
        ];
    } else if (partner.testSignal === "uncertain") {
        icon = "❔";
        lines = [
            { tone: "warning", text: "试纸没有给你一个干净利落的答案。"} ,
            { tone: "muted", text: "窗口期或说辞问题让结果更像“还不能放心”。" }
        ];
    } else {
        icon = "🛡️";
        lines = [
            { tone: "success", text: "试纸这次没报出常见风险。"} ,
            { tone: "muted", text: "阴性不是免死金牌，它只说明当前没抓到硬证据。" }
        ];
    }

    if (!partner.discoveredQuestionClues.smalltalk) {
        const previewClue = clone(partner.questionBlueprints.smalltalk.clue);
        previewClue.revealed = true;
        previewClue.tone = previewClue.tone === "risk" ? "warning" : previewClue.tone;
        previewClue.text = `试纸之外，你还顺手注意到：${previewClue.text}`;
        partner.discoveredQuestionClues.smalltalk = previewClue;
        lines.push({ tone: previewClue.tone, text: previewClue.text });
    }

    const event = createEvent({
        title: "试纸结果",
        icon,
        lines,
        closeMode: "close",
        casebookUnlocks: unlocks
    });

    return {
        event,
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
        return buildEndingEvent(
            run,
            "confirmed_infection",
            [
                { tone: "danger", text: "医院把你之前那点侥幸直接判了死刑。" }
            ],
            run.player.infectionKey
        );
    }

    const event = createEvent({
        title: "虚惊一场",
        icon: "🏥",
        lines: [
            { tone: "success", text: "这次医院没查出问题。"} ,
            { tone: "muted", text: "你的心理压力清零了，但时间和压抑值都被医院吃走了一大块。" }
        ],
        closeMode: "close"
    });

    return {
        event,
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
    recordHistory(run, partner, "refuse", false, partner.riskTier === "high" ? "你顶住了诱惑。" : "你选择撤退。");
    advanceTurn(run, ACTION_DEFS.refuse.urgeDelta, ACTION_DEFS.refuse.anxietyDelta);

    if (run.frustration >= GAME_CONFIG.burnoutAt) {
        return buildEndingEvent(run, "burnout");
    }

    createNextPartnerIfNeeded(run);
    const unlocks = buildCasebookUnlocks(run, null, null, partner);
    const event = createEvent({
        title: "继续寻找",
        icon: "🏃",
        lines: [
            {
                tone: partner.diseaseIds.length > 0 ? "success" : "muted",
                text: partner.diseaseIds.length > 0
                    ? "你走得很对，这个人的风险比表面还高。"
                    : "你暂时错过了一个可能没那么糟的人，但至少还干净。"
            },
            { tone: "warning", text: `压抑值 +${ACTION_DEFS.refuse.urgeDelta}` }
        ],
        closeMode: "continue",
        closeLabel: "继续",
        casebookUnlocks: unlocks
    });

    return {
        event,
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

    const lines = [
        {
            tone: "success",
            text: `欲望得到了释放。压抑值 -${action.reward}，本回合净变化 ${frustrationDelta >= 0 ? `+${frustrationDelta}` : frustrationDelta}。`
        }
    ];

    if (action.anxietyDelta > 0) {
        lines.push({ tone: "warning", text: `心理压力 +${action.anxietyDelta}` });
    }

    if (infectedThisTurn) {
        lines.push({ tone: "warning", text: "你当下还不知道，但身体已经替你记下了这次赌局。" });
    } else if (partner.diseaseIds.length > 0) {
        lines.push({ tone: "muted", text: "他本来就带着风险，只是这次没轮到你倒霉。"} );
    } else {
        lines.push({ tone: "muted", text: "这次至少没有踩到更糟的后果。"} );
    }

    const unlocks = buildCasebookUnlocks(run, null, null, partner);
    const event = createEvent({
        title: "宣泄与不安",
        icon: actionType === "sex_raw" ? "🔥" : actionType === "oral_raw" ? "🍭" : "🛡️",
        lines,
        closeMode: "continue",
        closeLabel: "继续",
        casebookUnlocks: unlocks
    });

    return {
        event,
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
    } catch (error) {
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
    } catch (error) {
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
                temperature: 0.25,
                max_tokens: 180,
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
    const schema = {
        type: "object",
        properties: {
            text: { type: "string" }
        },
        required: ["text"],
        additionalProperties: false
    };
    const frame = event.polishSpec?.frame;
    const response = await runAiJson(
        env,
        "chat_polish",
        schema,
        [
            {
                role: "system",
                content: "你负责把成人小游戏里的对象回复润色得更像真人说话。保持事实不变，不新增任何检测、病情、边界或事件信息。风格要挑逗、辛辣、黑色、露骨但克制，中文短句，像人当面回话。不要写成旁白，不要扩写成长段，不要出现未成年、强迫或暴力。只返回 JSON。"
            },
            {
                role: "user",
                content: JSON.stringify(frame)
            }
        ],
        makePolishSeed(run, 17)
    );

    if (typeof response?.text === "string" && response.text.trim()) {
        event.lines[0].text = response.text.trim();
    }
}

async function polishEndingEvent(event, run, env) {
    const schema = {
        type: "object",
        properties: {
            summary: { type: "string" }
        },
        required: ["summary"],
        additionalProperties: false
    };
    const frame = event.polishSpec?.frame;
    const response = await runAiJson(
        env,
        "ending_polish",
        schema,
        [
            {
                role: "system",
                content: "你负责把成人小游戏整轮结束后的复盘总结润色成一句辛辣、黑色、露骨但克制的中文短评。保持事实和结局不变，不新增信息，不改变输赢原因，不写说教。只返回 JSON。"
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
            version: env.APP_VERSION || "2026-03-29",
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
        modes: SUPPORTED_MODES.map((mode) => ({
            id: mode,
            label: mode === "female" ? "女生视角" : "男生视角"
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
            const sessionToken = await issueSessionToken(payload.run, env);
            const introEvent = await prepareEventForClient(payload.introEvent, payload.run, env);

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
