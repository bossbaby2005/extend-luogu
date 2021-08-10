// ==UserScript==
// @name           Extend Luogu+
// @namespace      http://tampermonkey.net/
// @version        6.4.3
// @description    Make Luogu more powerful.
// @author         optimize_2 ForkKILLET minstdfx haraki swift-zym qinyihao oimaster Maxmilite OwO
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @match          https://service-psscsax9-1305163805.sh.apigw.tencentcs.com/release/exlg-version
// @match          https://www.bilibili.com/robots.txt?*
// @match          http://localhost/*
// @require        https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/js-xss/0.3.3/xss.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/marked/2.0.1/marked.min.js
// @require        https://cdn.jsdelivr.net/gh/bossbaby2005/markdown-palettes@3a564ba0d30d88848ec486b2c36553cce87f0c7f/mp.js
// @require        https://cdn.jsdelivr.net/gh/bossbaby2005/markdown-palettes@9822045f011f440432bd0dc301313846a9c1bbb0/markdown.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/wordcloud2.js/1.2.2/wordcloud2.js
// @require        https://cdn.bootcdn.net/ajax/libs/localforage/1.9.0/localforage.min.js
// @updateURL      https://github.com/bossbaby2005/extend-luogu
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_xmlhttpRequest
// @grant          GM_addStyle
// @grant          unsafeWindow
// @connect        localhost
// @connect        luogulo.gq
// @supportURL     yinjp20051110@qq.com
// ==/UserScript==

// ==Utilities==

const update_log = `
## 6.4.4
1. Notepad新功能, 允许其他OJ的题目, UI未完成, 等minstdfx来/kel
## 6.4.3
1. 修复数据问题
2. 修复提交记录颜色显示
## 6.4.0
1. 重构modloader
## 6.3.1
1. 更改markdown渲染
## 6.3.0
1. 改进随机ex
2. 精简设置页面代码
3. 增加洛谷笔记数据库安全更新
4. 更新页面改为新标签页打开
## 6.2.6
1. 修改更新日志
## 6.2.5
1. 提升钩子稳定性
`;

const html_circleswitch_on = `<svg data-v-2dc28d52="" aria-hidden="true" focusable="false" data-prefix="far" data-icon="dot-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-input svg-inline--fa fa-dot-circle fa-w-16"><path data-v-2dc28d52="" fill="currentColor" d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path></svg>`;
const html_circleswitch_off = `<svg data-v-2dc28d52="" aria-hidden="true" focusable="false" data-prefix="far" data-icon="circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-input svg-inline--fa fa-circle fa-w-16"><path data-v-2dc28d52="" fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200z"></path></svg>`;

const uindow = unsafeWindow;
const $ = jQuery;
const $$ = jQuery;
const markdown = window.md;
const MarkdownPalettes = window.MarkdownPalettes;
const WordCloud = window.WordCloud;
const mdp = uindow.markdownPalettes;
const log = (...s) => uindow.console.log("%c[exlg]", "color: #0e90d2;", ...s);
const warn = (...s) => uindow.console.warn("%c[exlg]", "color: #0e90d2;", ...s);
const error = (...s) => {
    uindow.console.error("%c[exlg]", "color: #0e90d2;", ...s);
    throw Error(s.join(" "));
};

const forage = window.localforage;
forage.config({ name: "Extend Luogu Config" });

const xss = new filterXSS.FilterXSS({
    onTagAttr: (_, k, v, __) => {
        if (k === "style") return `${k}="${v}"`;
    }
});

function sleep(t) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), t);
    });
}

function addScript(s) {
    const t = document.createElement("script");
    t.innerHTML = s;
    document.body.append(t);
}

function render(u) {
    if (u) return markdown.render(u);
    return "";
}

Date.prototype.format = function (f, UTC) {
    UTC = UTC ? "UTC" : "";
    const re = {
        "y+": this[`get${UTC}FullYear`](),
        "m+": this[`get${UTC}Month`]() + 1,
        "d+": this[`get${UTC}Date`](),
        "H+": this[`get${UTC}Hours`](),
        "M+": this[`get${UTC}Minutes`](),
        "S+": this[`get${UTC}Seconds`](),
        "s+": this[`get${UTC}Milliseconds`]()
    };
    for (const r in re) if (RegExp(`(${r})`).test(f))
        f = f.replace(RegExp.$1,
            ("000" + re[r]).substr(re[r].toString().length + 3 - RegExp.$1.length)
        );
    return f;
};

const version_cmp = (v1, v2) => {
    const op = (x1, x2) => x1 === x2 ? "==" : x1 < x2 ? "<<" : ">>";
    const exs = ["pre", "alpha", "beta"];

    const [[n1, e1], [n2, e2]] = [v1, v2].map((v) => v.split(" "));
    if (n1 === n2) return op(...[e1, e2].map((e) => e ? exs.findIndex((ex) => ex === e) : Infinity));

    const [m1, m2] = [n1, n2].map((n) => n.split("."));
    for (const [k2, m] of m1.entries())
        if (m !== m2[k2]) return op(+ m || 0, + m2[k2] || 0);
};

function getContent(url, contentOnly = 1) {
    if (contentOnly)
        url = url + (url.includes("?") ? "&" : "?") + "_contentOnly";
    return new Promise((resolve, reject) => {
        $.get(url, (u) => resolve(u));
    });
}

const lgAlert = (msg) => uindow.show_alert("exlg 提醒您", msg);

const storage = new Proxy({}, {
    async get(tar, key) {
        let t = GM_getValue(key);
        if (t === null) {
            t = await forage.getItem(key);
            if (t !== null) GM_setValue(key, t);
        }
        return t;
    },
    set(tar, key, val) {
        forage.setItem(key, val);
        return GM_setValue(key, val);
    },
    deleteProperty: (tar, key) => {
        GM_deleteValue(key);
        return true;
    },
    clear: (tar) => {
        GM_listValues().forEach((_) => {
            if (typeof (_) !== "string") return;
            GM_deleteValue(_);
            forage.setItem(_, null);
        });
    }
});

// ==Modules==

function locationMatch(pattern) {
    const [nhost] = pattern.split("/");
    if (nhost !== location.host) return false;
    const path = "/" + pattern.split("/").slice(1).join("/") + "$";
    const regpath = new RegExp(path);
    return regpath.test(location.pathname + location.search + location.hash);
}

class Lock {
    constructor() { this._locked = 0; }
    acquire() {
        if (this._locked === 1) return false;
        this._locked = 1;
        return true;
    }

    release() { this._locked = 0; }
    locked() { return this._locked; }
}

class ModConfig {
    constructor(name, info, loader) {
        this.name = name;
        this.info = info;

        this.style = "";
        this._match = [];
        this._exclude = [];
        this._hooks = [];
        this._plugins = [];
        this.aliveCheck = () => 0;
        this.runtime = loader;
        this.must = false;
        this.lock = new Lock();
    }

    // for plugins
    setAlive(f) { this.aliveCheck = f; }
    addStyle(s) { this.style += s; }
    match(e) { this._match.push(e); }
    exclude(e) { this._exclude.push(e); }
    addHook(e) { this._hooks.push(e); }
    /* Example:
    addHook((u) => {
        $(".item").on("click", u.runPlugins);
    })
    */
    plugin(e) { this._plugins.push(e); }
    setMust() { this.must = 1; }

    // for loader
    testMatch() { return this._exclude.every((v) => !locationMatch(v)) && this._match.every((v) => locationMatch(v)); }
    testAlive() { return this.aliveCheck(); }
    async runPlugins() {
        if (this.testMatch() && !this.testAlive() && this.lock.acquire()) {
            this._plugins.forEach(async (u) => await u(this.runtime));
            this.lock.release();
        }
        if (!this.style_inject && this.style) {
            console.log("inject", this.name);
            GM_addStyle(this.style);
            this.style_inject = 1;
        }
    }

    applyHooks() { this._hooks.forEach((u) => u(() => { this.runPlugins(); })); }
    async execute() { await this.runPlugins(); this.applyHooks(); }
}

class ModLoader {
    constructor() {
        this.mods = [];
        this.nameidx = {};
    }

    async initSwitch() {
        if (this.switch) return;
        this.switch = await storage.mod_map;
        if (!this.switch || !this.mods.every((u) => this.switch[u.name])) {
            const mp = {};
            this.mods.forEach((u) => { mp[u.name] = true; });
            this.switch = mp;
            storage.mod_map = mp;
        }
    }

    reg(name, info, u) {
        const t = new ModConfig(name, info, this);
        this.mods.push(t);
        this.nameidx[name] = this.mods.length;
        u(t);
    }

    apply() {
        this.mods.forEach((u) => u.execute());
    }

    runOne(name) {
        this.mods[this.nameidx[name]].execute();
    }

    async run() {
        await this.initSwitch();
        this.mods.forEach((u) => {
            if (this.switch[u.name])
                u.execute();
        });
    }
};

const loader = new ModLoader();

loader.reg("@dash", "控制面板", (conf) => {
    conf.setAlive(() => $("#exlg-nav-icon").length);
    conf.match("www.luogu.com.cn/.*");
    conf.plugin(() => {
        $(`<a href="/user/setting#extension" title="exlg" id="exlg-nav-icon"><svg data-v-78704ac9="" data-v-303bbf52="" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="user-cog" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-user-cog fa-w-20"><path data-v-78704ac9="" data-v-303bbf52="" fill="currentColor" d="M610.5 373.3c2.6-14.1 2.6-28.5 0-42.6l25.8-14.9c3-1.7 4.3-5.2 3.3-8.5-6.7-21.6-18.2-41.2-33.2-57.4-2.3-2.5-6-3.1-9-1.4l-25.8 14.9c-10.9-9.3-23.4-16.5-36.9-21.3v-29.8c0-3.4-2.4-6.4-5.7-7.1-22.3-5-45-4.8-66.2 0-3.3.7-5.7 3.7-5.7 7.1v29.8c-13.5 4.8-26 12-36.9 21.3l-25.8-14.9c-2.9-1.7-6.7-1.1-9 1.4-15 16.2-26.5 35.8-33.2 57.4-1 3.3.4 6.8 3.3 8.5l25.8 14.9c-2.6 14.1-2.6 28.5 0 42.6l-25.8 14.9c-3 1.7-4.3 5.2-3.3 8.5 6.7 21.6 18.2 41.1 33.2 57.4 2.3 2.5 6 3.1 9 1.4l25.8-14.9c10.9 9.3 23.4 16.5 36.9 21.3v29.8c0 3.4 2.4 6.4 5.7 7.1 22.3 5 45 4.8 66.2 0 3.3-.7 5.7-3.7 5.7-7.1v-29.8c13.5-4.8 26-12 36.9-21.3l25.8 14.9c2.9 1.7 6.7 1.1 9-1.4 15-16.2 26.5-35.8 33.2-57.4 1-3.3-.4-6.8-3.3-8.5l-25.8-14.9zM496 400.5c-26.8 0-48.5-21.8-48.5-48.5s21.8-48.5 48.5-48.5 48.5 21.8 48.5 48.5-21.7 48.5-48.5 48.5zM224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm201.2 226.5c-2.3-1.2-4.6-2.6-6.8-3.9l-7.9 4.6c-6 3.4-12.8 5.3-19.6 5.3-10.9 0-21.4-4.6-28.9-12.6-18.3-19.8-32.3-43.9-40.2-69.6-5.5-17.7 1.9-36.4 17.9-45.7l7.9-4.6c-.1-2.6-.1-5.2 0-7.8l-7.9-4.6c-16-9.2-23.4-28-17.9-45.7.9-2.9 2.2-5.8 3.2-8.7-3.8-.3-7.5-1.2-11.4-1.2h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c10.1 0 19.5-3.2 27.2-8.5-1.2-3.8-2-7.7-2-11.8v-9.2z" class=""></path></svg></a>`)
            .prependTo($("nav.user-nav, div.user-nav > nav"));
    });
    conf.addStyle(`
    #exlg-nav-icon {
        color: inherit;
        text-decoration: none;
        margin-right: .3em;
    }`);
});

loader.reg("@springboard", "跨域跳板", (conf) => {
    conf.match("www.bilibili.com/robots\\.txt\\?.*");
    conf.addStyle(`
    iframe {
        border: none;
        display: block;
        width: 100%;
        height: 100%;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
    `);
    conf.plugin(() => {
        const q = new URLSearchParams(location.search);
        console.log("started");
        if (q.has("benben")) {
            document.write(`<iframe src="https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121"></iframe>`);
            uindow.addEventListener("message", (e) => {
                e.data.unshift("benben");
                uindow.parent.postMessage(e.data, "*");
            });
        }
        else if (q.has("update")) {
            document.write(`<iframe src="https://service-psscsax9-1305163805.sh.apigw.tencentcs.com/release/exlg-version"></iframe>`);
            uindow.addEventListener("message", (e) => {
                e.data.unshift("update");
                uindow.parent.postMessage(e.data, "*");
            });
        }
        else if (q.has("url")) {
            const url = q.get("url");
            if (confirm(`是否加载来自 ${url} 的页面？`))
                document.body.innerHTML = `<iframe src="${url}"></iframe>`;
        }
    });
});

loader.reg("@benben-data", "犇犇数据", (conf) => {
    conf.match("service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121");
    conf.plugin(() => {
        uindow.parent.postMessage(JSON.parse(document.body.innerText), "*");
    });
});

