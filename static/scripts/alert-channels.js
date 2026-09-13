(function () {
    "use strict";

    var API_BASE = "https://xon-api-test.xposedornot.com";
    var SECRET_MASK = "••••••••••••••••";
    var BLOCKED_HEADERS = ["host", "content-type", "content-length", "transfer-encoding", "connection", "keep-alive", "upgrade", "te", "trailer", "expect"];

    var EN = {
        cardTitle: "Alert channels",
        cardIntro: "Get new-breach alerts for every domain you have verified in Slack, Microsoft Teams, or your own webhook. One setup covers all your domains.",
        guideBtn: "Setup guide",
        fab: "Setup guide",
        checking: "Checking",
        notConnected: "Not connected",
        pending: "Code sent",
        connected: "Connected",
        disabled: "Paused",
        unavailable: "Unavailable",
        connect: "Connect",
        enterCode: "Enter code",
        manage: "Manage",
        reconnect: "Reconnect",
        close: "Close",
        howToUrl: "How do I get this URL?",
        backToSetup: "Back to setup",
        slack: "Slack",
        teams: "Microsoft Teams",
        webhook: "Webhook",
        slackDesc: "Breach alerts posted to a Slack channel.",
        teamsDesc: "Breach alerts posted to a Teams channel.",
        webhookDesc: "Signed JSON alerts posted to your own endpoint.",
        pendingMeta: "A verification code was sent. Enter it to finish.",
        pausedMeta: "Paused after repeated delivery failures. Reconnect to resume.",
        connectedMeta: "Alerts on for all verified domains.",
        sessionError: "Your session has expired. Open this page again from the dashboard.",
        noDomainError: "Verify at least one domain first, then come back to connect a channel.",
        rateLimit: "Too many attempts. Wait a minute and try again.",
        serverError: "Something went wrong on our side. Please try again in a moment.",
        networkError: "Could not reach the API. Check your connection and try again.",
        badCode: "That code did not match. Check the channel and try again.",
        alreadyConnected: "This channel is already connected. Remove it first to use a different URL.",
        urlRequired: "Paste the webhook URL first.",
        urlBadSlack: "That does not look like a Slack incoming webhook URL. It should start with https://hooks.slack.com/services/",
        urlBadTeams: "That does not look like a Teams workflow or webhook URL. It should come from webhook.office.com, api.powerplatform.com, or outlook.office.com.",
        urlBadWebhook: "Enter a public https:// URL, up to 2048 characters.",
        headerBad: "Header names must be plain tokens and cannot be one of the reserved names.",
        headerTooMany: "You can add up to 10 custom headers.",
        codeRequired: "Enter the 8-character code.",
        sent: "Verification code sent. Check the channel and enter the code below.",
        sentWebhook: "Verification payload sent to your endpoint. Read the verification_code from the request body in your logs and enter it below.",
        verified: "Channel verified. Breach alerts for all your verified domains will now be delivered here.",
        deleted: "Channel removed.",
        rotated: "Signing secret rotated. The previous secret keeps working during the grace window.",
        urlLabel: "Webhook URL",
        urlHelpSlack: "Starts with https://hooks.slack.com/services/. The verification code is posted to that channel.",
        urlHelpTeams: "The HTTP POST URL from your Teams workflow. The verification code is posted to that channel as a card.",
        urlHelpWebhook: "Public HTTPS endpoint that accepts POST JSON. We will send a signed verification request to it.",
        headersLabel: "Custom headers (optional)",
        headersHelp: "Sent with every delivery, for example an Authorization header. Values are stored encrypted and never shown again.",
        headerName: "Header name",
        headerValue: "Value",
        addHeader: "Add header",
        removeHeader: "Remove header",
        connectBtn: "Connect",
        connecting: "Connecting",
        codeLabel: "Verification code",
        codeHelp: "8 characters, letters and numbers, from the message we just sent.",
        verifyBtn: "Verify",
        verifying: "Verifying",
        resend: "Send a new code",
        resendWebhook: "Send the verification request again",
        secretTitle: "Copy your signing secret now",
        secretIntro: "This is the only time it is shown. Use it to verify the X-XON-Signature header on every delivery.",
        secretAck: "I have stored this secret somewhere safe",
        reveal: "Reveal",
        hide: "Hide",
        copy: "Copy",
        copied: "Copied",
        continueBtn: "Continue to verification",
        secretLeave: "You have not confirmed that you saved the secret. It cannot be shown again. Close anyway?",
        endpoint: "Endpoint",
        status: "Status",
        since: "Connected since",
        headersSet: "Custom headers",
        failures: "Recent failures",
        lastError: "Last error",
        none: "None",
        replaceUrl: "Change URL",
        replaceHelp: "Changing the URL disconnects the current channel and starts a fresh verification.",
        rotate: "Rotate signing secret",
        rotateHelp: "Issues a new secret and shows it once. The old secret keeps working for a short grace window so you can switch without missing alerts.",
        rotateConfirm: "Rotate the signing secret now? The new secret is shown only once.",
        remove: "Remove channel",
        removeHelp: "Stops alerts to this channel. You can connect it again at any time.",
        removeConfirm: "Remove this channel? Alerts will stop until you connect it again.",
        replaceConfirm: "Change the URL? The current channel is removed and a new verification starts.",
        pausedTitle: "Deliveries paused",
        pausedBody: "We stopped sending after 10 failed deliveries in a row. Fix the endpoint, then reconnect to send a new verification and resume alerts.",
        working: "Working",
        guideTitle: "Setup guide",
        guideIntro: "Pick a channel to see how to get its URL and what to expect."
    };

    var T = EN;
    if (window.XON_CHANNELS_I18N && typeof window.XON_CHANNELS_I18N === "object") {
        T = {};
        Object.keys(EN).forEach(function (k) {
            T[k] = window.XON_CHANNELS_I18N[k] || EN[k];
        });
    }

    var PLATFORMS = {
        slack: {
            label: T.slack,
            desc: T.slackDesc,
            icon: "fab fa-slack",
            urlHelp: T.urlHelpSlack,
            urlBad: T.urlBadSlack,
            placeholder: "https://hooks.slack.com/services/T000/B000/XXXX",
            test: function (u) { return /^https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+$/.test(u); }
        },
        teams: {
            label: T.teams,
            desc: T.teamsDesc,
            icon: "fab fa-microsoft",
            urlHelp: T.urlHelpTeams,
            urlBad: T.urlBadTeams,
            placeholder: "https://tenant.webhook.office.com/webhookb2/... or https://....api.powerplatform.com/...",
            test: function (u) { return /^https:\/\/(outlook\.office\.com\/webhook\/|[a-z0-9.-]+\.webhook\.office\.com\/webhookb2\/|[a-z0-9.-]+\.api\.powerplatform\.com\/)/i.test(u); }
        },
        webhook: {
            label: T.webhook,
            desc: T.webhookDesc,
            icon: "fas fa-plug",
            urlHelp: T.urlHelpWebhook,
            urlBad: T.urlBadWebhook,
            placeholder: "https://hooks.example.org/xposedornot",
            headers: true,
            secret: true,
            test: function (u) { return /^https:\/\/[^\s]+$/.test(u) && u.length <= 2048; }
        }
    };

    var state = { slack: null, teams: null, webhook: null };
    var mountEl = null;
    var drawer = null;
    var backdrop = null;
    var lastFocus = null;
    var current = { platform: null, view: null, secret: null, secretAck: false, mode: null };

    function creds() {
        var s = window.XonSession;
        if (!s || !s.token || !s.email) return null;
        return { email: String(s.email).toLowerCase().trim(), token: s.token };
    }

    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function el(html) {
        var t = document.createElement("template");
        t.innerHTML = html.trim();
        return t.content.firstElementChild;
    }

    function fmtDate(iso) {
        if (!iso) return "";
        var d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }

    function maskUrl(u) {
        if (!u) return "";
        if (u.length <= 28) return u;
        return u.slice(0, 22) + "…" + u.slice(-6);
    }

    function call(platform, route, body) {
        var c = creds();
        if (!c) return Promise.reject({ status: 401, detail: T.sessionError });
        var payload = Object.assign({}, body || {}, { email: c.email, token: c.token });
        return fetch(API_BASE + "/v1/" + platform + "/" + route, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(function (res) {
            return res.text().then(function (txt) {
                var data = {};
                try { data = txt ? JSON.parse(txt) : {}; } catch (e) { data = {}; }
                if (res.ok) return data;
                var detail = data && data.detail ? String(data.detail) : "";
                throw { status: res.status, detail: detail };
            });
        }, function () {
            throw { status: 0, detail: T.networkError };
        });
    }

    function friendly(err, platform) {
        var s = err && err.status;
        var d = (err && err.detail) || "";
        if (s === 0) return T.networkError;
        if (s === 401) return T.sessionError;
        if (s === 403 && /verification code/i.test(d)) return T.badCode;
        if (s === 403 && /verified domain/i.test(d)) return T.noDomainError;
        if (s === 403) return d || T.noDomainError;
        if (s === 409) return T.alreadyConnected;
        if (s === 429) return T.rateLimit;
        if (s >= 500) return T.serverError;
        if (s === 404) return d || T.serverError;
        if (s === 400 && /Invalid .* webhook URL format/i.test(d)) return PLATFORMS[platform].urlBad;
        return d || T.serverError;
    }

    function classify(cfg) {
        if (!cfg) return "none";
        if (cfg.verified && cfg.active) return "connected";
        if (cfg.verified && !cfg.active) return "disabled";
        return "pending";
    }

    function loadConfig(platform) {
        return call(platform, "config", {}).then(function (cfg) {
            state[platform] = { kind: classify(cfg), cfg: cfg };
        }, function (err) {
            if (err.status === 404) {
                state[platform] = { kind: "none", cfg: null };
            } else {
                state[platform] = { kind: "error", cfg: null, error: friendly(err, platform), status: err.status };
            }
        });
    }

    function loadAll() {
        return Promise.all(Object.keys(PLATFORMS).map(loadConfig));
    }

    function renderCard() {
        if (!mountEl) return;
        mountEl.innerHTML = "";
        var card = el(
            '<section class="xch-card" aria-labelledby="xch-card-title">' +
            '<div class="xch-card-head"><div><h3 id="xch-card-title">' + esc(T.cardTitle) + '</h3><p>' + esc(T.cardIntro) + '</p></div>' +
            '<button type="button" class="xch-btn xch-btn-quiet" data-xch-guide><i class="fas fa-book-open" aria-hidden="true"></i> ' + esc(T.guideBtn) + '</button></div>' +
            '<ul class="xch-rows" role="list"></ul></section>'
        );
        var list = card.querySelector(".xch-rows");
        Object.keys(PLATFORMS).forEach(function (p) {
            list.appendChild(renderRow(p));
        });
        card.querySelector("[data-xch-guide]").addEventListener("click", function () {
            openDrawer("slack", "guide");
        });
        mountEl.appendChild(card);
    }

    function renderRow(p) {
        var meta = PLATFORMS[p];
        var st = state[p];
        var chipCls = "xch-chip";
        var chipTxt = T.checking;
        var rowMeta = meta.desc;
        var action = null;
        if (st) {
            if (st.kind === "connected") { chipCls += " xch-chip-ok"; chipTxt = T.connected; rowMeta = T.connectedMeta; action = { label: T.manage, quiet: true }; }
            else if (st.kind === "pending") { chipCls += " xch-chip-warn"; chipTxt = T.pending; rowMeta = T.pendingMeta; action = { label: T.enterCode }; }
            else if (st.kind === "disabled") { chipCls += " xch-chip-bad"; chipTxt = T.disabled; rowMeta = T.pausedMeta; action = { label: T.reconnect }; }
            else if (st.kind === "error") { chipCls += " xch-chip-bad"; chipTxt = T.unavailable; rowMeta = st.error; }
            else { chipTxt = T.notConnected; action = { label: T.connect }; }
        }
        var row = el(
            '<li class="xch-row" data-platform="' + p + '">' +
            '<div class="xch-row-icon" aria-hidden="true"><i class="' + meta.icon + '"></i></div>' +
            '<div class="xch-row-text"><span class="xch-row-label">' + esc(meta.label) + '</span><span class="xch-row-meta">' + esc(rowMeta) + '</span></div>' +
            '<span class="' + chipCls + '" role="status">' + esc(chipTxt) + '</span>' +
            (action ? '<button type="button" class="xch-btn' + (action.quiet ? " xch-btn-quiet" : "") + '" data-xch-open="' + p + '">' + esc(action.label) + '<span class="xch-sr-only"> ' + esc(meta.label) + '</span></button>' : "") +
            '</li>'
        );
        var btn = row.querySelector("[data-xch-open]");
        if (btn) {
            btn.addEventListener("click", function () {
                var kind = state[p] ? state[p].kind : "none";
                var view = kind === "connected" ? "manage" : kind === "pending" ? "verify" : "setup";
                openDrawer(p, view);
            });
        }
        return row;
    }

    function refreshRow(p) {
        if (!mountEl) return;
        var old = mountEl.querySelector('.xch-row[data-platform="' + p + '"]');
        if (old) old.replaceWith(renderRow(p));
    }

    function ensureDrawer() {
        if (drawer) return;
        backdrop = el('<div class="xch-backdrop" hidden></div>');
        drawer = el(
            '<aside class="xch-drawer" role="dialog" aria-modal="true" aria-labelledby="xch-drawer-title" hidden>' +
            '<header class="xch-drawer-head"><div class="xch-drawer-icon" aria-hidden="true"><i></i></div>' +
            '<div><h2 id="xch-drawer-title"></h2><p class="xch-drawer-sub"></p></div>' +
            '<button type="button" class="xch-close" aria-label="' + esc(T.close) + '">&times;</button></header>' +
            '<div class="xch-drawer-body"><div class="xch-pane xch-pane-flow"></div><div class="xch-pane xch-pane-guide xch-guide"></div></div></aside>'
        );
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener("click", requestClose);
        drawer.querySelector(".xch-close").addEventListener("click", requestClose);
        drawer.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { e.preventDefault(); requestClose(); return; }
            if (e.key !== "Tab") return;
            var items = drawer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            var visible = Array.prototype.filter.call(items, function (n) { return n.offsetParent !== null; });
            if (!visible.length) return;
            var first = visible[0];
            var last = visible[visible.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }

    function openDrawer(platform, view) {
        ensureDrawer();
        lastFocus = document.activeElement;
        current = { platform: platform, view: view, secret: null, secretAck: false, mode: view === "guide" ? "guide" : "flow" };
        drawer.classList.toggle("xch-mode-guide", current.mode === "guide");
        drawer.classList.remove("xch-show-guide");
        renderDrawer();
        backdrop.hidden = false;
        drawer.hidden = false;
        document.body.classList.add("xch-locked");
        requestAnimationFrame(function () {
            drawer.classList.add("xch-open");
            var first = drawer.querySelector(".xch-pane-flow input") || drawer.querySelector(".xch-pane-flow .xch-btn:not(.xch-guide-toggle), .xch-tab");
            (first || drawer.querySelector(".xch-close")).focus();
        });
    }

    function requestClose() {
        if (current.view === "secret" && !current.secretAck) {
            if (!window.confirm(T.secretLeave)) return;
        }
        closeDrawer();
    }

    function closeDrawer() {
        if (!drawer) return;
        current.secret = null;
        drawer.classList.remove("xch-open");
        drawer.hidden = true;
        backdrop.hidden = true;
        document.body.classList.remove("xch-locked");
        drawer.querySelector(".xch-pane-flow").innerHTML = "";
        drawer.querySelector(".xch-pane-guide").innerHTML = "";
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    function setHead(platform, title, sub) {
        var meta = PLATFORMS[platform];
        drawer.setAttribute("data-platform", platform);
        drawer.querySelector(".xch-drawer-icon i").className = current.mode === "guide" ? "fas fa-book-open" : meta.icon;
        drawer.querySelector("#xch-drawer-title").textContent = title;
        drawer.querySelector(".xch-drawer-sub").textContent = sub || "";
    }

    function renderDrawer() {
        var p = current.platform;
        var flow = drawer.querySelector(".xch-pane-flow");
        var guide = drawer.querySelector(".xch-pane-guide");
        flow.innerHTML = "";
        guide.innerHTML = "";
        if (current.mode === "guide") {
            setHead(p, T.guideTitle, T.guideIntro);
            renderGuide(guide, p, true);
            return;
        }
        var meta = PLATFORMS[p];
        var v = current.view;
        if (v === "setup") { setHead(p, T.connect + " " + meta.label, meta.desc); renderSetup(flow, p); }
        else if (v === "verify") { setHead(p, T.enterCode, meta.label); renderVerify(flow, p); }
        else if (v === "secret") { setHead(p, T.secretTitle, meta.label); renderSecret(flow, p); }
        else if (v === "manage") { setHead(p, meta.label, T.connectedMeta); renderManage(flow, p); }
        renderGuide(guide, p, false);
    }

    function guideToggle() {
        var b = el('<button type="button" class="xch-btn xch-btn-quiet xch-btn-sm xch-guide-toggle" aria-expanded="false"><i class="fas fa-question-circle" aria-hidden="true"></i> ' + esc(T.howToUrl) + '</button>');
        b.addEventListener("click", function () {
            var on = drawer.classList.toggle("xch-show-guide");
            b.setAttribute("aria-expanded", on ? "true" : "false");
        });
        return b;
    }

    function backFromGuide() {
        var b = el('<button type="button" class="xch-btn xch-btn-quiet xch-btn-sm xch-guide-toggle"><i class="fas fa-arrow-left" aria-hidden="true"></i> ' + esc(T.backToSetup) + '</button>');
        b.addEventListener("click", function () {
            drawer.classList.remove("xch-show-guide");
            var t = drawer.querySelector(".xch-pane-flow .xch-guide-toggle");
            if (t) { t.setAttribute("aria-expanded", "false"); t.focus(); }
        });
        return b;
    }

    function msgBox() {
        return el('<div class="xch-msg" role="alert" aria-live="assertive"></div>');
    }

    function setMsg(box, text, kind) {
        box.className = "xch-msg" + (kind ? " xch-msg-" + kind : "");
        box.textContent = text || "";
    }

    function busy(btn, on, label) {
        btn.disabled = on;
        btn.textContent = on ? label + "…" : btn.getAttribute("data-label");
    }

    function headerEditor() {
        var wrap = el('<div class="xch-field"><span class="xch-label" id="xch-headers-label">' + esc(T.headersLabel) + '</span><div class="xch-headers" role="group" aria-labelledby="xch-headers-label"></div><button type="button" class="xch-btn xch-btn-quiet xch-btn-sm" data-add><i class="fas fa-plus" aria-hidden="true"></i> ' + esc(T.addHeader) + '</button><span class="xch-help">' + esc(T.headersHelp) + '</span></div>');
        var rows = wrap.querySelector(".xch-headers");
        function addRow() {
            if (rows.children.length >= 10) return;
            var r = el('<div class="xch-header-row"><input class="xch-input" type="text" aria-label="' + esc(T.headerName) + '" placeholder="Authorization" maxlength="128" autocomplete="off"><input class="xch-input" type="text" aria-label="' + esc(T.headerValue) + '" placeholder="Bearer ..." maxlength="1024" autocomplete="off" data-hj-suppress><button type="button" class="xch-btn xch-btn-quiet xch-btn-sm" aria-label="' + esc(T.removeHeader) + '"><i class="fas fa-times" aria-hidden="true"></i></button></div>');
            r.querySelector("button").addEventListener("click", function () { r.remove(); });
            rows.appendChild(r);
            r.querySelector("input").focus();
        }
        wrap.querySelector("[data-add]").addEventListener("click", addRow);
        wrap.collect = function () {
            var out = {};
            var count = 0;
            var bad = null;
            Array.prototype.forEach.call(rows.querySelectorAll(".xch-header-row"), function (r) {
                var inputs = r.querySelectorAll("input");
                var name = inputs[0].value.trim();
                var val = inputs[1].value;
                if (!name && !val) return;
                count += 1;
                var lower = name.toLowerCase();
                if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) || BLOCKED_HEADERS.indexOf(lower) !== -1 || lower.indexOf("x-xon-") === 0 || /[\r\n]/.test(val)) bad = T.headerBad;
                out[name] = val;
            });
            if (count > 10) bad = T.headerTooMany;
            return { headers: out, count: count, error: bad };
        };
        return wrap;
    }

    function renderSetup(flow, p, opts) {
        opts = opts || {};
        var meta = PLATFORMS[p];
        var st = state[p];
        var box = msgBox();
        flow.appendChild(guideToggle());
        if (st && st.kind === "disabled") {
            flow.appendChild(el('<div class="xch-msg xch-msg-warn"><strong>' + esc(T.pausedTitle) + '.</strong> ' + esc(T.pausedBody) + '</div>'));
        }
        flow.appendChild(box);
        var field = el('<div class="xch-field"><label for="xch-url">' + esc(T.urlLabel) + '</label><input class="xch-input" id="xch-url" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="' + esc(meta.placeholder) + '" data-hj-suppress><span class="xch-help">' + esc(meta.urlHelp) + '</span></div>');
        flow.appendChild(field);
        var url = field.querySelector("input");
        if (opts.prefill) url.value = opts.prefill;
        var headers = null;
        if (meta.headers) {
            headers = headerEditor();
            flow.appendChild(headers);
        }
        var actions = el('<div class="xch-actions"><button type="button" class="xch-btn" data-label="' + esc(T.connectBtn) + '">' + esc(T.connectBtn) + '</button></div>');
        var btn = actions.querySelector("button");
        flow.appendChild(actions);
        btn.addEventListener("click", function () {
            var u = url.value.trim();
            url.removeAttribute("aria-invalid");
            if (!u) { setMsg(box, T.urlRequired, "error"); url.setAttribute("aria-invalid", "true"); url.focus(); return; }
            if (!meta.test(u)) { setMsg(box, meta.urlBad, "error"); url.setAttribute("aria-invalid", "true"); url.focus(); return; }
            var body = { action: "setup", webhook: u };
            if (headers) {
                var h = headers.collect();
                if (h.error) { setMsg(box, h.error, "error"); return; }
                if (h.count) body.custom_headers = h.headers;
            }
            setMsg(box, "");
            busy(btn, true, T.connecting);
            var pre = Promise.resolve();
            if (opts.reset || (opts.replace && !meta.secret)) pre = call(p, "setup", { action: "delete" }).catch(function (e) { if (e.status !== 404) throw e; });
            pre.then(function () { return call(p, "setup", body); }).then(function (res) {
                return loadConfig(p).then(function () {
                    refreshRow(p);
                    if (res && res.signing_secret) {
                        current.secret = res.signing_secret;
                        current.secretAck = false;
                        current.view = "secret";
                    } else {
                        current.view = "verify";
                        current.flash = meta.secret ? T.sentWebhook : T.sent;
                    }
                    renderDrawer();
                });
            }).catch(function (err) {
                busy(btn, false);
                if (err.status === 409) {
                    setMsg(box, T.alreadyConnected, "error");
                    var fix = el('<div class="xch-actions"><button type="button" class="xch-btn xch-btn-danger xch-btn-sm">' + esc(T.remove) + '</button></div>');
                    fix.querySelector("button").addEventListener("click", function () {
                        if (!window.confirm(T.removeConfirm)) return;
                        call(p, "setup", { action: "delete" }).then(function () { return loadConfig(p); }).then(function () { refreshRow(p); fix.remove(); setMsg(box, T.deleted, "ok"); }).catch(function (e2) { setMsg(box, friendly(e2, p), "error"); });
                    });
                    box.after(fix);
                    return;
                }
                setMsg(box, friendly(err, p), "error");
            });
        });
    }

    function renderSecret(flow, p) {
        var box = msgBox();
        flow.appendChild(box);
        var secret = current.secret || "";
        var wrap = el(
            '<div class="xch-secret-box"><span class="xch-label">' + esc(T.secretTitle) + '</span><p class="xch-help">' + esc(T.secretIntro) + '</p>' +
            '<code class="xch-secret-value" data-hj-suppress></code>' +
            '<div class="xch-actions" style="margin-top:0"><button type="button" class="xch-btn xch-btn-quiet xch-btn-sm" data-reveal aria-pressed="false">' + esc(T.reveal) + '</button><button type="button" class="xch-btn xch-btn-quiet xch-btn-sm" data-copy>' + esc(T.copy) + '</button></div>' +
            '<label class="xch-check"><input type="checkbox"><span>' + esc(T.secretAck) + '</span></label></div>'
        );
        var code = wrap.querySelector("code");
        var reveal = wrap.querySelector("[data-reveal]");
        var copy = wrap.querySelector("[data-copy]");
        var ack = wrap.querySelector("input");
        var shown = false;
        code.textContent = SECRET_MASK;
        reveal.addEventListener("click", function () {
            shown = !shown;
            code.textContent = shown ? secret : SECRET_MASK;
            reveal.textContent = shown ? T.hide : T.reveal;
            reveal.setAttribute("aria-pressed", shown ? "true" : "false");
        });
        copy.addEventListener("click", function () {
            var done = function () { copy.textContent = T.copied; setTimeout(function () { copy.textContent = T.copy; }, 1800); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(secret).then(done, done);
            else done();
        });
        flow.appendChild(wrap);
        var afterManage = current.afterSecret === "manage";
        var actions = el('<div class="xch-actions"><button type="button" class="xch-btn" disabled>' + esc(afterManage ? T.close : T.continueBtn) + '</button></div>');
        var next = actions.querySelector("button");
        ack.addEventListener("change", function () {
            current.secretAck = ack.checked;
            next.disabled = !ack.checked;
        });
        next.addEventListener("click", function () {
            current.secret = null;
            current.afterSecret = null;
            current.view = afterManage ? "manage" : "verify";
            current.flash = afterManage ? T.rotated : T.sentWebhook;
            renderDrawer();
        });
        flow.appendChild(actions);
    }

    function renderVerify(flow, p) {
        var meta = PLATFORMS[p];
        var st = state[p];
        var box = msgBox();
        flow.appendChild(guideToggle());
        flow.appendChild(box);
        if (current.flash) { setMsg(box, current.flash, "ok"); current.flash = null; }
        if (st && st.cfg && st.cfg.last_verification_error) {
            flow.appendChild(el('<div class="xch-msg xch-msg-warn"><strong>' + esc(T.lastError) + ':</strong> ' + esc(st.cfg.last_verification_error) + '</div>'));
        }
        var field = el('<div class="xch-field"><label for="xch-code">' + esc(T.codeLabel) + '</label><input class="xch-input xch-code-input" id="xch-code" type="text" inputmode="text" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" maxlength="8" pattern="[A-Za-z0-9]{8}"><span class="xch-help">' + esc(T.codeHelp) + '</span></div>');
        flow.appendChild(field);
        var input = field.querySelector("input");
        var actions = el('<div class="xch-actions"><button type="button" class="xch-btn" data-label="' + esc(T.verifyBtn) + '">' + esc(T.verifyBtn) + '</button><button type="button" class="xch-link" data-resend>' + esc(meta.secret ? T.resendWebhook : T.resend) + '</button></div>');
        flow.appendChild(actions);
        var btn = actions.querySelector(".xch-btn");
        function submit() {
            var code = input.value.trim().toUpperCase();
            input.removeAttribute("aria-invalid");
            if (!/^[A-Z0-9]{8}$/.test(code)) { setMsg(box, T.codeRequired, "error"); input.setAttribute("aria-invalid", "true"); input.focus(); return; }
            setMsg(box, "");
            busy(btn, true, T.verifying);
            call(p, "setup", { action: "verify", verify_token: code }).then(function () {
                return loadConfig(p);
            }).then(function () {
                refreshRow(p);
                current.view = "manage";
                current.flash = T.verified;
                renderDrawer();
            }).catch(function (err) {
                busy(btn, false);
                setMsg(box, friendly(err, p), "error");
                input.setAttribute("aria-invalid", "true");
                input.focus();
            });
        }
        btn.addEventListener("click", submit);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
        actions.querySelector("[data-resend]").addEventListener("click", function () {
            var prev = st && st.cfg && st.cfg.webhook ? st.cfg.webhook : "";
            if (!prev) { current.view = "setup"; renderDrawer(); return; }
            setMsg(box, T.working + "…");
            call(p, "setup", { action: "setup", webhook: prev }).then(function (res) {
                return loadConfig(p).then(function () {
                    refreshRow(p);
                    if (res && res.signing_secret) {
                        current.secret = res.signing_secret;
                        current.secretAck = false;
                        current.view = "secret";
                        renderDrawer();
                        return;
                    }
                    setMsg(box, meta.secret ? T.sentWebhook : T.sent, "ok");
                });
            }).catch(function (err) {
                if (err.status === 409) { current.view = "manage"; renderDrawer(); return; }
                setMsg(box, friendly(err, p), "error");
            });
        });
    }

    function renderManage(flow, p) {
        var meta = PLATFORMS[p];
        var st = state[p] || {};
        var cfg = st.cfg || {};
        var box = msgBox();
        flow.appendChild(box);
        if (current.flash) { setMsg(box, current.flash, "ok"); current.flash = null; }
        if (st.kind === "disabled") {
            flow.appendChild(el('<div class="xch-msg xch-msg-warn"><strong>' + esc(T.pausedTitle) + '.</strong> ' + esc(T.pausedBody) + '</div>'));
        }
        var kv = el('<dl class="xch-kv"></dl>');
        function add(k, v, suppress) {
            if (v === undefined || v === null || v === "") return;
            kv.appendChild(el('<dt>' + esc(k) + '</dt>'));
            var dd = el('<dd' + (suppress ? ' data-hj-suppress' : '') + '></dd>');
            dd.textContent = v;
            kv.appendChild(dd);
        }
        add(T.endpoint, maskUrl(cfg.webhook), true);
        add(T.status, st.kind === "disabled" ? T.disabled : T.connected);
        add(T.since, fmtDate(cfg.verified_at));
        if (meta.headers) add(T.headersSet, cfg.custom_header_keys && cfg.custom_header_keys.length ? cfg.custom_header_keys.join(", ") : T.none);
        if (meta.secret && cfg.consecutive_failures) add(T.failures, String(cfg.consecutive_failures));
        if (cfg.last_verification_error) add(T.lastError, cfg.last_verification_error);
        flow.appendChild(kv);

        var acts = el('<div class="xch-actions"></div>');
        if (st.kind === "disabled") {
            var rc = el('<button type="button" class="xch-btn">' + esc(T.reconnect) + '</button>');
            rc.addEventListener("click", function () { current.view = "setup"; renderDrawerWith({ prefill: cfg.webhook, reset: true }); });
            acts.appendChild(rc);
        }
        var rep = el('<button type="button" class="xch-btn xch-btn-quiet">' + esc(T.replaceUrl) + '</button>');
        rep.addEventListener("click", function () {
            if (!window.confirm(T.replaceConfirm)) return;
            current.view = "setup";
            renderDrawerWith({ replace: true });
        });
        acts.appendChild(rep);
        flow.appendChild(acts);
        flow.appendChild(el('<span class="xch-help">' + esc(T.replaceHelp) + '</span>'));

        if (meta.secret) {
            flow.appendChild(el('<hr class="xch-divider">'));
            var rotWrap = el('<div><h4 class="xch-label">' + esc(T.rotate) + '</h4><p class="xch-help" style="margin:0 0 10px">' + esc(T.rotateHelp) + '</p><button type="button" class="xch-btn xch-btn-quiet xch-btn-sm" data-label="' + esc(T.rotate) + '">' + esc(T.rotate) + '</button></div>');
            var rot = rotWrap.querySelector("button");
            rot.addEventListener("click", function () {
                if (!window.confirm(T.rotateConfirm)) return;
                busy(rot, true, T.working);
                call(p, "setup", { action: "rotate_secret" }).then(function (res) {
                    return loadConfig(p).then(function () {
                        refreshRow(p);
                        current.secret = res.signing_secret || "";
                        current.secretAck = false;
                        current.view = "secret";
                        current.afterSecret = "manage";
                        renderDrawer();
                    });
                }).catch(function (err) { busy(rot, false); setMsg(box, friendly(err, p), "error"); });
            });
            flow.appendChild(rotWrap);
        }

        flow.appendChild(el('<hr class="xch-divider">'));
        var dz = el('<div class="xch-danger-zone"><h4>' + esc(T.remove) + '</h4><p>' + esc(T.removeHelp) + '</p><button type="button" class="xch-btn xch-btn-danger xch-btn-sm" data-label="' + esc(T.remove) + '">' + esc(T.remove) + '</button></div>');
        var del = dz.querySelector("button");
        del.addEventListener("click", function () {
            if (!window.confirm(T.removeConfirm)) return;
            busy(del, true, T.working);
            call(p, "setup", { action: "delete" }).then(function () { return loadConfig(p); }).then(function () {
                refreshRow(p);
                closeDrawer();
            }).catch(function (err) { busy(del, false); setMsg(box, friendly(err, p), "error"); });
        });
        flow.appendChild(dz);
    }

    function renderDrawerWith(opts) {
        var p = current.platform;
        var flow = drawer.querySelector(".xch-pane-flow");
        var guide = drawer.querySelector(".xch-pane-guide");
        flow.innerHTML = "";
        guide.innerHTML = "";
        setHead(p, T.connect + " " + PLATFORMS[p].label, PLATFORMS[p].desc);
        renderSetup(flow, p, opts);
        renderGuide(guide, p, false);
        var first = flow.querySelector("input");
        if (first) first.focus();
    }

    var GUIDES = {
        slack: function () {
            return '<h3>' + esc(T.slack) + '</h3><ol class="xch-steps">' +
                '<li>Open <a href="https://api.slack.com/apps" target="_blank" rel="noopener">api.slack.com/apps</a>, choose <strong>Create New App</strong>, then <strong>From scratch</strong>, and pick your workspace.</li>' +
                '<li>In the app, open <strong>Incoming Webhooks</strong> and switch it on.</li>' +
                '<li>Click <strong>Add New Webhook to Workspace</strong> and choose the channel that should receive breach alerts.</li>' +
                '<li>Copy the Webhook URL (it starts with <code>https://hooks.slack.com/services/</code>) and paste it here.</li>' +
                '<li>An 8-character code is posted to that channel. Enter it here to finish.</li></ol>' +
                '<h4>What you will receive</h4><p>One message per new breach that affects any of your verified domains, with the breach name, date, records exposed, the data types involved, and how many of your domain’s emails were found.</p>';
        },
        teams: function () {
            return '<h3>' + esc(T.teams) + '</h3><ol class="xch-steps">' +
                '<li>In Teams, open the channel that should receive alerts, click the three dots next to its name, and choose <strong>Workflows</strong>.</li>' +
                '<li>Pick the template <strong>Post to a channel when a webhook request is received</strong> and confirm the team and channel.</li>' +
                '<li>Copy the HTTP POST URL the workflow shows (from <code>webhook.office.com</code> or <code>api.powerplatform.com</code>) and paste it here.</li>' +
                '<li>An 8-character code is posted to that channel as a card. Enter it here to finish.</li></ol>' +
                '<p>Classic Incoming Webhook connector URLs from <code>outlook.office.com</code> still work while Microsoft keeps them alive, but new setups should use Workflows.</p>' +
                '<h4>What you will receive</h4><p>An Adaptive Card per new breach affecting any of your verified domains, with the same details as the Slack alert.</p>';
        },
        webhook: function () {
            return '<h3>' + esc(T.webhook) + '</h3><ol class="xch-steps">' +
                '<li>Expose a public HTTPS endpoint that accepts <code>POST</code> requests with a JSON body and replies with a 2xx status within 10 seconds.</li>' +
                '<li>Paste the URL here. Add custom headers if your endpoint needs them, for example <code>Authorization</code>.</li>' +
                '<li>Copy the signing secret when it appears. It is shown once and never again.</li>' +
                '<li>Find the first request in your endpoint logs. Its body contains <code>verification_code</code>. Enter that code here to finish.</li></ol>' +
                '<h4>Headers on every delivery</h4><table><tr><th>Header</th><th>Meaning</th></tr>' +
                '<tr><td><code>X-XON-Event</code></td><td><code>verification</code>, <code>verification_success</code>, or <code>breach_alert</code></td></tr>' +
                '<tr><td><code>X-XON-Timestamp</code></td><td>Unix seconds when the request was signed</td></tr>' +
                '<tr><td><code>X-XON-Signature</code></td><td><code>sha256=</code> + HMAC-SHA256 of <code>timestamp + "." + raw body</code>, keyed with your signing secret</td></tr></table>' +
                '<h4>Verify the signature</h4>' +
                '<pre class="xch-code">import hmac, hashlib\n\ndef verify(secret, headers, raw_body):\n    ts = headers["X-XON-Timestamp"]\n    expected = hmac.new(\n        secret.encode(), f"{ts}.".encode() + raw_body, hashlib.sha256\n    ).hexdigest()\n    return hmac.compare_digest(\n        "sha256=" + expected, headers["X-XON-Signature"]\n    )</pre>' +
                '<pre class="xch-code">const crypto = require("crypto");\n\nfunction verify(secret, headers, rawBody) {\n  const ts = headers["x-xon-timestamp"];\n  const expected = "sha256=" + crypto\n    .createHmac("sha256", secret)\n    .update(`${ts}.`).update(rawBody).digest("hex");\n  const given = headers["x-xon-signature"] || "";\n  return given.length === expected.length &&\n    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));\n}</pre>' +
                '<h4>Delivery rules</h4><p>Each delivery is retried up to 3 times on connection errors, timeouts, 5xx, or 429 responses. Other 4xx responses are not retried. After 10 failed deliveries in a row the channel is paused and shows here as Paused. Reconnect to resume. Redirects are not followed, and the endpoint must resolve to a public address.</p>';
        }
    };

    function renderGuide(pane, p, withTabs) {
        pane.innerHTML = "";
        if (!withTabs) pane.appendChild(backFromGuide());
        if (withTabs) {
            var tabs = el('<div class="xch-tabs" role="tablist" aria-label="' + esc(T.guideTitle) + '"></div>');
            Object.keys(PLATFORMS).forEach(function (k) {
                var t = el('<button type="button" class="xch-tab" role="tab" id="xch-tab-' + k + '" aria-controls="xch-panel-' + k + '" aria-selected="' + (k === p ? "true" : "false") + '" tabindex="' + (k === p ? "0" : "-1") + '"><i class="' + PLATFORMS[k].icon + '" aria-hidden="true"></i> ' + esc(PLATFORMS[k].label) + '</button>');
                t.addEventListener("click", function () {
                    current.platform = k;
                    renderGuide(pane, k, true);
                    pane.querySelector('.xch-tab[aria-selected="true"]').focus();
                });
                t.addEventListener("keydown", function (e) {
                    var keys = Object.keys(PLATFORMS);
                    var i = keys.indexOf(k);
                    var n = e.key === "ArrowRight" ? (i + 1) % keys.length : e.key === "ArrowLeft" ? (i - 1 + keys.length) % keys.length : e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : -1;
                    if (n === -1) return;
                    e.preventDefault();
                    current.platform = keys[n];
                    renderGuide(pane, keys[n], true);
                    pane.querySelector('.xch-tab[aria-selected="true"]').focus();
                });
                tabs.appendChild(t);
            });
            pane.appendChild(tabs);
        }
        var body = el(withTabs ? '<div role="tabpanel" id="xch-panel-' + p + '" aria-labelledby="xch-tab-' + p + '" tabindex="0"></div>' : '<div></div>');
        body.innerHTML = GUIDES[p]();
        pane.appendChild(body);
    }

    function renderFab() {
        if (document.querySelector(".xch-fab")) return;
        var b = el('<button type="button" class="xch-fab" aria-label="' + esc(T.fab) + '"><i class="fas fa-book-open" aria-hidden="true"></i><span>' + esc(T.fab) + '</span></button>');
        b.addEventListener("click", function () { openDrawer("slack", "guide"); });
        document.body.appendChild(b);
    }

    function init() {
        mountEl = document.querySelector("[data-xon-channels]");
        if (!mountEl) return;
        if (!creds()) { mountEl.innerHTML = ""; return; }
        renderCard();
        renderFab();
        loadAll().then(function () {
            Object.keys(PLATFORMS).forEach(refreshRow);
        });
    }

    window.XonChannels = { init: init, open: openDrawer, reload: function () { return loadAll().then(function () { Object.keys(PLATFORMS).forEach(refreshRow); }); } };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