loader.reg("@version-data", "版本数据", (conf) => {
    conf.match("service-psscsax9-1305163805.sh.apigw.tencentcs.com/release/exlg-version");
    conf.plugin(() => {
        uindow.parent.postMessage([document.body.innerText], "*");
    });
}
);

loader.reg("emoticon", "表情输入", (conf) => {
    conf.match("www.luogu.com.cn/discuss/lists");
    conf.match("www.luogu.com.cn/discuss/show/.*");
    conf.setAlive(() => $(".exlg-emo").length);
    /*
    const emo = [
        [ "62224", [ "qq" ] ],
        [ "62225", [ "cy" ] ],
        [ "62226", [ "kel", "kl" ] ],
        [ "62227", [ "kk" ] ],
        [ "62228", [ "dk" ] ],
        [ "62230", [ "xyx", "hj" ] ],
        [ "62234", [ "jk" ] ],
        [ "62236", [ "qiang", "up", "+", "zan" ] ],
        [ "62238", [ "ruo", "dn", "-", "cai" ] ],
        [ "62239", [ "ts" ] ],
        [ "62240", [ "yun" ] ],
        [ "62243", [ "yiw", "yw", "?" ] ],
        [ "62244", [ "se", "*" ] ],
        [ "62246", [ "px" ] ],
        [ "62248", [ "wq" ] ],
        [ "62250", [ "fad", "fd" ] ],
        [ "69020", [ "youl", "yl" ] ]
    ]
    */
    const emo = [
        "qq",
        "cy",
        "kel",
        "dk",
        "kk",
        "xyx",
        "jk",
        "ts",
        "yun",
        "yiw",
        "se",
        "px",
        "wq",
        "fad",
        "xia",
        "jy",
        "qiao",
        "youl",
        "qiang",
        "ruo",
        "shq",
        "mg",
        "dx",
        "tyt",
    ];
    function emo_markdown(name) {
        if (emo.includes(name)) return `![${name}](https://xn--9zr.tk/${name})`;
        else return name;
    };
    const emo_url = (name) => `https://xn--9zr.tk/${name}`;

    conf.plugin(() => {
        const $menu = $(".mp-editor-menu"),
            $txt = $(".CodeMirror-wrap textarea"),
            $nl = $(`<br />`).appendTo($menu),
            $grd = $(".mp-editor-ground").addClass("exlg-ext");

        emo.forEach((m) => {
            const url = emo_url(m);
            $(`<li class="exlg-emo"><img src="${url}" /></li>`)
                .on("click", () => $txt
                    .trigger("focus")
                    .val(emo_markdown(m))
                    .trigger("input")
                )
                .appendTo($menu);
        });
        const $emo = $(".exlg-emo");

        const $fold = $(`<li>表情 <i class="fa fa-chevron-left"></li>`)
            .on("click", () => {
                $nl.toggle();
                $emo.toggle();
                $fold.children().toggleClass("fa-chevron-left fa-chevron-right");
                $grd.toggleClass("exlg-ext");
            });
        $nl.after($fold);

        $txt.on("input", (e) => {
            // 添加对 LuoguEmojiSender 的兼容
            if (document.getElementById("replaceEmoji") == null) {
                if (e.originalEvent.data === "/")
                    mdp.content = mdp.content.replace(/\/(.{1,5})\//g, (_, emo_txt) => emo_markdown(emo_txt));
            }
        });
    });

    conf.addStyle(`
    .mp-editor-ground.exlg-ext {
        top: 80px !important;
    }
    .mp-editor-menu > br ~ li {
        position: relative;
        display: inline-block;
        margin: 0;
        padding: 5px 1px;
    }`);
});

loader.reg("@update", "脚本升级", async (conf) => {
    conf.match("www.luogu.com.cn/.*");
    const last = await storage.last_check ?? 0;
    const now = parseInt(Date.now() / 1000);
    const interval = 60 * 60 * 24;
    conf.plugin(() => {
        if (now - last > interval) {
            log(`Checking update...`);
            let loaded = false;
            if (loaded) $("#exlg-benben").attr("src", $("#exlg-benben").attr("src"));
            else {
                const $sb = $(`<iframe id="exlg-update" src="https://www.bilibili.com/robots.txt?update"></iframe>`)
                    .appendTo($("body")).hide();
                log("Building springboard:", $sb[0]);
                loaded = true;
            }
            uindow.addEventListener("message", (e) => {
                log("Listening message(in update):", e.data);
                if (e.data[0] !== "update") return;
                e.data.shift();

                const
                    latest = e.data[0],
                    version = GM_info.script.version,
                    op = version_cmp(version, latest);

                const l = `Comparing version: ${version} ${op} ${latest}`;
                log(l);

                if (op === "<<") $("#exlg-dash > .exlg-warn").show();
                $("#exlg-dash-verison").html(l.split(": ")[1]
                    .replace(">>", `<span style="color: #5eb95e;">&gt;&gt;</span>`)
                    .replace("==", `<span style="color: #5eb95e;">==</span>`)
                    .replace("<<", `<span style="color: #e74c3c;">&lt;&lt;</span>`)
                );
                $(`#newest-version-display`).html(latest);
                if (op === "<<") {
                    $(`#newest-version-display`).css("color", "#e74c3c");
                }
                if (op === "==") {
                    $(`#newest-version-display`).css("color", "#e74c3c");
                }
                if (op === ">>") {
                    $(`#newest-version-display`).css("color", "#66ccff");
                }
            });
            storage.last_check = parseInt(Date.now() / 1000);
        }
    });
});

loader.reg("user-intro-ins", "主页指令", (conf) => {
    conf.match("www.luogu.com.cn/user/\\d+(#main)*");
    conf.plugin(() => {
        log(`Working user tab#main mod: "user-intro-ins"`);
        $(".introduction > *").each((_, e, $e = $(e)) => {
            const t = $e.text();
            let [, , ins, arg] = t.match(/^(exlg.|%)([a-z]+):([^]+)$/) ?? [];
            if (!ins) return;

            arg = arg.split(/(?<!!)%/g).map((s) => s.replace(/!%/g, "%"));
            const $blog = $($(".user-action").children()[0]);
            switch (ins) {
            case "html":
                $e.replaceWith($(`<p>${xss.process(arg[0])}</p>`));
                break;
            case "frame":
                $e.replaceWith($(`<iframe src="https://www.bilibili.com/robots.txt?url=${encodeURI(arg[0])}"`
                        + `style="width: ${arg[1]}; height: ${arg[2]};"></iframe>`
                ));
                break;
            case "blog":
                if ($blog.text().trim() !== "个人博客") return;
                $blog.attr("href", arg);
                $e.remove();
                break;
            }
        });
    });
    conf.addHook((u) => $(".items").on("click", u));
    conf.addStyle(`
    iframe {
        border: none;
        display: block;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
    `);
});

loader.reg("user-problem", "题目颜色和比较", (conf) => {
    conf.match("www.luogu.com.cn/user/\\d+#practice");
    const color = [
        "rgb(191, 191, 191)",
        "rgb(254, 76, 97)",
        "rgb(243, 156, 17)",
        "rgb(255, 193, 22)",
        "rgb(82, 196, 26)",
        "rgb(52, 152, 219)",
        "rgb(157, 61, 207)",
        "rgb(14, 29, 105)"
    ];
    conf.plugin(() => {
        setTimeout(async () => {
            log(`Working user tab#practice mod: "user-problem"`);
            $(".exlg-counter").remove();
            $(".problems").each((i, ps, $ps = $(ps)) => {
                const my = uindow._feInjection.currentData[["submittedProblems", "passedProblems"][i]];
                $ps.find("a").each((d, p, $p = $(p)) =>
                    $p.removeClass("color-default").css("color", color[my[d].difficulty])
                );
                $ps.before($(`<span id="exlg-problem-count-${i}" class="exlg-counter">${my.length}</span>`));
            });

            if (uindow._feInjection.currentData.user.uid === uindow._feInjection.currentUser.uid) return;

            const res = await getContent(`/user/${uindow._feInjection.currentUser.uid}`);

            const my = res.currentData.passedProblems;
            const ta = uindow._feInjection.currentData.passedProblems;

            let same = 0;
            const $ps = $($(".problems")[1]);
            $ps.find("a").each((d, p, $p = $(p)) => {
                if (my.some((m) => m.pid === ta[d].pid)) {
                    same++;
                    $p.css("backgroundColor", "rgba(82, 196, 26, 0.3)");
                }
            });
            $("#exlg-problem-count-1").html(`<span class="exlg-counter">${ta.length} <> ${my.length} : ${same}<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`);
        }, 300);
    });
    conf.addHook((u) => $(".items").on("click", u));
    conf.addStyle(`
    .main > .card > h3 {
        display: inline-block;
    }
    `);
});

loader.reg("user-css-load", "加载用户样式", async (conf) => {
    conf.match("www.luogu.com.cn/theme/list.*");
    conf.addStyle(await storage.user_css);
    conf.addStyle(`
    #exlg-user-css {
        display: block;
        box-sizing: border-box;
        padding: 1.3em;
        margin-bottom: 1.3em;
        background-color: white;
    }`);
    conf.plugin(async () => {
        $(`<div><h4>自定义css</h4></div>`).append(
            $(`<div class="am-form-group am-form"></div>`).append(
                $(`<textarea rows="3" id="custom-css-input"` + ((((await storage.code_fonts_val) || "") !== "") ? (`style="font-family: ` + (await storage.code_fonts_val || "") + `"`) : (``)) + `></textarea>`).val(await storage.user_css)
            )
        )
            .append(
                $(`<p></p>`).append(
                    (() => {
                        const $btn = $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="border-color: rgb(231, 76, 60);background-color: rgb(231, 76, 60)">保存</button>`);
                        $btn.on("click", () => {
                            $btn.prop("disabled", true);
                            $btn.text("保存成功");
                            storage.user_css = $("#custom-css-input").val();
                            setTimeout(() => {
                                location.reload();
                            }, 1000);
                        })
                            .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                            .mouseleave((e) => { $(e.target).css("opacity", "1"); });
                        return $btn;
                    })()
                )
            ).appendTo(".full-container");
        $("#custom-css-input").val(await storage.user_css);
        $("#save-css-button").on("click", () => {
            storage.user_css = $("#custom-css-input").val();
            location.reload();
        });
    });
});

loader.reg("benben", "全网犇犇", (conf) => {
    conf.match("www.luogu.com.cn/");
    const color = {
        Gray: "gray",
        Blue: "bluelight",
        Green: "green",
        Orange: "orange lg-bold",
        Red: "red lg-bold",
        Purple: "purple lg-bold",
    };
    const check_svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%" style="margin-bottom: -3px;">
    <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
</svg>`;
    const check = (lv) => lv <= 3 ? "" : check_svg.replace("%", lv <= 5 ? "#5eb95e" : lv <= 8 ? "#3498db" : "#f1c40f");

    conf.plugin(() => {
        let loaded = false;

        const $sel = $(".feed-selector");
        $(`<li class="feed-selector" id="exlg-benben-selector" data-mode="all"><a style="cursor: pointer">全网动态</a></li>`)
            .appendTo($sel.parent())
            .on("click", (e) => {
                const $this = $(e.currentTarget);
                $sel.removeClass("am-active");
                $this.addClass("am-active");

                $("#feed-more").hide();
                $("li.am-comment").remove();

                if (loaded) $("#exlg-benben").attr("src", $("#exlg-benben").attr("src"));
                else {
                    const $sb = $(`<iframe id="exlg-benben" src="https://www.bilibili.com/robots.txt?benben"></iframe>`)
                        .appendTo($("body")).hide();
                    log("Building springboard:", $sb[0]);
                    loaded = true;
                }
            });

        uindow.addEventListener("message", (e) => {
            log("Listening message:", e.data);

            if (e.data[0] !== "benben") return;
            e.data.shift();
            if (!$("#exlg-benben-selector").hasClass("am-active")) return; //若不是全网犇犇就不添加
            e.data.forEach((m) =>
                $(`
<li class="am-comment am-comment-primary feed-li">
    <div class="lg-left">
        <a href="/user/${m.user.uid}" class="center">
            <img src="https://cdn.luogu.com.cn/upload/usericon/${m.user.uid}.png" class="am-comment-avatar">
        </a>
    </div>
    <div class="am-comment-main">
        <header class="am-comment-hd">
            <div class="am-comment-meta">
                <span class="feed-username">
                    <a class="lg-fg-${color[m.user.color]}" href="/user/${m.user.uid}" target="_blank">
                        ${m.user.name}
                    </a>
                    <a class="sb_amazeui" target="_blank" href="/discuss/show/142324">
                        ${check(m.user.ccfLevel)}
                    </a>
                    ${m.user.badge ? `<span class="am-badge am-radius lg-bg-${color[m.user.color]}">${m.user.badge}</span>` : ""}
                </span>
                ${new Date(m.time * 1000).format("yyyy-mm-dd HH:MM")}
                <a name="feed-reply">回复</a>
            </div>
        </header>
        <div class="am-comment-bd">
            <span class="feed-comment">
                ${marked(m.content)}
            </span>
        </div>
    </div>
</li>`)
                    .appendTo($("ul#feed"))
                    .find("a[name=feed-reply]").on("click", () =>
                        $("textarea")
                            .trigger("focus").val(` || @${m.user.name} : ${m.content}`)
                            .trigger("input")
                    )
            );
        });
    });
});

loader.reg("rand-problem-ex", "随机跳题ex", (conf) => {
    conf.match("www.luogu.com.cn/");
    const iLoveMinecraft = [0, 1, 2, 3, 4, 5, 6, 7];
    const iLoveTouhou = [0, 1, 2, 3, 4];
    const fackYouCCF = ["P", "CF", "SP", "AT", "UVA"];
    const difficulty_html = [
        `<div exlgcolor="red"    class="exlg-difficulties">入门</div>`,
        `<div exlgcolor="orange" class="exlg-difficulties">普及-</div>`,
        `<div exlgcolor="yellow" class="exlg-difficulties">普及/提高-</div>`,
        `<div exlgcolor="green"  class="exlg-difficulties">普及+/提高</div>`,
        `<div exlgcolor="blue"   class="exlg-difficulties">提高+/省选-</div>`,
        `<div exlgcolor="purple" class="exlg-difficulties">省选/NOI-</div>`,
        `<div exlgcolor="black"  class="exlg-difficulties">NOI/NOI+/CTSC</div>`,
        `<div exlgcolor="grey"   class="exlg-difficulties">暂无评定</div>`
    ];
    const source_html = [
        `<div exlgcolor="red"    class="exlg-difficulties">洛谷题库</div>`,
        `<div exlgcolor="orange" class="exlg-difficulties">Codeforces</div>`,
        `<div exlgcolor="yellow" class="exlg-difficulties">SPOJ</div>`,
        `<div exlgcolor="green"  class="exlg-difficulties">ATcoder</div>`,
        `<div exlgcolor="blue"   class="exlg-difficulties">UVA</div>`
    ];
    conf.addStyle(`
    #exlg-rand-diffs {
        list-style-type:none
    }
    .exlg-rand-settings {
        position: relative;
        display: inline-block;

        padding: 1px 5px 1px 5px;

        background-color: white;
        border: 1px solid #6495ED;
        color: cornflowerblue;
        border-radius: 6px;
        font-size:12px;
    }
    .exlg-rand-settings.select {
        background-color: cornflowerblue;
        border: 1px solid #6495ED;
        color: white;
    }
    .exlg-difficulties {
        position: relative;
        display: inline-block;
        padding: 1px 5px 1px;
        color: white;
        border-radius: 6px;
        font-size:12px;
    }
    div[exlgcolor='red'] {
        background-color: rgb(254, 76, 97);
    }
    div[exlgcolor='orange'] {
        background-color: rgb(243, 156, 17);
    }
    div[exlgcolor='yellow'] {
        background-color: rgb(255, 193, 22);
    }
    div[exlgcolor='green'] {
        background-color: rgb(82, 196, 26);
    }
    div[exlgcolor='blue'] {
        background-color: rgb(52, 152, 219);
    }
    div[exlgcolor='purple'] {
        background-color: rgb(157, 61, 207);
    }
    div[exlgcolor='black'] {
        background-color: rgb(14, 29, 105);
    }
    div[exlgcolor='grey'] {
        background-color: rgb(191, 191, 191);
    }
    .exlg-rand-settings:hover {
        box-shadow: 0 0 7px dodgerblue;
    }
    .exlg-window {
        position: absolute;
        top: 35px;
        left: 0px;
        z-index: 65536;
        display: none;
        width: 250px;
        height: 300px;
        padding: 5px;
        background: white;
        color: black;
        border-radius: 7px;
        box-shadow: rgb(187 227 255) 0px 0px 7px;
    }
    `);
    conf.plugin(async () => {
        let mouse_on_board = false, mouse_on_dash = false;
        const difficulty_select = (await storage.mod_rand_difficulty) || [false, false, false, false, false, false, false, false];
        const source_select = (await storage.mod_rand_source) || [false, false, false, false, false];
        log(difficulty_select, source_select);
        if ($("#exlg-rand-diffs").length) return;
        $("[name='gotorandom']").text("随机");
        const $start_rand = $(`<button class="am-btn am-btn-success am-btn-sm" name="gotorandomex" id="gtrdex">随机ex</button>`).appendTo($("[name='gotorandom']").parent());
        //$(".lg-index-stat>h2").after($(`<div><h2>问题跳转</h2><div id="exlg-dash-0" class="exlg-rand-settings">...</div></div>`)).remove()
        $(".lg-index-stat>h2").after(
            $(`<h2>问题跳转 <div id="exlg-dash-0" class="exlg-rand-settings">ex设置</div></h2>`)
                .mouseenter(() => {
                    mouse_on_dash = true;
                    $("#exlg-dash-0-window").show();
                })
                .mouseleave(() => {
                    mouse_on_dash = false;
                    if (!mouse_on_board) {
                        setTimeout(() => {
                            if (!mouse_on_board) $("#exlg-dash-0-window").hide();
                            storage.mod_rand_difficulty = difficulty_select;
                            storage.mod_rand_source = source_select;
                            log(storage.mod_rand_difficulty, storage.mod_rand_source);
                        }, 200);
                    }
                })

        ).remove();
        $(`<span id="exlg-dash-0-window" class="exlg-window" style="display: block;"><p></p><ul id="exlg-rand-diffs">
<div>
<span class=".exlg-title-span">
<div id="button-showdiff" class="exlg-rand-settings select">题目难度</div>
&nbsp;&nbsp;
<div id="button-showsrce" class="exlg-rand-settings">题目来源</div>
</span>
</div>
<p></p>
<div id="exlg-exrd-diff">
<span style="width: 49%; float: left " id="exlg-exrd-diff-1">
<span class="lg-small lg-inline-up">已选择</span><p></p>
</span>
<span style="width: 49%; float: right" id="exlg-exrd-diff-0">
<span class="lg-small lg-inline-up">未选择</span><p></p>
</span>
</div>
<div id="exlg-exrd-srce" style="display:none;">
<span style="width: 49%; float: left " id="exlg-exrd-srce-1">
<span class="lg-small lg-inline-up">已选择</span><p></p>
</span>
<span style="width: 49%; float: right" id="exlg-exrd-srce-0">
<span class="lg-small lg-inline-up">未选择</span><p></p>
</span>
</div>
</ul><p></p></span>`).hide().appendTo($("[name='gotorandom']").parent())
            .mouseenter(() => { mouse_on_board = true; log("mouse entered!"); })
            .mouseleave((e) => {
                mouse_on_board = false;
                if (!mouse_on_dash) {
                    $("#exlg-dash-0-window").hide();
                    storage.mod_rand_difficulty = difficulty_select;
                    storage.mod_rand_source = source_select;
                    log(storage.mod_rand_difficulty, storage.mod_rand_source);
                }
                log("mouse left!");
            });
        $("#button-showdiff").on("click", () => {
            log("clicked");
            $("#button-showdiff").addClass("select");
            $("#button-showsrce").removeClass("select");
            $("#exlg-exrd-diff").show();
            $("#exlg-exrd-srce").hide();
        });
        $("#button-showsrce").on("click", () => {
            $("#button-showdiff").removeClass("select");
            $("#button-showsrce").addClass("select");
            log("clicked1");
            $("#exlg-exrd-diff").hide();
            $("#exlg-exrd-srce").show();
        });
        let j = 0;
        for (j = 0; j < difficulty_html.length; ++j) {
            const i = j;//否则一直按最后的j来
            log(i);
            const tmp = $(difficulty_html[i]).on("click", (e) => {
                const _this = $(e.target);
                _this.hide();
                $("#exlg-exrd-diff-0").find(`div[exlgcolor='${_this.attr("exlgcolor")}']`).show();
                difficulty_select[i] = false;
                log(difficulty_select, source_select);
            }).appendTo($("#exlg-exrd-diff-1"));
            console.log(difficulty_select[i]);
            if (difficulty_select[i] === false) tmp.hide();
        }
        for (j = 0; j < difficulty_html.length; ++j) {
            const i = j;
            const tmp = $(difficulty_html[i]).on("click", (e) => {
                const _this = $(e.target);
                _this.hide();
                $("#exlg-exrd-diff-1").find(`div[exlgcolor='${_this.attr("exlgcolor")}']`).show();
                difficulty_select[i] = true;
                log(difficulty_select, source_select);
                console.log(difficulty_select[i]);
            }).appendTo($("#exlg-exrd-diff-0"));
            if (difficulty_select[i] === true) tmp.hide();
        }

        for (j = 0; j < source_html.length; ++j) {
            const i = j;
            log(i);
            const tmp = $(source_html[i]).on("click", (e) => {
                const _this = $(e.target);
                _this.hide();
                $("#exlg-exrd-srce-0").find(`div[exlgcolor='${_this.attr("exlgcolor")}']`).show();
                source_select[i] = false;
                log(difficulty_select, source_select);
            }).appendTo($("#exlg-exrd-srce-1"));
            if (source_select[i] === false) tmp.hide();
        }
        for (j = 0; j < source_html.length; ++j) {
            const i = j;
            const tmp = $(source_html[i]).on("click", (e) => {
                const _this = $(e.target);
                _this.hide();
                $("#exlg-exrd-srce-1").find(`div[exlgcolor='${_this.attr("exlgcolor")}']`).show();
                source_select[i] = true;
                log(difficulty_select, source_select);
            }).appendTo($("#exlg-exrd-srce-0"));
            if (source_select[i] === true) tmp.hide();
        }


        $("#exlg-dash-0").on("click", (_) => $("#exlg-dash-0-window").toggle());
        const HREF_NEXT = async () => {
            let difs = [];
            iLoveMinecraft.forEach((i) => {
                if (difficulty_select[i]) {
                    if (i === 7) {
                        difs.push(0);
                    }
                    else difs.push(i + 1);
                }
            });
            let srcs = [];
            iLoveTouhou.forEach((i) => {
                if (source_select[i]) srcs.push(i);
            });
            //log("exrand", srcs, difs);
            if (difs.length === 0) {
                difs = [0, 1, 2, 3, 4, 5, 6, 7];
            }
            if (srcs.length === 0) {
                srcs = [0];
            }
            const difficulty = difs[Math.floor(Math.random() * difs.length)];
            //["P","CF","SP","AT","UVA"]
            const source = fackYouCCF[srcs[Math.floor(Math.random() * srcs.length)]];

            let res = await getContent(`/problem/list?difficulty=${difficulty}&type=${source}&page=1`);

            const
                problem_count = res.currentData.problems.count,
                page_count = Math.ceil(problem_count / 50),
                rand_page = Math.floor(Math.random() * page_count) + 1;

            res = await getContent(`/problem/list?difficulty=${difficulty}&type=${source}&page=${rand_page}`);
            const
                list = res.currentData.problems.result,
                rand_idx = Math.floor(Math.random() * list.length),
                pid = list[rand_idx].pid;
            location.href = `/problem/${pid}`;
        };
        $("#gtrdex").on("click", HREF_NEXT);
        $(".am-form-field[name='toproblem']").after($(`<input type="text" class="am-form-field" placeholder="例：P1001，可跳至A+B" name="toproblem">`)).remove();
        $(".am-btn.am-btn-danger.am-btn-sm[name='goto']").after($(`<button class="am-btn am-btn-danger am-btn-sm" name="goto">跳转</button>`)).remove();
        const judge_problem = (text) => {
            if (text.match(/AT[0-9]{1,4}/i) === text) return true;
            if (text.match(/CF[0-9]{1,4}[A-Z][0-9]{0,1}/i) === text) return true;
            if (text.match(/SP[0-9]{1,5}/i) === text) return true;
            if (text.match(/P[0-9]{4}/i) === text) return true;
            if (text.match(/UVA[0-9]{1,5}/i) === text) return true;
            if (text.match(/U[0-9]{1,6}/i) === text) return true;
            if (text.match(/T[0-9]{1,6}/i) === text) return true;
            return false;
        };
        const $func_jump_problem = (str) => {
            if (judge_problem(str)) str = str.toUpperCase();
            if (str === "" || typeof (str) === "undefined") uindow.show_alert("提示", "请输入题号");
            else location.href = "https://www.luogu.com.cn/problemnew/show/" + str;
        };
        const $input_problem = $(".am-form-field[name='toproblem']").on("keydown", (e) => {
            if (e.keyCode === 13) {
                if (/^[0-9]+.?[0-9]*$/.test($input_problem.val())) $input_problem.val("P" + $input_problem.val());
                $func_jump_problem($input_problem.val());
            }
        });
        $(".am-btn.am-btn-danger.am-btn-sm[name='goto']").on("click", () => {
            $func_jump_problem($input_problem.val());
        });

        $("#rand-problem-2").on("click", async () => {
            const id = $("[name=rand-problem-2]").val();
            const res = await getContent(`/training/${id}`);
            const
                list = res.currentData.training.problems,
                rand_idx = Math.floor(Math.random() * list.length),
                pid = list[rand_idx].problem.pid;
            location.href = `/problem/${pid}`;
        });
    });
});

loader.reg("keyboard-and-cli", "键盘操作与命令行", (conf) => {
    conf.match("www.luogu.com.cn/.*");
    conf.setAlive(() => $("#exlg-cli").length);
    conf.plugin(async () => {
        const $cli = $(`<div id="exlg-cli"></div>`).appendTo($("body"));
        const $cli_input = $(`<input id="exlg-cli-input" />`).appendTo($cli);

        let cli_is_log = false;
        const cli_log = (sp, ...tp) => {
            cli_is_log = true;
            const m = sp.map((s, i) =>
                s.split(/\b/).map((w) => cli_lang_dict[w]?.[cli_lang - 1] ?? w).join("") +
                (tp[i] || "")
            ).join("");
            return $cli_input.val(m);
        };
        const cli_error = (sp, ...tp) =>
            warn(cli_log(sp, ...tp).addClass("error").val());
        const cli_clean = () => {
            cli_is_log = false;
            return $cli_input.val("").removeClass("error");
        };
        const cli_history = [];
        let cli_history_index = 0;
        const cli_langs = ["en", "zh"], cli_lang_dict = {
            ".": ["。"],
            ",": ["，"],
            "!": ["！"],
            "?": ["？"],
            "cli": ["命令行"],
            "current": ["当前"],
            "language": ["语言"],
            "available": ["可用"],
            "command": ["命令"],
            "commands": ["命令"],
            "unknown": ["未知"],
            "forum": ["板块"],
            "target": ["目标"],
            "mod": ["模块"],
            "action": ["操作"],
            "illegal": ["错误"],
            "param": ["参数"],
            "expected": ["期望"],
            "type": ["类型"],
            "lost": ["缺失"],
            "essential": ["必要"],
            "user": ["用户"]
        };
        let cli_lang = (await storage.cli_lang) || 0;

        const cmds = {
            help: (cmd/*string*/) => {
                /* get the help of <cmd>. or list all cmds. */
                /* 获取 <cmd> 的帮助。空则列出所有。 */
                if (!cmd)
                    cli_log`exlg cli. current language: ${cli_lang}, available commands: ${Object.keys(cmds).join(", ")}`;
                else {
                    const f = cmds[cmd];
                    if (!f) return cli_error`help: unknown command "${cmd}"`;

                    const arg = f.arg.map((a) => {
                        const i = a.name + ": " + a.type;
                        return a.essential ? `<${i}>` : `[${i}]`;
                    }).join(" ");
                    cli_log`${cmd} ${arg} ${f.help[cli_lang]}`;
                }
            },
            cd: (path/*!string*/) => {
                /* jump to <path>, relative path is OK. */
                /* 跳转至 <path>，支持相对路径。 */
                let tar;
                if (path[0] === "/") tar = path;
                else {
                    const pn = location.pathname.replace(/^\/+/, "").split("/");
                    const pr = path.split("/");
                    pr.forEach((d) => {
                        if (d === ".") return;
                        if (d === "..") pn.pop();
                        else pn.push(d);
                    });
                    tar = pn.join("/");
                }
                location.href = location.origin + "/" + tar.replace(/^\/+/, "");
            },
            cdd: (forum/*!string*/) => {
                /* jump to the forum named <forum> of discussion. use all the names you can think of. */
                /* 跳转至名为 <forum> 的讨论板块，你能想到的名字基本都有用。 */
                const tar = [
                    ["relevantaffairs", "gs", "gsq", "灌水", "灌水区", "r", "ra"],
                    ["academics", "xs", "xsb", "学术", "学术版", "a", "ac"],
                    ["siteaffairs", "zw", "zwb", "站务", "站务版", "s", "sa"],
                    ["problem", "tm", "tmzb", "灌水", "题目总版", "p"],
                    ["service", "fk", "fksqgd", "反馈", "反馈、申请、工单专版", "se"]
                ];
                forum = tar.find((ns) => ns.includes(forum))?.[0];
                if (!tar) return cli_error`cdd: unknown forum "${forum}"`;
                cmds.cd(`/discuss/lists?forumname=${forum}`);
            },
            cc: (name/*char*/) => {
                /* jump to [name], "h|p|c|r|d|i|m|n" stands for home|problem|record|discuss|I myself|message|notification. or jump home. */
                /* 跳转至 [name]，"h|p|c|r|d|i|m|n" 代表：主页|题目|评测记录|讨论|个人中心|私信|通知。空则跳转主页。 */
                name = name || "h";
                const tar = {
                    h: "/",
                    p: "/problem/list",
                    c: "/contest/list",
                    r: "/record/list",
                    d: "/discuss/lists",
                    i: "/user/" + uindow._feInjection.currentUser.uid,
                    m: "/chat",
                    n: "/user/notification",
                }[name];
                if (tar) cmds.cd(tar);
                else cli_error`cc: unknown target "${name}"`;
            },
            mod: (action/*!string*/, name/*string*/) => {
                /* for <action> "enable|disable|toggle", opearte the mod named <name>. for <action> "save", save modification. */
                /* 当 <action> 为 "enable|disable|toggle"，对名为 <name> 的模块执行对应操作：启用|禁用|切换。当 <action> 为 "save"，保存修改。 */
                switch (action) {
                case "enable":
                case "disable":
                case "toggle":
                    if (loader.switch[name] === undefined) return cli_error`mod: unknown mod "${name}"`;
                    let now = loader.switch[name];
                    now = { enable: true, disale: false, toggle: !now }[action];
                    loader.switch[name] = now;
                    break;
                case "save":
                    storage.mod_map = loader.switch;
                    break;
                default:
                    return cli_error`mod: unknown action "${action}"`;
                }
            },
            dash: (action/*!string*/) => {
                /* for <action> "show|hide|toggle", opearte the exlg dashboard. */
                /* 当 <action> 为 "show|hide|toggle", 显示|隐藏|切换 exlg 管理面板。 */
                if (!["show", "hide", "toggle"].includes(action))
                    return cli_error`dash: unknown action "${action}"`;
                $("#exlg-dash-window")[action]();
            },
            lang: (lang/*!string*/) => {
                /* for <lang> "en|zh" switch current cli language. */
                /* 当 <lang> 为 "en|zh"，切换当前语言。 */
                lang = cli_langs.indexOf(lang);
                if (lang < 0) return cli_error`lang: unknown language ${lang}`;
                storage.cli_lang = cli_lang = lang;
            },
            uid: (uid/*!integer*/) => {
                /* jumps to homepage of user whose uid is <uid>. */
                /* 跳转至 uid 为 <uid> 的用户主页。 */
                location.href = `/user/${uid}`;
            },
            un: (name/*!string*/) => {
                /* jumps to homepage of user whose username is like <name>. */
                /* 跳转至用户名与 <name> 类似的用户主页。 */
                $.get("/api/user/search?keyword=" + name, (res) => {
                    if (!res.users[0])
                        cli_error`un: unknown user "${name}".`;
                    else
                        location.href = "/user/" + res.users[0].uid;
                });
            }
        };
        for (const f of Object.values(cmds)) {
            [, f.arg, f.help] = f.toString().match(/^\((.*?)\) => {((?:\n +\/\*.+?\*\/)+)/);
            f.arg = f.arg.split(", ").map((a) => {
                const [, name, type] = a.match(/([a-z_]+)\/\*(.+)\*\//);
                return {
                    name, essential: type[0] === "!", type: type.replace(/^!/, "")
                };
            });
            f.help = f.help.trim().split("\n").map((s) => s.match(/\/\* (.+) \*\//)[1]);
        }
        const parse = (cmd) => {
            log(`Parsing command: "${cmd}"`);

            const tk = cmd.trim().replace(/^\//, "").split(" ");
            const n = tk.shift();
            if (!n) return;
            const f = cmds[n];
            if (!f) return cli_error`exlg: unknown command "${n}"`;
            let i = -1, a; for ([i, a] of tk.entries()) {
                const t = f.arg[i].type;
                if (t === "number" || t === "integer") tk[i] = Number(a);
                if (
                    t === "char" && a.length === 1 ||
                    t === "number" && !isNaN(tk[i]) ||
                    t === "integer" && !isNaN(tk[i]) && !(tk[i] % 1) ||
                    t === "string"
                );
                else return cli_error`${n}: illegal param "${a}", expected type ${t}.`;
            }
            if (f.arg[i + 1]?.essential) return cli_error`${n}: lost essential param "${f.arg[i + 1].name}"`;
            f(...tk);
        };

        $cli_input.on("keydown", (e) => {
            switch (e.key) {
            case "Enter":
                if (cli_is_log) return cli_clean();
                const cmd = $cli_input.val();
                cli_history.push(cmd);
                cli_history_index = cli_history.length;
                parse(cmd);
                if (!cli_is_log) return cli_clean();
                break;
            case "/":
                if (cli_is_log) cli_clean();
                break;
            case "Escape":
                $cli.hide();
                break;
            case "ArrowUp":
            case "ArrowDown":
                const i = cli_history_index + { ArrowUp: -1, ArrowDown: +1 }[e.key];
                if (i < 0 || i >= cli_history.length) return;
                cli_history_index = i;
                $cli_input.val(cli_history[i]);
                break;
            }
        });

        $(uindow).on("keydown", (e) => {
            const $act = $(document.activeElement);
            if ($act.is("body")) {
                const rel = { ArrowLeft: "prev", ArrowRight: "next" }[e.key];
                if (rel) return $(`a[rel=${rel}]`)[0].click();

                if (e.shiftKey) {
                    const y = { ArrowUp: 0, ArrowDown: 1e6 }[e.key];
                    if (y !== undefined) uindow.scrollTo(0, y);
                }

                if (e.key === "/") {
                    $cli.show();
                    cli_clean().trigger("focus");
                }
            }
            else if ($act.is("[name=captcha]") && e.key === "Enter")
                $("#submitpost, #submit-reply")[0].click();
        });
    });
    conf.addStyle(`
    #exlg-cli {
        position: fixed;
        top: 0;
        z-index: 65536;
        display: none;
        width: 100%;
        height: 40px;
        background-color: white;
        box-shadow: 0 0 7px dodgerblue;
    }
    #exlg-cli-input {
        display: block;
        height: 100%;
        width: 100%;
        border: none;
        outline: none;
        font-family: "Fira Code", "consolas", "Courier New", monospace;
    }
    #exlg-cli-input.error {
        background-color: indianred;
    }
    `);
});

loader.reg("copy-code-block", "代码块功能优化", (conf) => {
    conf.match("www.luogu.com.cn/.*");
    conf.addStyle(`
    .exlg-copy {
        position: relative;
        display: inline-block;
        border: 1px solid #3498db;
        border-radius: 3px;
        background-color: rgba(52, 152, 219, 0);
        color: #3498db;
        font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", "Noto Sans", "Noto Sans CJK SC", "Noto Sans CJK", "Source Han Sans", "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif;
        flex: none;
        outline: 0;
        cursor: pointer;
        font-weight: inherit;
        line-height: 1.5;
        text-align: center;
        vertical-align: middle;
        background: 0 0;
        font-size: .8em;
        padding: 0 5px;
    }
    .exlg-copy:hover {
        background-color: rgba(52, 152, 219, 0.1);
    }
    div.exlg-copied {
        background-color: rgba(52, 152, 219, 0.9)!important;
        color: white!important;
    }
    .copy-btn {
        font-size: .8em;
        padding: 0 5px;
    }
    .lfe-form-sz-middle {
        font-size: 0.875em;
        padding: 0.313em 1em;
    }
    .exlg-code-title {
        margin-top: 0;
        margin-bottom: .5em;
        font-family: inherit;
        font-weight: bold;
        line-height: 1.2;
        color: inherit;
        font-size: 1.125em;
        display: inline-block;
    }
    `);
    conf.plugin(async () => {
        const language_show = (await storage.copy_code_block_language !== 0);

        const func_code = () => {
            const $cb = $("pre:has(> code):not([exlg-copy-code-block=''])");
            if ($cb.length) log(`Scanning code block:`, $cb.length);
            $cb.each(async (i, e, $e = $(e)) => {
                $e.attr("exlg-copy-code-block", "");
                const btn = $(`<div class="exlg-copy">复制</div>`).attr("style", ((await storage.copy_code_button_rightfloat) ? ("float: right;") : ("")));
                const language_list = ["c", "cpp", "pascal", "python", "java", "javascript", "php", "latex"];
                let language = "";
                if (language_show) {
                    if ($e.find("code").attr("data-rendered-lang")) language = $e.find("code").attr("data-rendered-lang").toString();
                    if ($e.find("code").attr("class")) {
                        const str = $e.find("code").attr("class").toString();
                        if (str.indexOf("hljs") !== -1) language = str.substr(9, str.length - 14);
                        else language = str.substr(9, str.length - 9);
                    }
                    if (language.indexOf("ult language-") === 0) language = language.substr(13);
                    if (language_list.indexOf(language) === -1) language = "";
                    log(language_list.indexOf(language));
                    if (language === "cpp") language = "c++";
                    if (language !== "") language = " - " + language;
                }
                log("Language:" + language);
                const $$cb = $($cb[i]).parent();
                $e.before($(`<p></p>`));
                $e.before($(`<h3 class="exlg-code-title">源代码${language}</h3>`));
                $e.before($(`<text> </text>`));
                $e.before(btn.on("click", () => {
                    const $textarea = $("<textarea></textarea>")
                        .appendTo($("body"))
                        .text($e.text())
                        .select();
                    btn.text("复制成功").toggleClass("exlg-copied");
                    setTimeout(() => btn.text("复制").toggleClass("exlg-copied"), 1000);
                    document.execCommand("copy");
                    $textarea.remove();
                }));
                $e.before($(`<p></p>`));
                if (!$cb.children("code").hasClass("hljs")) $cb.children("code").addClass("hljs").css("background", "white");
                const code_fonts_val = await storage.code_fonts_val;
                if (code_fonts_val && code_fonts_val !== "") $cb.children("code").css("font-family", code_fonts_val);
            });
        };
        if (window.location.href.indexOf("https://www.luogu.com.cn/record/") !== 0) func_code();
        if (window.location.href === "https://www.luogu.com.cn/" || window.location.href === "https://www.luogu.com.cn") {
            $(".feed-selector").on("click", () => {
                setTimeout(func_code, 300);
            }); // lack of hook
            $("#feed-more").on("click", () => {
                setTimeout(func_code, 300);
            }); // lack of hook
        }//以防万一
        if (window.location.href.indexOf("https://www.luogu.com.cn/record/") === 0) {
            $($(".entry")[1]).on("click", () => {
                setTimeout(async () => {
                    if (language_show && (typeof ($(".lfe-h3").attr("exlg-language-show")) === "undefined")) {
                        const language = $($(".value.lfe-caption")[0]).text().toLowerCase();
                        log("Language:" + language);
                        $(".lfe-h3").text($(".lfe-h3").text() + " - " + ((language.substr(-3) === " o2") ? (language.slice(0, -3)) : (language))).attr("exlg-language-show", "");
                    }
                    const $cb = $("pre:has(> code)");
                    const code_fonts_val = await storage.code_fonts_val;
                    if (code_fonts_val && code_fonts_val !== "") $cb.children("code").css("font-family", code_fonts_val);
                    $cb.children("code").addClass("hljs").css("background", "white");
                    $cb.children(".copy-btn").attr("style", ((await storage.copy_code_button_rightfloat) ? ("float: right;") : ("")));
                }, 100);
            });
        }
    });
});

loader.reg("search-user", "查找用户名", (conf) => {
    conf.match("www.luogu.com.cn/");
    conf.setAlive(() => $("#search-user").length);
    conf.plugin(() => {
        let $boardn = $("#exlg-board");
        if (!$boardn.length) $boardn = $(`
<div class="lg-article" id="exlg-board"></div> <br />
`).prependTo(".lg-right.am-u-md-4");
        const $board = $(`<div></div><br>`).appendTo($boardn);
        $board.html(`
<h3>查找用户</h3>
<div class="am-input-group am-input-group-primary am-input-group-sm">
    <input type="text" class="am-form-field" placeholder="例：kkksc03，可跳转站长主页" name="username" id="search-user-input">
</div>
<p>
    <button class="am-btn am-btn-danger am-btn-sm" id="search-user">跳转</button>
</p>
`);
        async function func() {
            $search_user.prop("disabled", true);
            const res = await getContent(`/api/user/search?keyword=${$("[name=username]").val()}`, 0);
            if (!res.users[0]) {
                $search_user.prop("disabled", false);
                lgAlert("无法找到指定用户");
            }
            else location.href = "/user/" + res.users[0].uid;
        }
        const $search_user = $("#search-user").on("click", func);
        $("#search-user-input").keydown((e) => {
            if (e.keyCode === 13) func();
        });
    });
});

loader.reg("problem-export", "题目导出", (conf) => {
    conf.match("www.luogu.com.cn/problem/(U|T|P|CF|AT|SP|UVA)\\d+[A-Z]*");
    conf.plugin(() => {
        const btn = $(`
    <button data-v-370e72e2="" data-v-42c20b13="" type="button" class="lfe-form-sz-middle" data-v-52820d90=""
    style="border-color: rgb(52, 152, 219);background-color: rgb(52, 152, 219)">
    导出题目
    </button>
    `), submit_button = $("div").val("提交答案");
        const setbtn = () => {
            btn.on("click", async () => {
                const defaultPorts = [
                    1327, // cpbooster
                    4244, // Hightail
                    6174, // Mind Sport
                    10042, // acmX
                    10043, // Caide and AI Virtual Assistant
                    10045, // CP Editor
                    27121, // Competitive Programming Helper
                ];
                try {
                    const res = await getContent(window.location.pathname + window.location.search);
                    const problem = res.currentData.problem, contest = res.currentData.contest;
                    const exportData = {
                        name: problem.title,
                        group: contest ? contest.name : "题目列表",
                        url: window.location.href,
                        memoryLimit: Math.max(...problem.limits.memory) / 1024,
                        timeLimit: Math.max(...problem.limits.time),
                        tests: problem.samples.map((sample) => {
                            return {
                                input: sample[0],
                                output: sample[1]
                            };
                        })
                    };
                    for (const port of defaultPorts) {
                        GM_xmlhttpRequest({
                            method: "POST",
                            url: `http://localhost:${port}`,
                            headers: {
                                "Content-Type": "application/json"
                            },
                            data: JSON.stringify(exportData)
                        });
                    }
                    alert("导出成功！");
                }
                catch (e) {
                    alert(`导出失败：${e}`);
                }
            });
        };
        btn.appendTo($("div.operation"));
        setbtn();
        let tap_number = 0;
        submit_button.on("click", () => {
            tap_number += 1;
            if (tap_number % 6 === 0) {
                btn.remove();
                btn.appendTo($("div.operation"));
                setbtn();
            }
        });
    });
});

loader.reg("@luogu-settings-extension", "洛谷风格扩展设置", (conf) => {
    //"https://www.luogu.com.cn/user/setting#extension"

    conf.match("www.luogu.com.cn/user/setting.*");
    conf.setAlive(() => $("#exlg-padding").length);

    conf.addStyle(`
    .am-form-field {
        font-size: 0.875em;
        padding: 0.313em 1em;
    }
    #exlg-padding {
        padding: 1.3em;
        margin-bottom: 1.3em;
        background-color: rgb(255, 255, 255) ;
        box-shadow: rgba(26, 26, 26, 0.1) 0px 1px 3px;
        box-sizing: border-box;
    }
    .exlgset-span {
        display: inline-block;
        width: 10em;
        padding-right: 1em;
        box-sizing: border-box;
        text-align: left;
        font-weight: 700;
    }
    p.lfe-caption:first-child {
        margin-top: 0;
    }
    p.lfe-caption:last-child {
        margin-bottom: 0;
    }
    p.lfe-caption.exlg-caption {
        padding: 0;
    }
    .items>li {
        display: inline-block;
        padding: .063em .5em;
        transition: .3s ease all;
        position: relative;
    }
    .items>li>.entry {
        color: inherit;
        text-decoration: none;
        cursor: pointer;
        display: inline-block;
        padding: 20px .5em;
    }
    .input {
        width: 200px;
    }
    `);

    conf.plugin(async () => {
        log("exlg-settings!");

        const $get_button_of_sth = (GMid, GMdesc, default_value/*boolean*/) => {
            default_value = storage[GMid] || default_value;
            const $fte = $(`<label data-v-2dc28d52="" for="radio-43"> ${GMdesc} </label>`);
            const $csd = $("<span>" + ((default_value) ? (html_circleswitch_on) : (html_circleswitch_off)) + "</span>").prependTo($fte);
            $fte.on("click", () => {
                if ($csd.children().attr("data-icon") === "dot-circle") {
                    $csd.html(html_circleswitch_off);
                    storage[GMid] = false;
                }
                else {
                    $csd.html(html_circleswitch_on);
                    storage[GMid] = true;
                }
            });
            return $fte;
        };
        const $get_button_of_mod_map = (sxid, sxdesc) => {
            const $fte = $(`<label data-v-2dc28d52="" for="radio-43"> ${sxdesc} </label>`);
            const $csd = $("<span>" + ((loader.switch[sxid]) ? (html_circleswitch_on) : (html_circleswitch_off)) + "</span>").prependTo($fte);
            $fte.on("click", () => {
                if ($csd.children().attr("data-icon") === "dot-circle") {
                    $csd.html(html_circleswitch_off);
                    loader.switch[sxid] = false;
                    storage.mod_map = loader.switch;
                }
                else {
                    $csd.html(html_circleswitch_on);
                    loader.switch[sxid] = true;
                    storage.mod_map = loader.switch;
                }
            });
            return $fte;
        };

        const href_list = ["information", "preference", "security", "extension", "extension-admin", "update-log"];
        if (window.location.href === "https://www.luogu.com.cn/user/setting" || window.location.pathname === "/user/setting") {
            if (window.location.href === "https://www.luogu.com.cn/user/setting" || href_list.indexOf(window.location.href.substr(38)) === -1) {
                //log('23333')
                //window.location.href = "https://www.luogu.com.cn/user/setting#information"
            }
            if (location.href === "https://www.luogu.com.cn/user/setting#update-log") {
                $(".items").remove();
                const $lg_form_layout = $(".padding-default").html("");
                $(".lfe-h1").text(`extend-luogu Ver. ${GM_info.script.version} 更新日志`);
                $lg_form_layout.append(render(update_log));
                return;
            }

            const $lg_entry = $(".items").children("li");
            const $lg_form_layout = $(".padding-default");
            $lg_entry.hide();
            $(".card.padding-default").removeAttr("data-v-796309f8 data-v-7765a18d data-v-6febb0e8").attr("id", "exlg-padding");
            const $ex_form_layout = $(`<div class="card padding-default" id="exlg-padding"><div class="exlg-form-layout"></div></div>`).hide().appendTo($(".full-container"));
            const $ex_admin_form_layout = $(`<div class="card padding-default" id="exlg-padding"><div class="exlg-admin-form-layout"></div></div>`).hide().appendTo($(".full-container"));
            //set the layout
            $(
                `<div data-v-22efe7ee="" class="row">
    <span class="exlgset-span">
        <span class="exlgset-span">模块开关</span>
    </span><div style="display: block;width: 100%;"><div id="ex-settings-module-switch">
        <p class="lfe-caption exlg-caption">设置exlg插件各模块的开启与关闭。</p>
    </div></div>
</div>`).appendTo($ex_form_layout);
            $(
                `<div data-v-22efe7ee="" class="row">
    <span class="exlgset-span">
        <span class="exlgset-span">模块设置</span>
    </span><div style="display: block;width: 100%;"><div id="ex-settings-module-settings">
        <p class="lfe-caption exlg-caption">设置exlg插件特定模块的功能。</p>
    </div></div>
</div>`).appendTo($ex_form_layout);
            $(
                `<div data-v-22efe7ee="" class="row">
    <span class="exlgset-span">
        <span class="exlgset-span">高级设置</span>
    </span><div style="display: block;width: 100%;"><div id="ex-settings-advanced-settings">
        <p class="lfe-caption exlg-caption">一些奇怪的东西。</p>
    </div></div>
</div>`).appendTo($ex_form_layout);


            //end.

            //set the admin layout.

            $(
                `<div data-v-22efe7ee="" class="row">
    <span class="exlgset-span">
        <span class="exlgset-span">意见反馈</span>
    </span><div style="display: block;width: 100%;"><div id="ex-settings-fuck-you">
        <p class="lfe-caption exlg-caption">请暂时前往exlg的github反馈issues。</p>
    </div></div>
</div>`).appendTo($ex_admin_form_layout);


            $(
                `<div data-v-22efe7ee="" class="row">
    <span class="exlgset-span">
        <span class="exlgset-span">版本&更新</span>
    </span><div style="display: block;width: 100%;"><div id="ex-settings-update-versions">
    </div></div>
</div>`).appendTo($ex_admin_form_layout);
            $(
                `<div data-v-22efe7ee="" class="row">
    <span class="exlgset-span">
        <span class="exlgset-span">实验性玩法</span>
    </span><div style="display: block;width: 100%;"><div id="ex-settings-features-laboratory">
        <p class="lfe-caption exlg-caption">一些脑洞会先在这里测试。</p>
    </div></div>
</div>`).appendTo($ex_admin_form_layout);
            $(
                `<div data-v-22efe7ee="" class="row">
    <span class="exlgset-span">
        <span class="exlgset-span">数据&调试</span>
    </span><div style="display: block;width: 100%;"><div id="ex-settings-data-debug">
        <p class="lfe-caption exlg-caption">警告，非开发者不要乱动这玩意，否则出什么事情我不负责。</p>
    </div></div>
</div>`).appendTo($ex_admin_form_layout);
            //end.


            //这里是顶层的栏目设置
            //总共5个~
            const $ex_entry_info = $(`<li><span data-v-7092f3a4 class="entry">个人信息</span><!----></li>`).appendTo($(".items"));
            const $ex_entry_pref = $(`<li><span data-v-7092f3a4 class="entry">使用偏好</span><!----></li>`).appendTo($(".items"));
            const $ex_entry_secu = $(`<li><span data-v-7092f3a4 class="entry">安全设置</span><!----></li>`).appendTo($(".items"));
            const $ex_entry_exte = $(`<li><span data-v-7092f3a4 class="entry">扩展设置</span><!----></li>`).appendTo($(".items"));
            const $ex_entry_admn = $(`<li><span data-v-7092f3a4 class="entry">高级设置</span><!----></li>`).appendTo($(".items"));
            const $ex_entry = [$ex_entry_info, $ex_entry_pref, $ex_entry_secu, $ex_entry_exte, $ex_entry_admn];
            if (href_list.includes(window.location.href.substr(38))) {
                $ex_entry[href_list.indexOf(window.location.href.substr(38))].children().addClass("selected");
            }
            else {
                $ex_entry_info.children().addClass("selected");
            }
            log(window.location.href.substr(38));
            if (window.location.href.substr(38) === "extension") {
                log("extension settings~");
                $lg_form_layout.hide();
                $ex_form_layout.show();
                $ex_admin_form_layout.hide();
            }
            if (window.location.href.substr(38) === "extension-admin") {
                log("hidden extension settings~");
                $lg_form_layout.hide();
                $ex_form_layout.hide();
                $ex_admin_form_layout.show();
            }
            $ex_entry[0].on("click", () => {
                $lg_entry[0].click();
                $(".entry").removeClass("selected");
                $ex_entry[0].children().addClass("selected");
                $lg_form_layout.show();
                $ex_form_layout.hide();
                $ex_admin_form_layout.hide();
            });
            $ex_entry[1].on("click", () => {
                $lg_entry[1].click();
                $(".entry").removeClass("selected");
                $ex_entry[1].children().addClass("selected");
                $lg_form_layout.show();
                $ex_form_layout.hide();
                $ex_admin_form_layout.hide();
            });
            $ex_entry[2].on("click", () => {
                $lg_entry[2].click();
                $(".entry").removeClass("selected");
                $ex_entry[2].children().addClass("selected");
                $lg_form_layout.show();
                $ex_form_layout.hide();
                $ex_admin_form_layout.hide();
            });
            $ex_entry[3].on("click", () => {
                $(".entry").removeClass("selected");
                $ex_entry[3].children().addClass("selected");
                $lg_form_layout.hide();
                $ex_form_layout.show();
                $ex_admin_form_layout.hide();
                window.location.href = "https://www.luogu.com.cn/user/setting#extension";
            });
            $ex_entry[4].on("click", () => {
                $(".entry").removeClass("selected");
                $ex_entry[4].children().addClass("selected");
                $lg_form_layout.hide();
                $ex_form_layout.hide();
                $ex_admin_form_layout.show();
                window.location.href = "https://www.luogu.com.cn/user/setting#extension-admin";
            });

            //module设置
            loader.mods.forEach((m) => {
                if (!m.name.startsWith("@") && !["user-css-edit", "update"].includes(m.name)) {
                    $(`<div></div>`)
                        .append($get_button_of_mod_map(m.name, m.info))
                        .appendTo($("#ex-settings-module-switch"));
                }
            });

            $(`<div><h4>代码块功能优化</h4></div>`).append($get_button_of_sth("copy_code_block_language", "代码块显示语言", true)).append($("<br>")).append($get_button_of_sth("copy_code_button_rightfloat", "复制按钮右对齐", true)).appendTo($("#ex-settings-module-settings"));

            $(`<div><h4>设置代码块字体</h4></div>`)
                .append(
                    $(`<div data-v-a7f7c968="" data-v-61c90fba="" class="refined-input input-wrap input frame" data-v-22efe7ee=""></div>`).append(
                        $(`<input data-v-a7f7c968="" class="lfe-form-sz-middle" placeholder="填写你想要的字体~" id="code-fonts-input">`).val((await storage.code_fonts_val) || "")
                    )
                )
                .append(
                    $(`<p></p>`).append(
                        $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="border-color: rgb(231, 76, 60);background-color: rgb(231, 76, 60)">保存</button>`).on("click", (e) => {
                            const $btn = $(e.target);
                            //log($('#code-fonts-input').val())
                            $btn.prop("disabled", true);
                            $btn.text("保存成功");
                            storage.code_fonts_val = $("#code-fonts-input").val();
                            setTimeout(() => {
                                $btn.removeAttr("disabled");
                                $btn.text("保存");
                            }, 1000);
                        })
                            .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                            .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                    )
                ).appendTo($("#ex-settings-module-settings"));

            $(`<div><h4>讨论保存</h4></div>`).append($get_button_of_sth("discuss_auto_save", "讨论自动保存", true)).appendTo($("#ex-settings-module-settings"));

            $(`<div><h4>自定义css</h4></div>`).append(
                $(`<div class="am-form-group am-form"></div>`).append(
                    $(`<textarea rows="3" id="custom-css-input"` + ((((await storage.code_fonts_val) || "") !== "") ? (`style="font-family: ` + ((await storage.code_fonts_val) || "") + `"`) : (``)) + `></textarea>`).val(await storage.user_css)
                )
            )
                .append(
                    $(`<p></p>`).append(
                        $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="border-color: rgb(231, 76, 60);background-color: rgb(231, 76, 60)">保存</button>`).on("click", (e) => {
                            const $btn = $(e.target);
                            $btn.prop("disabled", true);
                            $btn.text("保存成功");
                            storage.user_css = $("#custom-css-input").val();
                            setTimeout(() => {
                                location.reload();
                            }, 1000);
                        })
                            .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                            .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                    )
                )
                .appendTo($("#ex-settings-module-settings"));

            //数据&调试
            $(`<div></div>`).append($get_button_of_sth("exlg_debug_mode", "debug_mode", false))
                .append($(`<span>&nbsp;</span>`))
                .append(
                    (() => {
                        const $btn = $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="border-color: rgb(191, 191, 191);background-color: rgb(191, 191, 191)" id="show-all-settings">显示其他设置版块</button>`);
                        $btn[0].onclick = () => {
                            $lg_form_layout.show();
                            $ex_form_layout.show();
                            $ex_admin_form_layout.show();
                            $btn[0].onclick = () => {
                                location.reload();
                            };
                            $btn.text("隐藏其他设置版块");
                        };
                        $btn.mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                            .mouseleave((e) => { $(e.target).css("opacity", "1"); });
                        return $btn;
                    })()
                )
                .appendTo($("#ex-settings-data-debug"));

            $(`<div></div>`).append($(`<p></p>`).append(
                $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="border-color: rgb(231, 76, 60);background-color: rgb(231, 76, 60)">清除exlg数据</button>`).on("click", (e) => {
                    const $btn = $(e.target);
                    storage.clear();
                    window.location.href = "https://www.luogu.com.cn/";
                })
                    .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                    .mouseleave((e) => { $(e.target).css("opacity", "1"); })
            )).appendTo($("#ex-settings-data-debug"));

            $(`<p class="lfe-caption exlg-caption">当前版本为：${GM_info.script.version}</p>`)
                .append($(`<span>&nbsp;</span>`))
                .append(
                    $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(52, 152, 219);background-color: rgb(52, 152, 219)">更新日志</button>`).on("click", (e) => {
                        const $btn = $(e.target);
                        window.location.href = "https://www.luogu.com.cn/user/setting#update-log";
                        location.reload();
                    })
                        .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                ).appendTo($("#ex-settings-update-versions"));

            $(`<p class="lfe-caption exlg-caption">最新版本为：<text id="newest-version-display">${GM_info.script.version}</text></p>`)
                .append($(`<span>&nbsp;</span>`))
                .append(
                    $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(52, 152, 219);background-color: rgb(52, 152, 219)">检查更新</button>`).on("click", () => loader.runOne("@update"))
                        .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                ).appendTo($("#ex-settings-update-versions"));
            $(`<p class="lfe-caption exlg-caption">更新源</p>`).append($(`<span>&nbsp;</span>`))
                .append(
                    $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(231, 76, 60);background-color: rgb(231, 76, 60)">Raw</button>`).on("click", () => {
                        window.location.href = "https://github.com/optimize-2/extend-luogu/raw/main/extend-luogu.user.js";
                    })
                        .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                ).append($(`<span>&nbsp;</span>`)).append(
                    $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(52, 152, 219);background-color: rgb(52, 152, 219)">Jsdelivr</button>`).on("click", () => {
                        window.location.href = "https://cdn.jsdelivr.net/gh/optimize-2/extend-luogu@latest/extend-luogu.user.js";
                    })
                        .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                ).append($(`<span>&nbsp;</span>`)).append(
                    $(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(82, 196, 26);background-color: rgb(82, 196, 26)">FastGit</button>`).on("click", () => {
                        window.location.href = "https://hub.fastgit.org/optimize-2/extend-luogu/raw/main/extend-luogu.user.js";
                    })
                        .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                )
                .appendTo($("#ex-settings-update-versions"));
            $(`<p class="lfe-caption exlg-caption">项目有关</p>`).append(`<span>&nbsp;</span>`)
                .append(
                    $(`<a href="https://github.com/optimize-2/extend-luogu"></a>`).append($(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(0, 0, 0);background-color: rgb(0, 0, 0)">Github - 主站</button>`).on("click", () => {

                    })
                        .mouseenter((e) => { $(e.target).css("opacity", "0.8"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                    )
                ).append(`<span>&nbsp;</span>`)
                .append(
                    $(`<a href="https://www.luogu.com.cn/blog/100250/extend-luogu-si-yong-zhi-na"></a>`).append($(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(255, 193, 22);background-color: rgb(255, 193, 22)">Help</button>`).on("click", () => {

                    })
                        .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                    )
                ).append(`<span>&nbsp;</span>`)
                .append(
                    $(`<a href="https://github.com/bossbaby2005/extend-luogu"></a>`).append($(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(11, 45, 14);background-color: rgb(11, 45, 14)">Github - 分站</button>`).on("click", () => {

                    })
                        .mouseenter((e) => { $(e.target).css("opacity", "0.8"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                    )
                ).append(`<span>&nbsp;</span>`)
                .append(
                    $(`<a href="https://www.luogu.com.cn/paste/xdrs7184"></a>`).append($(`<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(191, 98, 10);background-color: rgb(191, 98, 10)">洛谷笔记文档</button>`).on("click", () => {

                    })
                        .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                        .mouseleave((e) => { $(e.target).css("opacity", "1"); })
                    )
                ).appendTo($("#ex-settings-update-versions"));
            /*    uindow.addEventListener("message", e => {
                log("Listening message:", e.data)
                if (e.data[0] !== "update") return
                e.data.shift()
                const
                    latest = e.data[0],
                    version = GM_info.script.version,
                    op = version_cmp(version, latest)
                $("#settings-newest-version").append($(`<text>${ latest }</text>`))
            })    */
        }
    });
});

loader.reg("discuss-save", "讨论保存", (conf) => {
    conf.match("www.luogu.com.cn/discuss/show/[1-9]\\d*");
    conf.setAlive(() => $("button[name='save-discuss']").length);
    const save_func = () => GM_xmlhttpRequest({
        method: "GET",
        url: `https://luogulo.gq/save.php?url=${window.location.href}`,
        onload: (res) => {
            if (res.status === 200) {
                log("Discuss saved");
            }
            else {
                log(`Fail: ${res}`);
            }
        },
        onerror: (err) => {
            log(`Error:${err}`);
        }
    });
    //am-btn-success
    conf.plugin(async () => {
        const $btn = $(`<button class="am-btn am-btn-success am-btn-sm" name="save-discuss">保存讨论</button>`).on("click", () => {
            $btn.prop("disabled", true);
            $btn.text("保存成功");
            save_func();
            setTimeout(() => {
                $btn.removeAttr("disabled");
                $btn.text("保存讨论");
            }, 1000);
        });
        const $btn2 = $(`<a href="https://luogulo.gq/show.php?url=${location.href}"><button class="am-btn am-btn-success am-btn-sm" name="save-discuss" style="border-color: rgb(255, 193, 22); background-color: rgb(255, 193, 22);color: #fff;">查看备份</button></a>`);
        $($(".am-u-md-4.lg-right").children().children().get(1)).append($btn).append($("<span>&nbsp;</span>")).append($btn2);
        if (await storage.discuss_auto_save !== 0) save_func();
    });
});

loader.reg("@update-log", "更新日志显示", (conf) => {
    conf.match("www.luogu.com.cn/.*");
    conf.plugin(async () => {
        if (await storage.exlg_last_used_version !== GM_info.script.version) {
            window.open("https://www.luogu.com.cn/user/setting#update-log");
            storage.exlg_last_used_version = GM_info.script.version;
        }
        else {
            log("The version is the lateset.");
        }
    });
});

loader.reg("dbc-jump", "双击题号跳题", (conf) => {
    conf.match("www.luogu.com.cn/.*");
    const judge_problem = (text) => {
        if (text.match(/AT[0-9]{1,4}/) === text) return true;
        if (text.match(/CF[0-9]{1,4}[A-Z][0-9]{0,1}/) === text) return true;
        if (text.match(/SP[0-9]{1,5}/) === text) return true;
        if (text.match(/P[0-9]{4}/) === text) return true;
        if (text.match(/UVA[0-9]{1,5}/) === text) return true;
        if (text.match(/U[0-9]{1,6}/) === text) return true;
        if (text.match(/T[0-9]{1,6}/) === text) return true;
        return false;
    };
    const jump = (event) => {
        const selection = window.getSelection();
        const selected = selection.toString().replace(" ", "").toUpperCase();
        let url;

        if (event.ctrlKey) {
            const myBlog = document.querySelectorAll(".ops>a[href*=blog]")[0];
            url = myBlog.href + "solution-";
        }
        else url = "https://www.luogu.com.cn/problem/";

        if (judge_problem(selected)) window.open(url + selected);
    };
    conf.plugin(() => {
        document.ondblclick = jump;
    });
});

loader.reg("notepad", "洛谷笔记", (conf) => {
    conf.match("www.luogu.com.cn/.*");
    conf.setAlive(() => $("#notepad-main-entry").length);
    const DBName = "Luogu Notepad",
        DBVer = 6;
    // save config
    const saveConfig = (config) => {
        $.ajax({
            type: "POST",
            url: `https://www.luogu.com.cn/paste/new`,
            beforeSend: (request) => {
                request.setRequestHeader(
                    "x-csrf-token",
                    $("meta[name='csrf-token']")[0].content
                );
            },
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify({
                public: false,
                data: "#lgnote" + JSON.stringify(config),
            }),
        });
    };

    // load config
    const loadConfig = () => {
        return new Promise((resolve, reject) => {
            $.get("https://www.luogu.com.cn/paste?_contentOnly").then((u) => {
                u = u.currentData.pastes.result;
                let nc = null;
                for (const i in u) {
                    try {
                        if (u[i].data.substr(0, 7) !== "#lgnote") continue;
                        const k = u[i].data;
                        nc = JSON.parse(k.substr(7, k.lentgh));
                        break;
                    }
                    catch (e) { }
                }
                resolve(nc);
            });
        });
    };
    conf.plugin(async () => {
        async function openDB(name, ver) {
            function _openDB(name, ver) {
                return new Promise((resolve, reject) => {
                    const req = window.indexedDB.open(name, ver);
                    req.onsuccess = (event) => {
                        resolve(event.target.result);
                    };
                    req.onerror = (event) => {
                        error(`Open IndexedDB Error!`);
                    };
                });
            }
            const [ndb] = (await window.indexedDB.databases()).filter((u) => u.name === "Luogu Notepad");
            let o, kdb;
            if (ndb && ndb.version !== ver) {
                log(`Notepad database need updating`);
                kdb = await _openDB(name, ndb.version);
                log(`Saving data`);
                o = JSON.stringify({ notes: await queryAll(null, kdb), pnotes: await queryAllPNote(null, kdb) });
            }
            return new Promise((resolve, reject) => {
                if (kdb) kdb.close();
                const req = window.indexedDB.open(name, ver);
                req.onsuccess = (event) => {
                    resolve(event.target.result);
                };
                req.onerror = (event) => {
                    error("Open IndexedDB Error!");
                    lgAlert(
                        "洛谷Notepad出错, 请到控制台-应用程序-IndexedDB里删除数据库`Luogu Notepad`后重试, 并在第一次重试时不要立即关闭标签页"
                    );
                };
                req.onupgradeneeded = (event) => {
                    log(`Updating notepad database...`);
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains("notes")) {
                        const notes = db.createObjectStore("notes", { keyPath: "pid" });
                        notes.createIndex("tag", "tag", { unique: false, multiEntry: true });
                    }
                    if (!db.objectStoreNames.contains("pnotes")) {
                        db.createObjectStore("pnotes", { keyPath: "tag" });
                    }
                    if (!db.objectStoreNames.contains("qnotes")) {
                        db.createObjectStore("qnotes", { keyPath: "id" });
                    }
                    if (!db.objectStoreNames.contains("ojinfo")) {
                        db.createObjectStore("ojinfo", { keyPath: "id" });
                    }
                    if (o)
                        importData(o, db);
                };
            });
        }

        function getTagLink(u) {
            if (!u.tag) return "";
            let tagp = "";
            for (const t of u.tag)
                tagp += `<a href="/?notepad&tag=${t}">${t}</a>&nbsp;&nbsp;`;
            return tagp;
        }

        const db = await openDB(DBName, DBVer);

        function queryTag(tag) {
            return new Promise((resolve, reject) => {
                const req = db
                    .transaction("notes", "readonly")
                    .objectStore("notes")
                    .index("tag")
                    .getAll(tag);
                req.onsuccess = (event) => {
                    resolve(req.result);
                };
            });
        }
        function queryAll(cond = null, ndb = null) {
            if (!ndb) ndb = db;
            return new Promise((resolve, reject) => {
                const req = ndb
                    .transaction("notes", "readonly")
                    .objectStore("notes")
                    .getAll(cond);
                req.onsuccess = (event) => {
                    resolve(req.result);
                };
            });
        }
        function queryPNote(tag) {
            return new Promise((resolve, reject) => {
                const req = db
                    .transaction("pnotes", "readonly")
                    .objectStore("pnotes")
                    .get(tag);
                req.onsuccess = (event) => {
                    resolve(req.result);
                };
            });
        }
        function queryOJ(pt) {
            return new Promise((resolve, reject) => {
                const req = db
                    .transaction("ojinfo", "readonly")
                    .objectStore("ojinfo")
                    .get(pt);
                req.onsuccess = (event) => {
                    resolve(req.result);
                };
            });
        }
        function queryAllOJ(cond) {
            return new Promise((resolve, reject) => {
                const req = db
                    .transaction("ojinfo", "readonly")
                    .objectStore("ojinfo")
                    .getAll(cond);
                req.onsuccess = (event) => {
                    resolve(req.result);
                };
            });
        }

        function queryAllPNote(cond = null, ndb = null) {
            if (!ndb) ndb = db;
            return new Promise((resolve, reject) => {
                const req = ndb
                    .transaction("pnotes", "readonly")
                    .objectStore("pnotes")
                    .getAll(cond);
                req.onsuccess = (event) => {
                    resolve(req.result);
                };
            });
        }

        async function importData(o, dbn = null) {
            if (!dbn) dbn = db;
            if (!o) return uindow._feInstance.$swalToastError("导入失败");
            if (o.notes)
                for (const u of o.notes)
                    dbn.transaction("notes", "readwrite").objectStore("notes").put(u);
            if (o.pnotes)
                for (const u of o.pnotes)
                    dbn.transaction("pnotes", "readwrite").objectStore("pnotes").put(u);
            uindow._feInstance
                .$swalToastSuccess("导入成功")
                .then(() => location.reload());
        }

        async function inject() {
            if (!/\/problem\/(U|T|P|CF|AT|SP|UVA)\d+[A-Z]*$/.test(location.pathname)) {
                return;
            }

            let code;

            const [pid] = window.location.pathname.split("/").slice(-1);

            $("section.main>section>div>div").prepend(
                `<details id="notepad-detail" open>
                <summary id="notepad-summary">笔记</summary>
                <div style="height:400px" id="notepad-container">
                    <div id="notepad-editor"></div>
                </div>
                <br />
                <div style="display:flex;justify-content:space-between;">
                    <div>
                        <label id="notepad-tag-label">标签</label>
                        <input data-v-a7f7c968="" type="text" class="lfe-form-sz-middle" style="width: 60%; display: none;" id="notepad-tag">
                        <label id="notepad-tag-content"></label>
                    </div>
                    <div>
                        <a id="notepad-opencode" href="javascript: void(0)"><svg data-v-29a65e17="" data-v-303bbf52="" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="edit" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="svg-inline--fa fa-edit fa-w-18"><path data-v-29a65e17="" data-v-303bbf52="" fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" class=""></path></svg></a>
                        <span id="notepad-code">代码</span>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <div>
                        <label>是否标记为重点:&nbsp;</label>
                        <input type="checkbox" id="notepad-important" />
                    </div>
                    <div>
                        <a id="notepad-import-solution" href="javascript: void(0)">导入题解</a>
                    </div>
                </div>
            </details>
            <style>.mp-editor-zone-full{width:100%!important;}</style>`
            );

            $("#notepad-opencode").click((event) => {
                window.open(
                    `/record/list?pid=${pid}&user=${uindow._feInstance.currentUser.uid}&scode`
                );
            });

            const editor = new MarkdownPalettes("#notepad-editor");
            $("#notepad-detail").removeAttr("open");

            $("#notepad-import-solution").click(async (event) => {
                const u = await getContent(`/problem/solution/${pid}`);
                editor.content = (editor.content || "") + u.currentData.solutions.result[0].content;
            });

            const req = db.transaction("notes", "readonly").objectStore("notes").get(pid);
            req.onsuccess = (event) => {
                if (req.result) {
                    editor.content = req.result.content;
                    $("#notepad-important").prop("checked", req.result.important);
                    const p = $("#notepad-summary").html();
                    $("#notepad-summary").html(`${p}<font color="red">*</font>`);
                    if (req.result.tag) $("#notepad-tag").val(req.result.tag.join(", "));
                    $("#notepad-tag-content").html(getTagLink(req.result));
                    if (req.result.code) {
                        $("#notepad-code").html(
                            `<a href="/record/${req.result.code}" target="_blank">代码</a>`
                        );
                    }
                    code = req.result.code;
                }
            };

            function saveNote() {
                const obj_store = db.transaction("notes", "readwrite").objectStore("notes");
                let q;
                if (editor.content || $("#notepad-tag").val())
                    q = obj_store.put({
                        pid,
                        content: editor.content,
                        tag: $("#notepad-tag")
                            .val()
                            .trim()
                            .split(",")
                            .map((u) => u.trim())
                            .filter((u) => u),
                        title: uindow._feInjection.currentData.problem.title,
                        code,
                        important: $("#notepad-important").prop("checked")
                    });
                else q = obj_store.delete(pid);
                q.onsuccess = (event) => {
                    uindow._feInstance.$swalToastSuccess("保存成功");
                };
            }

            $("#notepad-container").keydown(function (event) {
                if ((event.ctrlKey || event.metaKey) && event.which === 83) {
                    saveNote();
                    event.preventDefault();
                    return false;
                }
            });
            $("#notepad-tag").keydown(function (event) {
                if (
                    ((event.ctrlKey || event.metaKey) && event.which === 83) ||
                    event.keyCode === 13
                ) {
                    saveNote();
                    $("#notepad-tag").hide();
                    $("#notepad-tag-content").show();
                    const u = {
                        tag: $("#notepad-tag")
                            .val()
                            .trim()
                            .split(",")
                            .map((u) => u.trim())
                            .filter((u) => u),
                    };
                    $("#notepad-tag-content").html(getTagLink(u));
                    $("#notepad-tag").val(u.tag.join(", "));
                    event.preventDefault();
                    return false;
                }
            });
            $("#notepad-tag-label").click((event) => {
                $("#notepad-tag").show();
                $("#notepad-tag-content").hide();
            });
        }

        async function panel() {
            $("#app-old").html(`
    <div class="lg-index-content am-center">
        <div class="am-g">
            <div class="am-u-md-12">
                <div class="lg-article" id="notepad-content">
                </div>
            </div>
        </div>
    </div>`);

            const url = new URL(window.location.href);
            if (!url.searchParams.has("notepad")) return;
            async function renderProblem(u) {
                let pcode = "";
                if (u.code) pcode = `<a href="/record/${u.code}">代码</a>`;
                let link = `/problem/${u.pid}`;
                if (u.pid.includes("@")) {
                    const [pd, id] = u.pid.split("@");
                    link = `/?notepad&pedit&pid=${u.pid}&title=${u.title}`;
                    u.pid = id + pd;
                }
                return `
            <div style="display:flex;justify-content:flex-start;flex-direction:row;">
                <p><a href="${link}">${u.pid} - ${u.title}<font color="red">${u.important ? "*" : ""}</font></a></p>&nbsp;&nbsp;&nbsp;
                <details id="notepad-detail-${u.pid}"><summary>笔记</summary>
                    ${render(u.content)}<hr />
                    <div style="display:flex;justify-content:space-between;">
                        <p>标签: ${getTagLink(u)}</p>
                        ${pcode}
                    </div>
                </details>
            </div>
            `;
            }
            function renderPnote(u) {
                return `
            <div style="display:flex;justify-content:flex-start;flex-direction:row;">
                <p><a href="/?notepad&tag=${u.tag}">${u.tag}</a></p>&nbsp;&nbsp;&nbsp;
                <details><summary>笔记</summary>
                    ${render(u.content)}<hr />
                </details>
            </div>
            `;
            }
            if (url.searchParams.has("edit")) {
                const tag = url.searchParams.get("tag").trim();

                $("head > title").text(`编辑"${tag}"内容 | 洛谷笔记`);

                $("#notepad-content").html(
                    `<div style="height:700px;width:100%" id="notepad-container"><div id="notepad-editor"></div></div><style>.mp-editor-zone-full{width:100%!important;}</style>`
                );
                const editor = new MarkdownPalettes("#notepad-editor");
                const pres = await queryPNote(tag);
                if (pres) editor.content = pres.content;
                function saveNote() {
                    const obj_store = db
                        .transaction("pnotes", "readwrite")
                        .objectStore("pnotes");
                    let q;
                    if (editor.content)
                        q = obj_store.put({
                            tag,
                            content: editor.content,
                        });
                    else q = obj_store.delete(tag);
                    q.onsuccess = (event) => {
                        uindow._feInstance.$swalToastSuccess("保存成功");
                    };
                }
                $("#notepad-container").keydown(function (event) {
                    if ((event.ctrlKey || event.metaKey) && event.which === 83) {
                        saveNote();
                        event.preventDefault();
                        return false;
                    }
                });
            }
            else if (url.searchParams.has("pedit")) {
                const pid = url.searchParams.get("pid");
                let pt, pd;

                let p = "";

                if (pid) {
                    [pd] = pid.split("@").slice(0); [pt] = pid.split("@").slice(-1);
                    const { baseu, id } = await queryOJ(pt);
                    p += `<a target="_blank" href="${baseu.replace(/%s/, pd)}">${id}${pd} ${url.searchParams.get("title") ?? ""}</a><br /><hr />`;
                }


                p += `
                <div style="height:400px" id="notepad-container">
                    <div id="notepad-editor"></div>
                </div>
                <br />
                <div style="display:flex;justify-content:space-between;">
                    <div>
                        <label class="nt" id="notepad-tag-label">标签</label>
                        <input data-v-a7f7c968="" type="text" class="lfe-form-sz-middle" style="width: 60%; display: none;" id="notepad-tag">
                        <label id="notepad-tag-content"></label>
                    </div>
                    <!--div>
                        <a id="notepad-opencode" href="javascript: void(0)"><svg data-v-29a65e17="" data-v-303bbf52="" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="edit" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="svg-inline--fa fa-edit fa-w-18"><path data-v-29a65e17="" data-v-303bbf52="" fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" class=""></path></svg></a>
                        <span id="notepad-code">代码</span>
                    </div-->
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <div>
                        <label class="nt">是否标记为重点:&nbsp;</label>
                        <input type="checkbox" id="notepad-important" />
                    </div>
                </div>
            <style>.mp-editor-zone-full{width:100%!important;}label.nt{font-weight:normal}</style>`;

                $("#notepad-content").html(p);

                const editor = new MarkdownPalettes("#notepad-editor");

                const req = db.transaction("notes", "readonly").objectStore("notes").get(pid);
                req.onsuccess = (event) => {
                    if (req.result) {
                        editor.content = req.result.content;
                        $("#notepad-important").prop("checked", req.result.important);
                        if (req.result.tag) $("#notepad-tag").val(req.result.tag.join(", "));
                        $("#notepad-tag-content").html(getTagLink(req.result));
                    }
                };

                function saveNote() {
                    const obj_store = db.transaction("notes", "readwrite").objectStore("notes");
                    let q;
                    if (editor.content || $("#notepad-tag").val())
                        q = obj_store.put({
                            pid,
                            content: editor.content,
                            tag: $("#notepad-tag")
                                .val()
                                .trim()
                                .split(",")
                                .map((u) => u.trim())
                                .filter((u) => u),
                            title: url.searchParams.get("title"),
                            code: null,
                            important: $("#notepad-important").prop("checked")
                        });
                    else q = obj_store.delete(pid);
                    q.onsuccess = (event) => {
                        uindow._feInstance.$swalToastSuccess("保存成功");
                    };
                }

                $("#notepad-container").keydown(function (event) {
                    if ((event.ctrlKey || event.metaKey) && event.which === 83) {
                        saveNote();
                        event.preventDefault();
                        return false;
                    }
                });
                $("#notepad-tag").keydown(function (event) {
                    if (
                        ((event.ctrlKey || event.metaKey) && event.which === 83) ||
                    event.keyCode === 13
                    ) {
                        saveNote();
                        $("#notepad-tag").hide();
                        $("#notepad-tag-content").show();
                        const u = {
                            tag: $("#notepad-tag")
                                .val()
                                .trim()
                                .split(",")
                                .map((u) => u.trim())
                                .filter((u) => u),
                        };
                        $("#notepad-tag-content").html(getTagLink(u));
                        $("#notepad-tag").val(u.tag.join(", "));
                        event.preventDefault();
                        return false;
                    }
                });
                $("#notepad-tag-label").click((event) => {
                    $("#notepad-tag").show();
                    $("#notepad-tag-content").hide();
                });
            }
            else if (url.searchParams.has("tag")) {
                const tag = url.searchParams.get("tag").trim();
                let res = await queryTag(tag);

                $("head > title").text(`标签"${tag}" | 洛谷笔记`);

                if (tag === "无") {
                    res = await queryAll();
                    res = res.filter((u) => !u.tag.length || u.tag.includes("无"));
                }

                let p = `${tag}&nbsp;&nbsp;<a href="/?notepad&tag=${tag}&edit" target="_blank"><svg data-v-29a65e17="" data-v-303bbf52="" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="edit" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="svg-inline--fa fa-edit fa-w-18"><path data-v-29a65e17="" data-v-303bbf52="" fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" class=""></path></svg></a><hr/>`;

                const pres = await queryPNote(tag);

                if (pres) p += `<div>${render(pres.content)}</div><hr/>`;

                res.sort((u, v) => {
                    if ((u.important && v.important) || (!u.important && !v.important)) return u.pid < v.pid ? -1 : 1;
                    return u.important ? -1 : 1;
                });

                for (const u of res) p += await renderProblem(u);

                $("#notepad-content").html(p);
            }
            else if (url.searchParams.has("ojedit")) {
                let p = "";

                p += `<div><input placeholder="输入OJ名称@地址" id="notepad-oj-name"/></div><br /><hr />`;

                const o = await queryAllOJ();
                for (const u of o) p += `<span>${u.id}:${u.baseu}</span><br />`;

                $("#notepad-content").html(p);

                $("#notepad-oj-name").keydown(function (event) {
                    if (
                        ((event.ctrlKey || event.metaKey) && event.which === 83) ||
                    event.keyCode === 13
                    ) {
                        const [id, baseu] = $("#notepad-oj-name").val().trim().split("@");
                        const obs = db.transaction("ojinfo", "readwrite").objectStore("ojinfo");
                        const q = obs.put({ id, baseu });
                        q.onsuccess = (event) => {
                            uindow._feInstance.$swalToastSuccess("保存成功").then(() => uindow.reload());
                        };
                        event.preventDefault();
                        return false;
                    }
                });
            }
            else {
                $("head > title").text("主页 | 洛谷笔记");

                const res = await queryAll();
                let p = "";
                const cnt = {};
                const list = [];
                for (const u of res) {
                    if (!u.tag) return;
                    if (u.tag.length === 0) u.tag.push("无");
                    for (const t of u.tag) {
                        if (!cnt[t]) cnt[t] = 0;
                        ++cnt[t];
                    }
                }
                for (const i in cnt) list.push([i, cnt[i]]);

                p += `<div><input id="notepad-new-otheroj" placeholder="记录一道其他OJ的题目, pid@oj:title" /></div><br /><hr />`;

                const pnotes = await queryAllPNote();
                for (const u of pnotes) p += renderPnote(u);

                p += `<hr /><div><canvas id="notepad-wordcloud" width="2300px" height="1200px" style="width:100%;height:600px;"></canvas></div><hr />`;

                // for (const u of res) {
                //     if (u.important)
                //         p += renderProblem(u);
                // }

                p += "<br /><hr /><br />";

                p += `<div style="display:flex;margin-top: 6px;margin-bottom: 6px;"><a href="#" id="notepad-dump"><button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: border-color: rgb(82, 196, 26);background-color: rgb(82, 196, 26)">导出</button></a>&nbsp;<input type="file" id="notepad-import"/><a href="#" id="notepad-import-submit">&nbsp;<button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(231, 76, 60);background-color: rgb(231, 76, 60)">导入</button></a></div>`;
                p += `<div style="display:flex;margin-top: 6px;margin-bottom: 6px;"><a href="#" id="notepad-dump-cloud"><button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(255, 193, 22);background-color: rgb(255, 193, 22)">保存到云剪贴板</button></a>&nbsp;<a href="#" id="notepad-import-cloud"><button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(52, 152, 219);background-color: rgb(52, 152, 219)">从云剪贴板读取</button></a></div>`;
                p += `<div style="margin-top: 6px;margin-bottom: 6px;"><a href="https://www.luogu.com.cn/paste/xdrs7184"><button type="button" class="lfe-form-sz-middle exlg-btn" style="font-family: Microsoft YaHei;border-color: rgb(200, 200, 200);background-color: rgb(200, 200, 200)">文档在此</button></a></div>`;

                $("#notepad-content").html(p);

                $(".am-u-md-12").find("button")
                    .mouseenter((e) => { $(e.target).css("opacity", "0.9"); })
                    .mouseleave((e) => { $(e.target).css("opacity", "1"); });

                const d = document.getElementById("notepad-dump");
                const o = JSON.stringify({ notes: res, pnotes: await queryAllPNote() });

                d.download = "LuoguNotepad-dump.json";
                d.href = URL.createObjectURL(new Blob([o]));

                $("#notepad-new-otheroj").keydown(function (event) {
                    if (
                        ((event.ctrlKey || event.metaKey) && event.which === 83) ||
                    event.keyCode === 13
                    ) {
                        const [p, t] = $("#notepad-new-otheroj").val().split(":");
                        window.open(`/?notepad&pedit&pid=${p}&title=${t}`);
                        event.preventDefault();
                        return false;
                    }
                });

                $("#notepad-import-submit").click((event) => {
                    const files = document.getElementById("notepad-import").files;
                    if (files.length) {
                        const file = files[0];
                        const reader = new FileReader();
                        if (/json+/.test(file.type)) {
                            reader.onload = function () {
                                const o = JSON.parse(this.result);
                                importData(o);
                            };
                            reader.readAsText(file);
                        }
                    }
                });
                $("#notepad-dump-cloud").click(async (event) => {
                    saveConfig({ notes: res, pnotes: await queryAllPNote() });
                    uindow._feInstance.$swalToastSuccess("保存成功");
                });
                $("#notepad-import-cloud").click(async (event) => {
                    const o = await loadConfig();
                    importData(o);
                });

                WordCloud(document.getElementById("notepad-wordcloud"), {
                    list,
                    backgroundColor: "#fafafa",
                    gridSize: Math.round((16 * $("canvas").width()) / 1024),
                    weightFactor: function (size) {
                        return (Math.pow(size, 0.4) * $("canvas").width()) / 25;
                    },
                    rotateStep: 2,
                    rotateRatio: 0.2,
                    fontFamily: "Microsoft YaHei",
                    shuffle: true,
                    click: (item) => {
                        window.open(`/?notepad&tag=${item[0]}`);
                    },
                });
            }
        }

        function entry() {
            $("nav.lfe-body").append(
                `<a id="notepad-main-entry" data-v-303bbf52="" data-v-cd9b963e="" data-v-1316252e="" href="/?notepad" colorscheme="none" class="color-none" data-v-27b2cd59="" style="color: inherit;"><span data-v-cd9b963e="" data-v-303bbf52="" class="icon"><svg data-v-4b8033a4="" data-v-303bbf52="" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="edit" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="svg-inline--fa fa-edit fa-w-18"><path data-v-4b8033a4="" data-v-303bbf52="" fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" class=""></path></svg></span> <span data-v-cd9b963e="" data-v-303bbf52="" class="text">
      Note
    </span></a>`
            );
        }

        async function select() {
            function queryPid(pid) {
                return new Promise((resolve, reject) => {
                    const q = db
                        .transaction("notes", "readwrite")
                        .objectStore("notes")
                        .get(pid);
                    q.onsuccess = (event) => {
                        resolve(q.result);
                    };
                });
            }

            // uindow.history.pushState = uindow.history.replaceState = null

            const url = new URL(window.location.href);
            const pid = url.searchParams.get("pid");
            $("a.status-link").click(async (u) => {
                u.preventDefault();
                const [code] = u.currentTarget.href.split("/").slice(-1);
                const orig = (await queryPid(pid)) || { pid };
                const q = db
                    .transaction("notes", "readwrite")
                    .objectStore("notes")
                    .put(Object.assign(orig, { code }));
                q.onsuccess = (event) => {
                    uindow.close();
                };
                return false;
            });
        }
        // unsafeWindow.MarkdownPalettes = MarkdownPalettes;
        // unsafeWindow.WordCloud = WordCloud;
        // unsafeWindow.hljs = hljs;
        (function inj() {
            const url = new URL(window.location.href);
            setTimeout(entry, 0);
            if (url.pathname.includes("problem")) setTimeout(inject, 0);
            else if (url.searchParams.has("notepad")) setTimeout(panel, 0);
            else if (url.pathname.includes("record") && url.searchParams.has("scode"))
                setTimeout(select, 0);
            // setTimeout(() => {
            //     $("pre").each((u, v) => {
            //         hljs.highlightBlock(v)
            //     })
            // }, 400)
        })();
    });
});

loader.reg("submission-color", "记录难度可视化", (conf) => {
    conf.match("www.luogu.com.cn/record/list.*");

    conf.setAlive(() => [0, 1, 2, 3, 4, 5, 6, 7].some((u) => $(`.exlg-difficulty-color-${u}`).length));

    conf.plugin(async () => {
        const u = await getContent(window.location.href);

        const dif = u.currentData.records.result.map((u) => u.problem.difficulty);
        $("div.problem>div>a>span.pid").each((u, v) => { $(v).addClass(`exlg-difficulty-color-${dif[u]}`); });
    });

    conf.addStyle(`
    .exlg-difficulty-color-0{ color: rgb(191, 191, 191)!important;font-weight: bold; }
    .exlg-difficulty-color-1{ color: rgb(254, 76, 97)!important;font-weight: bold; }
    .exlg-difficulty-color-2{ color: rgb(243, 156, 17)!important;font-weight: bold; }
    .exlg-difficulty-color-3{ color: rgb(255, 193, 22)!important;font-weight: bold; }
    .exlg-difficulty-color-4{ color: rgb(82, 196, 26)!important;font-weight: bold; }
    .exlg-difficulty-color-5{ color: rgb(52, 152, 219)!important;font-weight: bold; }
    .exlg-difficulty-color-6{ color: rgb(157, 61, 207)!important;font-weight: bold; }
    .exlg-difficulty-color-7{ color: rgb(14, 29, 105)!important;font-weight: bold; }
    `);
});

uindow.console.info = function () {
    const newEvent = console.info.apply(this, arguments);
    if (arguments[0] === "[@lfe/loader]")
        window.dispatchEvent(new Event("lfeloaded"));
    return newEvent;
};

async function injectLuogu() {
    if (!/luogu.[com.cn|org]/.test(window.location.href)) return;
    await sleep(200);

    if ($("pre:has(> code):not([exlg-copy-code-block=''])").length) {
        console.log($("pre:has(> code):not([exlg-copy-code-block=''])")[0]);
        loader.runOne("copy-code-block");
    }

    if ($("#exlg-nav-icon").length || !$("main.lfe-body").html()) return;

    loader.run();
    log("injected");
}
function injectSpringboard() {
    if (window.location.host !== "www.bilibili.com" &&
        window.location.host !== "service-psscsax9-1305163805.sh.apigw.tencentcs.com" &&
        window.location.host !== "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com") return;

    loader.run();
    log("injected");
}
window.addEventListener("lfeloaded", injectLuogu);
setTimeout(injectLuogu, 400);
injectSpringboard();

log("Lauching");
log(GM_listValues());

Object.assign(uindow, {
    exlg: { loader, log, error },
    $$: $, xss, version_cmp
});

log(loader);

