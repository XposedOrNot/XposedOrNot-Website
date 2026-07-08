(function () {
    var SVGNS = "http://www.w3.org/2000/svg";
    var API = "https://xon-api-test.xposedornot.com/v1";
    var params = new URLSearchParams(window.location.search);
    var email = (params.get("email") || "").toLowerCase().trim();
    var token = params.get("token") || "";
    var liveMode = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    var domainData = null;
    var domainDataState = "idle";
    var breachInfo = {};
    var selectedDomain = "all";

    function esc(t) {
        var d = document.createElement("div");
        d.appendChild(document.createTextNode(t == null ? "" : String(t)));
        return d.innerHTML;
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function navPill(id, value, good) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
        el.hidden = false;
        el.classList.remove("pd-navcount-ok", "pd-navcount-bad");
        if (good === true) el.classList.add("pd-navcount-ok");
        if (good === false) el.classList.add("pd-navcount-bad");
    }

    function dataEmoji(name) {
        var s = String(name).toLowerCase();
        if (/(password|security question|auth|session|cookie|two-factor|2fa|pin)/.test(s)) return "🔒";
        if (/(email|phone|messenger|chat|social)/.test(s)) return "📞";
        if (/(credit|card|bank|financial|iban|purchase|payment|transaction|salar|income|tax|insurance|loan)/.test(s)) return "💳";
        if (/(ip address|device|browser|user agent|mac address|network|geolocation|website activity)/.test(s)) return "🖥️";
        if (/(gender|age|date of birth|dob|ethnic|nationalit|marital|education|occupation|job|employer|language|religion)/.test(s)) return "👥";
        if (/(name|address|government|passport|id number|national id|photo|biometric|health|medical)/.test(s)) return "👤";
        return "📄";
    }

    function fmtDate(d) {
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }

    function note(el, html, tone) {
        el.innerHTML = html;
        el.hidden = false;
        el.style.borderLeft = tone === "error" ? "4px solid #cf222e" : "";
    }

    var authRedirecting = false;
    function authRedirect(error) {
        var status = error && error.status;
        var errText = "";
        if (error && error.responseJSON) {
            var d = error.responseJSON.detail || error.responseJSON;
            errText = String(d.Error || d.error || "");
        }
        var isAuth = status === 400 || status === 401 || status === 403 ||
            (status === 404 && /session/i.test(errText));
        if (!isAuth) return false;
        if (authRedirecting) return true;
        authRedirecting = true;
        try {
            $.LoadingOverlay("hide");
        } catch (ex) { }
        var box = document.createElement("div");
        box.setAttribute("role", "alert");
        box.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;" +
            "justify-content:center;background:rgba(14,15,25,0.55);z-index:3000;padding:16px;";
        box.innerHTML = '<div style="background:#fff;color:#1f2a3a;max-width:420px;width:100%;' +
            'border-radius:12px;padding:24px;text-align:center;' +
            'box-shadow:0 12px 40px rgba(0,0,0,0.35);font-size:15px;line-height:1.6;">' +
            '<i class="fas fa-sign-out-alt" aria-hidden="true" style="font-size:1.6em;color:#3c5fec;"></i>' +
            '<p style="margin:12px 0 0;"><strong>Your session has ended or this link is no longer valid.</strong>' +
            '<br>Taking you to sign in&hellip;</p></div>';
        document.body.appendChild(box);
        setTimeout(function () {
            window.location.href = "login";
        }, 3000);
        return true;
    }

    function authFailHtml(status) {
        if (status === 400 || status === 401 || status === 403) {
            return "Your dashboard link is invalid or has expired. Request a fresh link from the <a href='domains'>domain verification page</a>, then open this page again from that email.";
        }
        if (status === 429) {
            return "Too many requests right now. The free API is rate limited per IP. Please wait a minute and try again.";
        }
        return "We couldn't load this data right now. Please try again in a few minutes.";
    }

    function yearOf(info) {
        var fields = [info.xposed_date, info.breachedDate, info.breached_date,
            info.xposedDate, info.added, info.addedDate];
        for (var i = 0; i < fields.length; i++) {
            var m = String(fields[i] || "").match(/\b(19|20)\d{2}\b/);
            if (m) return m[0];
        }
        return "";
    }

    function dataOf(info) {
        var x = info.xposed_data || info.exposedData || "";
        if (Array.isArray(x)) return x.join(";");
        return String(x);
    }

    function recordsOf(info) {
        return parseInt(info.xposed_records || info.exposedRecords || 0, 10) || 0;
    }

    function addedOf(info) {
        return info.added || info.addedDate || "";
    }

    function svgEl(name, attrs, cls) {
        var el = document.createElementNS(SVGNS, name);
        for (var k in attrs) el.setAttribute(k, attrs[k]);
        if (cls) el.setAttribute("class", cls);
        return el;
    }

    function isStealer(b) {
        return /stealer/i.test(b.breach || "") ||
            /session cookies|browser passwords/i.test(b.xposed_data || "");
    }

    function hasPassword(b) {
        return /password/i.test(b.xposed_data || "");
    }

    function initNav() {
        var links = document.querySelectorAll(".pd-nav a[data-panel]");
        function show(name) {
            document.querySelectorAll(".pd-panel").forEach(function (p) {
                p.hidden = p.id !== "panel-" + name;
            });
            links.forEach(function (l) {
                if (l.getAttribute("data-panel") === name) {
                    l.setAttribute("aria-current", "page");
                } else {
                    l.removeAttribute("aria-current");
                }
            });
            if (liveMode && token) {
                if (["domain", "analysis", "vip", "phishing", "alerts"].indexOf(name) >= 0) {
                    loadDomainData();
                }
                if (name === "apikeys") loadApiKey();
            }
            if (name === "analysis" && analysisTable) analysisTable.columns.adjust();
            if (name === "phishing" && phishingTable) phishingTable.columns.adjust();
            if (name === "vip" && vipTable) vipTable.columns.adjust();
        }
        links.forEach(function (l) {
            l.addEventListener("click", function () {
                show(l.getAttribute("data-panel"));
            });
        });
        var start = location.hash.replace("#", "");
        if (document.getElementById("panel-" + start)) show(start);
    }

    function greeting() {
        var h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    }

    function drawStems(svg, points, caption) {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        var left = 40, right = 700, base = 130;
        svg.appendChild(svgEl("line", { x1: left, y1: 35, x2: right, y2: 35 }, "pd-grid"));
        svg.appendChild(svgEl("line", { x1: left, y1: 82, x2: right, y2: 82 }, "pd-grid"));
        svg.appendChild(svgEl("line", { x1: left, y1: base, x2: right, y2: base }, "pd-axis"));
        var thisYear = new Date().getFullYear();
        var years = points.map(function (p) { return p.year; });
        var minYear = Math.min.apply(null, years.concat([thisYear - 4]));
        var span = Math.max(thisYear - minYear, 1);
        function x(year) {
            return left + ((year - minYear) / span) * (right - left - 20);
        }
        var maxV = 1;
        points.forEach(function (p) { if (p.value > maxV) maxV = p.value; });
        var used = {};
        points.forEach(function (p) {
            var h = 20 + Math.sqrt(p.value / maxV) * 78;
            var cx = x(p.year);
            while (used[Math.round(cx / 14)]) cx += 16;
            used[Math.round(cx / 14)] = true;
            var cy = base - h;
            var g = svgEl("g", {});
            var t = document.createElementNS(SVGNS, "title");
            t.textContent = p.tip;
            g.appendChild(t);
            g.appendChild(svgEl("line", { x1: cx, y1: base, x2: cx, y2: cy }, "pd-stem"));
            if (p.stealer) {
                g.appendChild(svgEl("rect", {
                    x: cx - 7, y: cy - 7, width: 14, height: 14,
                    transform: "rotate(45 " + cx + " " + cy + ")"
                }, "pd-node-stealer"));
            } else {
                g.appendChild(svgEl("circle", { cx: cx, cy: cy, r: 7 },
                    p.pw ? "pd-node pd-node-pw" : "pd-node"));
            }
            if (p.label) {
                var lbl = svgEl("text", {
                    x: cx, y: cy - 12,
                    "text-anchor": cx > right - 60 ? "end" : "middle"
                }, p.labelStrong ? "pd-chart-valuelabel" : "pd-chart-namelabel");
                lbl.textContent = p.label;
                g.appendChild(lbl);
            }
            svg.appendChild(g);
        });
        var ticks = [];
        [0, 0.2, 0.4, 0.6, 0.8].forEach(function (f) {
            var yr = Math.round(minYear + span * f);
            if (ticks.indexOf(yr) === -1 && yr < thisYear) ticks.push(yr);
        });
        ticks.forEach(function (yr) {
            var lbl = svgEl("text", { x: x(yr), y: 150, "text-anchor": "middle" }, "pd-chart-yearlabel");
            lbl.textContent = yr;
            svg.appendChild(lbl);
        });
        var today = svgEl("text", { x: 695, y: 150, "text-anchor": "middle" }, "pd-chart-yearlabel");
        today.textContent = "Today";
        svg.appendChild(today);
        var cap = svgEl("text", { x: left, y: 172, "text-anchor": "start" }, "pd-chart-valuelabel");
        cap.textContent = caption;
        svg.appendChild(cap);
        svg.setAttribute("aria-label", "Timeline chart. " + caption);
    }

    function buildPersonalChart(breaches) {
        var svg = document.getElementById("pd-chart");
        var thisYear = new Date().getFullYear();
        if (breaches.length <= 8) {
            drawStems(svg, breaches.map(function (b) {
                var yr = parseInt(b.xposed_date, 10) || thisYear;
                var rec = parseInt(b.xposed_records, 10) || 1;
                return {
                    year: yr, value: rec, pw: hasPassword(b), stealer: isStealer(b),
                    label: b.breach,
                    tip: b.breach + ", " + yr + ". " + Number(rec).toLocaleString() +
                        " accounts exposed." + (isStealer(b) ? " Stealer log." : hasPassword(b) ? " Password exposed." : "")
                };
            }), "Taller bars mean more accounts were exposed in that breach.");
        } else {
            var byYear = {};
            breaches.forEach(function (b) {
                var yr = parseInt(b.xposed_date, 10) || thisYear;
                byYear[yr] = byYear[yr] || { count: 0, pw: 0, stealer: 0 };
                byYear[yr].count++;
                if (hasPassword(b)) byYear[yr].pw++;
                if (isStealer(b)) byYear[yr].stealer++;
            });
            drawStems(svg, Object.keys(byYear).sort().map(function (yr) {
                var d = byYear[yr];
                return {
                    year: parseInt(yr, 10), value: d.count, pw: d.pw > 0, stealer: d.stealer > 0,
                    label: String(d.count), labelStrong: true,
                    tip: d.count + (d.count === 1 ? " breach" : " breaches") + " in " + yr + "." +
                        (d.pw ? " " + d.pw + " exposed passwords." : "") +
                        (d.stealer ? " Includes a stealer log." : "")
                };
            }), "Taller bars mean more of your breaches happened that year.");
        }
    }

    function buildStrengthBar(metrics) {
        var wrap = document.getElementById("pd-strength");
        var ps = metrics.passwords_strength && metrics.passwords_strength[0];
        if (!ps) { wrap.hidden = true; return; }
        var order = [
            ["PlainText", "Plaintext", "#cf222e"],
            ["EasyToCrack", "Easy to crack", "#e36209"],
            ["StrongHash", "Strong hash", "#2e9e5b"],
            ["Unknown", "Unknown", "#94a6bd"]
        ];
        var total = 0;
        order.forEach(function (o) { total += ps[o[0]] || 0; });
        if (!total) { wrap.hidden = true; return; }
        var bar = document.getElementById("pd-strength-bar");
        var legend = document.getElementById("pd-strength-legend");
        bar.innerHTML = "";
        legend.innerHTML = "";
        order.forEach(function (o) {
            var v = ps[o[0]] || 0;
            if (!v) return;
            var seg = document.createElement("span");
            seg.style.width = (v / total) * 100 + "%";
            seg.style.background = o[2];
            seg.title = o[1] + ": " + v;
            bar.appendChild(seg);
            var li = document.createElement("span");
            li.innerHTML = '<span class="pd-swatch" style="background:' + o[2] + '"></span> ' +
                esc(o[1]) + " " + v;
            legend.appendChild(li);
        });
        wrap.hidden = false;
    }

    function buildChecklist(breaches) {
        var items = [];
        var stealers = breaches.filter(isStealer);
        var plain = breaches.filter(function (b) {
            return b.password_risk === "plaintext" || b.password_risk === "easytocrack";
        });
        if (stealers.length) {
            items.push("Sign out of all sessions and change browser-saved passwords (" + stealers[0].breach + ")");
            items.push("Run an antivirus scan on the device you use most");
        }
        if (plain.length) {
            items.push("Retire the passwords exposed in " +
                plain.slice(0, 2).map(function (b) { return b.breach; }).join(" and ") +
                (plain.length > 2 ? " and " + (plain.length - 2) + " more breaches" : ""));
        }
        items.push("Turn on two-factor authentication for your most important accounts");
        var ul = document.querySelector(".pd-checklist");
        ul.innerHTML = "";
        items.forEach(function (text) {
            var li = document.createElement("li");
            var icon = document.createElement("i");
            icon.className = "fas fa-arrow-right";
            icon.setAttribute("aria-hidden", "true");
            var span = document.createElement("span");
            span.textContent = text;
            li.appendChild(icon);
            li.appendChild(span);
            ul.appendChild(li);
        });
    }

    function loadDbFreshness() {
        $.ajax(API + "/metrics/detailed")
            .done(function (m) {
                if (!m || !m.Last_Breach_Added) return;
                var d = new Date(m.Last_Breach_Added);
                if (isNaN(d.getTime())) return;
                var name = (m.Recent_Breaches && m.Recent_Breaches[0] &&
                    m.Recent_Breaches[0].breachid) || "";
                var link = name
                    ? ' &middot; <a href="breach.html#' + encodeURIComponent(name) +
                        '" target="_blank" rel="noopener">' + esc(name) +
                        '<span class="sr-only"> (opens in new tab)</span></a>'
                    : "";
                document.getElementById("pd-freshness-date").innerHTML = fmtDate(d) + link;
                document.querySelector(".pd-freshline").hidden = false;
            });
    }

    function breachCard(b, stealer, sensitive) {
        var chips = (b.xposed_data || "").split(";").filter(Boolean).map(function (c) {
            var pw = /password|cookie/i.test(c);
            return '<span class="pd-data-chip' + (pw ? " pd-data-chip-pw" : "") + '">' +
                '<span aria-hidden="true">' + dataEmoji(c) + "</span> " + esc(c.trim()) + "</span>";
        }).join("");
        var risk = { plaintext: "Plaintext passwords", easytocrack: "Easy-to-crack hashes", hardtocrack: "Strong hashes", unknown: "Password storage unknown" }[b.password_risk] || "";
        return '<article class="pd-breach">' +
            '<img class="pd-breach-logo" src="' + esc(b.logo || "/static/images/logos/logo.svg") + '" alt="" loading="lazy" onerror="this.src=\'/static/images/logos/logo.svg\'" />' +
            '<div class="pd-breach-main"><div class="pd-breach-title">' +
            '<a href="breach.html#' + encodeURIComponent(b.breach) + '" target="_blank" rel="noopener">' + esc(b.breach) + '<span class="sr-only"> (opens in new tab)</span></a>' +
            (stealer ? '<span class="pd-badge-stealer"><i class="fas fa-bug" aria-hidden="true"></i> Stealer log</span>' : "") +
            (sensitive ? '<span class="pd-badge-sensitive"><span aria-hidden="true">🔥</span> Sensitive</span>' : "") +
            '<span class="pd-breach-meta">' + esc(b.xposed_date || "") +
            (b.xposed_records ? " &middot; " + Number(parseInt(b.xposed_records, 10) || 0).toLocaleString() + " accounts" : "") +
            "</span></div>" +
            (b.details ? '<p class="pd-breach-desc">' + esc(b.details) + "</p>" : "") +
            '<div class="pd-breach-facts">' +
            (b.industry ? '<span><i class="fas fa-industry" aria-hidden="true"></i>' + esc(b.industry) + "</span>" : "") +
            (risk ? '<span><i class="fas fa-key" aria-hidden="true"></i>' + esc(risk) + "</span>" : "") +
            (b.domain ? '<span><i class="fas fa-globe" aria-hidden="true"></i>' + esc(b.domain) + "</span>" : "") +
            "</div>" +
            '<div class="pd-data-chips">' + chips + "</div>" +
            "</div></article>";
    }

    function populateBreachesPanel(breaches, sensitive) {
        var host = document.getElementById("pd-breaches-live");
        var sorted = breaches.slice().sort(function (a, b) {
            return (b.added || "") > (a.added || "") ? 1 : -1;
        });
        var stealers = sorted.filter(isStealer);
        var rest = sorted.filter(function (b) { return !isStealer(b); });
        var html = "";
        if (stealers.length) {
            html += '<div class="dashboard-card pd-card"><h2><i class="fas fa-bug" aria-hidden="true"></i> Stealer logs <span class="pd-count">' +
                stealers.length + " found</span></h2>" +
                '<p class="pd-panel-sub" style="margin-bottom:12px">Captured directly from an infected device. Treat these first: sign out of sessions, rotate browser-saved passwords, scan the device.</p>' +
                stealers.map(function (b) { return breachCard(b, true); }).join("") + "</div>";
        }
        if (sensitive && sensitive.length) {
            html += '<div class="dashboard-card pd-card"><h2><i class="fas fa-user-secret" aria-hidden="true"></i> Sensitive breaches <span class="pd-count">' +
                sensitive.length + "</span></h2>" +
                '<p class="pd-panel-sub" style="margin-bottom:12px">Hidden from public search. Visible to you because you opened this page with your access token.</p>' +
                sensitive.map(function (b) { return breachCard(b, false, true); }).join("") + "</div>";
        }
        var LIMIT = 30;
        var shown = rest.slice(0, LIMIT);
        html += '<div class="dashboard-card pd-card"><h2><i class="fas fa-exclamation-triangle" aria-hidden="true"></i> All breaches <span class="pd-count">' +
            rest.length + "</span></h2>" +
            shown.map(function (b) { return breachCard(b, false); }).join("") +
            (rest.length > LIMIT
                ? '<button type="button" class="pd-btn pd-btn-quiet" id="pd-show-all">Show all ' + rest.length + " breaches</button>"
                : "") +
            "</div>";
        html += '<p class="pd-empty-note">Want the full visual report with heat maps and attack paths? ' +
            '<a href="data-breaches-risks.html?email=' + encodeURIComponent(email) +
            (token ? "&token=" + encodeURIComponent(token) : "") +
            '" target="_blank" rel="noopener">Open your detailed report<span class="sr-only"> (opens in new tab)</span></a>.</p>';
        host.innerHTML = html;
        var btn = document.getElementById("pd-show-all");
        if (btn) {
            btn.addEventListener("click", function () {
                btn.insertAdjacentHTML("beforebegin",
                    rest.slice(LIMIT).map(function (b) { return breachCard(b, false); }).join(""));
                btn.remove();
            });
        }
        var total = sorted.length + (sensitive ? sensitive.length : 0);
        navPill("pd-nav-breaches", String(total), total === 0);
    }

    function renderShieldStatus(on) {
        var btn = document.getElementById("pd-shield-btn");
        if (!btn) return;
        var badge = document.getElementById("pd-shield-badge");
        if (on) {
            btn.hidden = true;
            if (!badge) {
                btn.insertAdjacentHTML("afterend",
                    '<span class="pd-badge-on" id="pd-shield-badge">' +
                    '<i class="fas fa-check" aria-hidden="true"></i> Enabled</span>');
            }
        } else {
            if (badge) badge.remove();
            btn.hidden = false;
        }
    }

    function populateOverview(data) {
        hideOverlay();
        document.getElementById("pd-overview-loading").hidden = true;
        if (token && typeof data.ShieldOn === "boolean") {
            renderShieldStatus(data.ShieldOn);
        }
        var breaches = (data.ExposedBreaches && data.ExposedBreaches.breaches_details) || [];
        var sensitive = (data.ExposedBreaches && data.ExposedBreaches.sensitive_breaches_details) || [];
        var metrics = data.BreachMetrics || {};
        var risk = (metrics.risk && metrics.risk[0]) || { risk_score: 0, risk_label: "Low" };
        var pastes = (data.PastesSummary && data.PastesSummary.cnt) || 0;
        var stealerCount = breaches.filter(isStealer).length;
        var pwCount = breaches.filter(hasPassword).length;
        var plainCount = breaches.filter(function (b) { return b.password_risk === "plaintext"; }).length;

        setText("pd-risk-num", risk.risk_score);
        setText("pd-risk-word", risk.risk_label);
        document.getElementById("pd-risk-marker").style.left =
            Math.min(Math.max(risk.risk_score, 1), 99) + "%";
        document.getElementById("pd-riskband").setAttribute("aria-label",
            "Risk score " + risk.risk_score + " of 100, in the " + risk.risk_label +
            " band. Bands: Low 0 to 25, Moderate 26 to 50, High 51 to 75, Critical 76 to 100.");

        var why;
        if (!breaches.length && !sensitive.length) {
            why = "No known breaches expose this email.";
        } else {
            why = "Driven by " + pwCount + " password exposure" + (pwCount === 1 ? "" : "s") +
                (plainCount ? " (" + plainCount + " in plaintext)" : "") +
                " across " + (breaches.length + sensitive.length) + " breach" +
                (breaches.length + sensitive.length === 1 ? "" : "es") +
                (stealerCount ? ", including a stealer-log capture" : "") +
                (sensitive.length ? ", " + sensitive.length + " of them sensitive" : "") + ".";
        }
        setText("pd-risk-why", why);
        setText("pd-stat-breaches", (breaches.length + sensitive.length).toLocaleString());
        setText("pd-stat-stealer", stealerCount.toLocaleString());
        setText("pd-stat-passwords", pwCount.toLocaleString());
        setText("pd-stat-pastes", Number(pastes).toLocaleString());
        buildStrengthBar(metrics);

        if (breaches.length) {
            document.getElementById("pd-chart-card").hidden = false;
            buildPersonalChart(breaches);
        } else {
            document.getElementById("pd-chart-card").hidden = true;
            note(document.getElementById("pd-overview-note"),
                "Good news: no known breaches expose <strong>" + esc(email) +
                "</strong> right now. Keep breach alerts on so you hear the moment that changes.");
        }
        buildChecklist(breaches);
        populateBreachesPanel(breaches, sensitive);
    }

    function buildInfoMap(detailed) {
        breachInfo = {};
        if (Array.isArray(detailed)) {
            detailed.forEach(function (b) {
                var name = b.breach || b.breach_id || b.breachid || b.name;
                if (name) breachInfo[name] = b;
            });
        } else if (detailed && typeof detailed === "object") {
            Object.keys(detailed).forEach(function (key) {
                var b = detailed[key];
                if (b && typeof b === "object") {
                    breachInfo[b.breach || b.breach_id || key] = b;
                }
            });
        }
    }

    function logoFor(name) {
        var info = breachInfo[name] || {};
        return info.logo || "https://xposedornot.com/static/logos/" +
            encodeURIComponent(name) + ".png";
    }

    function domainRows() {
        var rows = (domainData && domainData.Breaches_Details) || [];
        if (selectedDomain === "all") return rows;
        return rows.filter(function (r) { return r.domain === selectedDomain; });
    }

    function renderDomainSwitcher() {
        var host = document.getElementById("pd-domain-switch");
        var summary = (domainData && domainData.Domain_Summary) || {};
        var domains = Object.keys(summary);
        var html = domains.length > 1
            ? '<button type="button" data-dom="all" class="pd-domchip' + (selectedDomain === "all" ? " pd-domchip-on" : "") + '">All domains</button>'
            : "";
        domains.forEach(function (d) {
            html += '<button type="button" data-dom="' + esc(d) + '" class="pd-domchip' +
                (selectedDomain === d ? " pd-domchip-on" : "") + '">' + esc(d) +
                ' <span class="pd-navcount">' + summary[d] + "</span></button>";
        });
        host.innerHTML = html;
        host.querySelectorAll("button").forEach(function (btn) {
            btn.addEventListener("click", function () {
                selectedDomain = btn.getAttribute("data-dom");
                renderDomainsPanel();
                renderAnalysisPanel();
            });
        });
    }

    function renderDomainsPanel() {
        renderDomainSwitcher();
        var rows = domainRows();
        var emails = {};
        var breachSet = {};
        rows.forEach(function (r) {
            emails[r.email] = (emails[r.email] || 0) + 1;
            breachSet[r.breach] = true;
        });
        setText("pd-dom-breaches", Object.keys(breachSet).length.toLocaleString());
        setText("pd-dom-emails", Object.keys(emails).length.toLocaleString());
        var sen = (domainData && domainData.Seniority_Summary) || {};
        var senTotal = (sen.c_suite || 0) + (sen.vp || 0) + (sen.director || 0);
        setText("pd-dom-seniors", senTotal.toLocaleString());
        var latestName = "", latestAdded = "";
        Object.keys(breachSet).forEach(function (name) {
            var info = breachInfo[name] || {};
            if (addedOf(info) > latestAdded) {
                latestAdded = addedOf(info);
                latestName = name;
            }
        });
        setText("pd-dom-last", latestAdded ? fmtDate(new Date(latestAdded)) : "-");

        var top = Object.keys(emails).sort(function (a, b) { return emails[b] - emails[a]; }).slice(0, 5);
        document.getElementById("pd-dom-people").innerHTML = top.length
            ? top.map(function (e) {
                return "<li>" + esc(e) + '<span class="pd-breach-meta">' + emails[e] +
                    (emails[e] === 1 ? " breach" : " breaches") + "</span></li>";
            }).join("")
            : "<li>No exposed emails found.</li>";

        var recent = Object.keys(breachSet).map(function (name) {
            return { name: name, info: breachInfo[name] || {} };
        }).sort(function (a, b) {
            return addedOf(b.info) > addedOf(a.info) ? 1 : -1;
        }).slice(0, 5);
        document.getElementById("pd-dom-recent").innerHTML = recent.map(function (b) {
            var cnt = rows.filter(function (r) { return r.breach === b.name; }).length;
            var when = addedOf(b.info);
            return '<div class="pd-mini-breach">' +
                '<img class="pd-mini-logo" src="' + esc(logoFor(b.name)) + '" alt="" onerror="this.src=\'/static/images/logos/logo.svg\'" />' +
                '<div><span class="pd-mini-name"><a href="breach.html#' + encodeURIComponent(b.name) + '" target="_blank" rel="noopener">' + esc(b.name) + '<span class="sr-only"> (opens in new tab)</span></a></span> ' +
                '<span class="pd-breach-meta">' + esc(when ? fmtDate(new Date(when)) : yearOf(b.info)) + "</span></div>" +
                '<div class="pd-mini-right"><span class="pd-breach-meta">' + cnt + (cnt === 1 ? " email" : " emails") + "</span></div></div>";
        }).join("") || '<p class="pd-panel-sub">No breaches affect this domain.</p>';

        var ym = (domainData && domainData.Yearly_Metrics) || {};
        var pts = Object.keys(ym).filter(function (y) { return ym[y] > 0; }).map(function (y) {
            return {
                year: parseInt(String(y).replace(/^y/, ""), 10), value: ym[y],
                pw: false, stealer: false, label: String(ym[y]), labelStrong: true,
                tip: ym[y] + (ym[y] === 1 ? " exposure" : " exposures") + " in " + String(y).replace(/^y/, "")
            };
        }).filter(function (p) { return !isNaN(p.year); });
        var chartCard = document.getElementById("pd-dom-chart-card");
        if (pts.length) {
            chartCard.hidden = false;
            drawStems(document.getElementById("pd-dom-chart"), pts,
                "Taller bars mean more employee exposures that year, across all monitored domains.");
        } else {
            chartCard.hidden = true;
        }
    }

    var analysisTable = null;
    function renderAnalysisPanel() {
        var rows = domainRows().map(function (r) {
            var info = breachInfo[r.breach] || {};
            return [
                esc(r.email),
                "<a href='breach.html#" + encodeURIComponent(r.breach) + "' target='_blank' rel='noopener'>" + esc(r.breach) + "</a>",
                esc(yearOf(info)),
                esc(dataOf(info).split(";").join(", "))
            ];
        });
        var table = $("#pd-an-table");
        if (analysisTable) {
            analysisTable.clear().rows.add(rows).draw();
        } else if ($.fn.DataTable) {
            analysisTable = table.DataTable({
                data: rows,
                pageLength: 25,
                order: [[2, "desc"]],
                dom: '<"d-flex align-items-center justify-content-between flex-wrap"lfB>rtip',
                buttons: [{
                    extend: "collection",
                    text: '<i class="fas fa-download" aria-hidden="true"></i> Export',
                    autoClose: true,
                    buttons: [
                        { extend: "csv", text: '<i class="fas fa-file-csv" aria-hidden="true"></i> Download CSV', filename: "xon-domain-exposures" },
                        { extend: "copy", text: '<i class="fas fa-copy" aria-hidden="true"></i> Copy to clipboard' }
                    ]
                }],
                language: { emptyTable: "No exposures for the selected domain." }
            });
        }
        var top = (domainData && domainData.Top10_Breaches) || {};
        document.getElementById("pd-an-top").innerHTML = Object.keys(top).slice(0, 10).map(function (name) {
            return "<li>" + esc(name) + '<span class="pd-breach-meta">' + top[name] + "</span></li>";
        }).join("") || "<li>No data.</li>";
    }

    function renderAlertsPanel() {
        var host = document.getElementById("pd-alerts-live");
        var am = domainData && domainData.Alert_Management;
        var cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        var alerts = ((am && am.alerts) || []).filter(function (a) {
            var t = new Date(a.alert_time).getTime();
            return !isNaN(t) && t >= cutoff;
        }).sort(function (a, b) {
            return new Date(b.alert_time) - new Date(a.alert_time);
        });
        if (!alerts.length) {
            host.innerHTML = '<div class="dashboard-card pd-card"><div class="pd-allclear"><i class="fas fa-check-circle" aria-hidden="true"></i>All clear<small>No breach alerts for your monitored domains in the last 30 days.</small></div></div>';
            navPill("pd-nav-alerts", "0", true);
            return;
        }
        var pending = alerts.filter(function (a) {
            return (a.status || "").toLowerCase() !== "acknowledged";
        }).length;
        navPill("pd-nav-alerts", String(pending), pending === 0);
        host.innerHTML = '<p class="pd-panel-sub" style="margin-bottom:10px">New breaches requiring your acknowledgment, from the last 30 days.</p>' +
            '<ul class="pd-feed">' + alerts.map(function (a) {
            var info = breachInfo[a.breach_id] || {};
            var when = a.alert_time ? fmtDate(new Date(a.alert_time)) : "";
            var ack = (a.status || "").toLowerCase() === "acknowledged";
            return '<li><span class="pd-feed-icon"><i class="fas fa-bug" aria-hidden="true"></i></span><div>' +
                "<time>" + esc(when) + "</time> New exposure: <strong>" + esc(a.breach_id || "") + "</strong>" +
                (a.severity ? " &middot; " + esc(a.severity) : "") +
                (recordsOf(info) ? " &middot; " + recordsOf(info).toLocaleString() + " records" : "") +
                (ack ? ' <span class="pd-delivered"><i class="fas fa-check" aria-hidden="true"></i> acknowledged</span>'
                    : ' <button type="button" class="pd-btn pd-btn-quiet pd-btn-sm" data-ack="' + esc(a.alert_id) + '">Acknowledge</button>') +
                "</div></li>";
        }).join("") + "</ul>";
        host.querySelectorAll("[data-ack]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                btn.disabled = true;
                $.ajax({
                    url: API + "/update_alert_status?email=" + encodeURIComponent(email) +
                        "&token=" + encodeURIComponent(token),
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ alert_id: btn.getAttribute("data-ack"), status: "Acknowledged" })
                }).done(function () {
                    btn.outerHTML = '<span class="pd-delivered"><i class="fas fa-check" aria-hidden="true"></i> acknowledged</span>';
                }).fail(function () {
                    btn.disabled = false;
                    btn.textContent = "Failed, retry";
                });
            });
        });
    }

    function loadDomainData() {
        if (domainDataState !== "idle") return;
        domainDataState = "loading";
        document.querySelectorAll(".pd-domain-loading").forEach(function (el) { el.hidden = false; });
        $.ajax(API + "/send_domain_breaches?email=" + encodeURIComponent(email) +
            "&token=" + encodeURIComponent(token))
            .done(function (response) {
                domainDataState = "done";
                domainData = response || {};
                buildInfoMap(domainData.Detailed_Breach_Info);
                navPill("pd-nav-domains",
                    String(Object.keys(domainData.Domain_Summary || {}).length));
                document.querySelectorAll(".pd-needs-domain, .pd-domain-loading").forEach(function (el) { el.hidden = true; });
                populatePhishingDomains();
                renderDomainsPanel();
                renderAnalysisPanel();
                renderAlertsPanel();
                loadVip();
            })
            .fail(function (error) {
                domainDataState = "idle";
                document.querySelectorAll(".pd-domain-loading").forEach(function (el) { el.hidden = true; });
                if (authRedirect(error)) return;
                var html;
                if (error.status === 404) {
                    html = "No verified domains yet for this account. <a href='domain'>Add and verify a domain</a> to unlock company-wide monitoring.";
                } else {
                    html = authFailHtml(error.status);
                }
                document.querySelectorAll(".pd-needs-domain").forEach(function (el) {
                    note(el, html, error.status === 404 ? "" : "error");
                });
            });
    }

    function populatePhishingDomains() {
        var sel = document.getElementById("pd-ph-domain");
        var domains = Object.keys((domainData && domainData.Domain_Summary) || {});
        if (!domains.length) return;
        sel.innerHTML = domains.map(function (d) {
            return '<option value="' + esc(d) + '">' + esc(d) + "</option>";
        }).join("");
    }

    var vipLoaded = false;
    function loadVip() {
        if (vipLoaded) return;
        vipLoaded = true;
        $.ajax(API + "/domain-seniority?email=" + encodeURIComponent(email) +
            "&token=" + encodeURIComponent(token))
            .done(function (response) {
                var data = [];
                if (response && Array.isArray(response.seniority_data)) {
                    data = response.seniority_data;
                } else if (response && response.domains) {
                    Object.keys(response.domains).forEach(function (d) {
                        (((response.domains[d] || {}).seniority_data) || []).forEach(function (item) {
                            var row = Object.assign({}, item);
                            row.domain = row.domain || d;
                            data.push(row);
                        });
                    });
                }
                renderVip(data);
            })
            .fail(function (error) {
                vipLoaded = false;
                if (authRedirect(error)) return;
                note(document.getElementById("pd-vip-note"), authFailHtml(error.status), "error");
            });
    }

    var vipData = [];
    var vipTable = null;
    function normLevel(v) {
        return String(v || "").toLowerCase().replace(/[^a-z]/g, "");
    }

    function renderVip(data) {
        if (data) vipData = data;
        var counts = { csuite: 0, vp: 0, director: 0 };
        vipData.forEach(function (r) {
            var n = normLevel(r.seniority);
            if (counts[n] !== undefined) counts[n]++;
        });
        setText("pd-vip-count-all", String(vipData.length));
        setText("pd-vip-count-csuite", String(counts.csuite));
        setText("pd-vip-count-vp", String(counts.vp));
        setText("pd-vip-count-director", String(counts.director));
        var filter = document.querySelector(".pd-vip-filter .pd-domchip-on");
        var level = filter ? filter.getAttribute("data-level") : "all";
        var rows = vipData.filter(function (r) {
            return level === "all" || normLevel(r.seniority) === normLevel(level);
        }).map(function (r) {
            var breaches = (Array.isArray(r.breaches) ? r.breaches : []).map(function (b) {
                if (typeof b === "string") return b;
                return (b && (b.breach_name || b.breach || b.breach_id)) || "";
            }).filter(Boolean);
            return [
                esc(r.email) + (r.domain ? '<span class="pd-vip-domain">' + esc(r.domain) + "</span>" : ""),
                esc(r.seniority || ""),
                String(breaches.length),
                esc(breaches.slice(0, 4).join(", ")) +
                (breaches.length > 4 ? " +" + (breaches.length - 4) + " more" : "")
            ];
        });
        if (vipTable) {
            vipTable.clear().rows.add(rows).draw();
        } else if ($.fn.DataTable) {
            vipTable = $("#pd-vip-table").DataTable({
                data: rows,
                pageLength: 25,
                order: [[2, "desc"]],
                dom: '<"d-flex align-items-center justify-content-between flex-wrap"lfB>rtip',
                buttons: [{
                    extend: "collection",
                    text: '<i class="fas fa-download" aria-hidden="true"></i> Export',
                    autoClose: true,
                    buttons: [
                        { extend: "csv", text: '<i class="fas fa-file-csv" aria-hidden="true"></i> Download CSV', filename: "xon-vip-exposure" },
                        { extend: "copy", text: '<i class="fas fa-copy" aria-hidden="true"></i> Copy to clipboard' }
                    ]
                }],
                language: { emptyTable: "No exposed people at this level. That is exactly what you want to see here." }
            });
        }
        document.querySelectorAll(".pd-vip-filter button").forEach(function (btn) {
            btn.onclick = function () {
                document.querySelectorAll(".pd-vip-filter button").forEach(function (b) {
                    b.classList.remove("pd-domchip-on");
                });
                btn.classList.add("pd-domchip-on");
                renderVip();
            };
        });
        document.getElementById("pd-vip-note").hidden = true;
    }

    var phishingTable = null;
    function initPhishing() {
        var btn = document.getElementById("pd-ph-run");
        btn.addEventListener("click", function () {
            var domain = document.getElementById("pd-ph-domain").value.trim().toLowerCase();
            var noteEl = document.getElementById("pd-ph-note");
            if (!domain) {
                note(noteEl, "No verified domain selected. Verify a domain first to run phishing analysis.");
                return;
            }
            btn.disabled = true;
            note(noteEl, "Scanning " + esc(domain) + " for lookalike domains. This can take a moment.");
            document.getElementById("pd-ph-results").hidden = true;
            fetch(API + "/domain-phishing/" + encodeURIComponent(domain))
                .then(function (r) {
                    if (!r.ok) throw { status: r.status };
                    return r.json();
                })
                .then(function (data) {
                    btn.disabled = false;
                    noteEl.hidden = true;
                    setText("pd-ph-scanned", (data.total_scanned || 0).toLocaleString());
                    setText("pd-ph-live", (data.total_live || 0).toLocaleString());
                    setText("pd-ph-checked", data.last_checked ? fmtDate(new Date(data.last_checked)) : "-");
                    var rows = (Array.isArray(data.live_domains) ? data.live_domains : []).map(function (d) {
                        return [
                            esc(String(d)),
                            '<span class="pd-badge-stealer"><i class="fas fa-exclamation-circle" aria-hidden="true"></i> Live</span>'
                        ];
                    });
                    if (phishingTable) {
                        phishingTable.clear().rows.add(rows).draw();
                    } else if ($.fn.DataTable) {
                        phishingTable = $("#pd-ph-table").DataTable({
                            data: rows,
                            pageLength: 25,
                            order: [[0, "asc"]],
                            dom: '<"d-flex align-items-center justify-content-between flex-wrap"lfB>rtip',
                            buttons: [{
                                extend: "collection",
                                text: '<i class="fas fa-download" aria-hidden="true"></i> Export',
                                autoClose: true,
                                buttons: [
                                    { extend: "csv", text: '<i class="fas fa-file-csv" aria-hidden="true"></i> Download CSV', filename: "xon-phishing-domains" },
                                    { extend: "copy", text: '<i class="fas fa-copy" aria-hidden="true"></i> Copy to clipboard' }
                                ]
                            }],
                            language: { emptyTable: "No live lookalike domains found. Good news." }
                        });
                    }
                    document.getElementById("pd-ph-results").hidden = false;
                    if (phishingTable) phishingTable.columns.adjust();
                })
                .catch(function (e) {
                    btn.disabled = false;
                    note(noteEl,
                        e && e.status === 429 ? authFailHtml(429)
                            : e && e.status === 404 ? "Domain not found. Check the spelling and try again."
                                : "The phishing scan is unavailable right now. Try again later.", "error");
                });
        });
    }

    var keyLoaded = false;
    function loadApiKey() {
        if (keyLoaded) return;
        keyLoaded = true;
        document.getElementById("pd-key-loading").hidden = false;
        $.ajax({ url: API + "/get-api-key/" + encodeURIComponent(token), type: "GET" })
            .done(function (res) {
                document.getElementById("pd-key-loading").hidden = true;
                renderApiKey(res && res.api_key);
            })
            .fail(function (error) {
                keyLoaded = false;
                document.getElementById("pd-key-loading").hidden = true;
                if (authRedirect(error)) return;
                if (error.status === 404) {
                    renderApiKey(null);
                } else {
                    note(document.getElementById("pd-key-note"), authFailHtml(error.status), "error");
                }
            });
    }

    function renderApiKey(key) {
        var box = document.getElementById("pd-key-box");
        var noteEl = document.getElementById("pd-key-note");
        noteEl.hidden = true;
        setText("pd-key-endpoint", API + "/domain-breaches/");
        document.getElementById("pd-key-curl").textContent =
            'curl -L -X POST -H "x-api-key: ' + (key || "YOUR_API_KEY") +
            '" -H "Content-Length: 0" ' + API + "/domain-breaches/";
        if (key) {
            box.hidden = false;
            var masked = key.slice(0, 4) + "************" + key.slice(-4);
            setText("pd-key-value", masked);
            var reveal = document.getElementById("pd-key-reveal");
            var copy = document.getElementById("pd-key-copy");
            var revealed = false;
            reveal.onclick = function () {
                revealed = !revealed;
                setText("pd-key-value", revealed ? key : masked);
                reveal.innerHTML = revealed
                    ? '<i class="fas fa-eye-slash" aria-hidden="true"></i> Hide'
                    : '<i class="fas fa-eye" aria-hidden="true"></i> Reveal';
            };
            copy.onclick = function () {
                function flash() {
                    copy.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Copied';
                    setTimeout(function () {
                        copy.innerHTML = '<i class="fas fa-copy" aria-hidden="true"></i> Copy';
                    }, 1600);
                }
                function fallback() {
                    var ta = document.createElement("textarea");
                    ta.value = key;
                    ta.style.position = "fixed";
                    ta.style.opacity = "0";
                    document.body.appendChild(ta);
                    ta.select();
                    try {
                        document.execCommand("copy");
                        flash();
                    } catch (e) {
                        window.prompt("Copy your API key:", key);
                    }
                    document.body.removeChild(ta);
                }
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(key).then(flash).catch(fallback);
                } else {
                    fallback();
                }
            };
        } else {
            box.hidden = true;
            note(noteEl, "No API key exists yet for this account. Generate one below.");
        }
        var gen = document.getElementById("pd-key-generate");
        gen.onclick = function () {
            if (key && !window.confirm("Generating a new key revokes the current one immediately. Continue?")) return;
            gen.disabled = true;
            fetch(API + "/create-api-key/" + encodeURIComponent(token))
                .then(function (r) {
                    if (!r.ok) throw { status: r.status };
                    return r.json();
                })
                .then(function (res) {
                    gen.disabled = false;
                    keyLoaded = true;
                    renderApiKey(res && res.api_key);
                })
                .catch(function (e) {
                    gen.disabled = false;
                    if (authRedirect(e)) return;
                    note(noteEl, authFailHtml(e && e.status), "error");
                });
        };
    }

    var overlayShown = false;
    function showOverlay() {
        if (overlayShown || !$.LoadingOverlay) return;
        overlayShown = true;
        $.LoadingOverlaySetup({
            background: "rgba(0, 0, 0, 0.5)",
            image: "/static/images/shield-alt.svg",
            imageAnimation: "1s fadein",
            imageColor: "#6daae0"
        });
        $.LoadingOverlay("show");
    }
    function hideOverlay() {
        if (!overlayShown || !$.LoadingOverlay) return;
        overlayShown = false;
        $.LoadingOverlay("hide");
    }

    function loadLive() {
        showOverlay();
        document.querySelector(".pd-email").textContent = email;
        setText("pd-greeting", greeting());
        setText("pd-greeting-sub", "Here is where " + email + " stands today, " + fmtDate(new Date()) + ".");
        document.getElementById("pd-signout").addEventListener("click", function (e) {
            e.preventDefault();
            var link = this;
            if (link.dataset.busy) return;
            link.dataset.busy = "1";
            function done() {
                window.location.href = "login";
            }
            if (email && token) {
                $.ajax({
                    url: API + "/dashboard/sign-out?email=" + encodeURIComponent(email) +
                        "&token=" + encodeURIComponent(token),
                    type: "POST"
                }).always(done);
            } else {
                done();
            }
        });
        document.getElementById("pd-overview-loading").hidden = false;
        setText("pd-risk-num", "-");
        setText("pd-risk-word", "");
        setText("pd-risk-why", "");
        ["pd-stat-breaches", "pd-stat-stealer", "pd-stat-passwords", "pd-stat-pastes"].forEach(function (id) {
            setText(id, "-");
        });
        navPill("pd-nav-breaches", "-");
        document.getElementById("pd-chart-card").hidden = true;
        document.getElementById("pd-strength").hidden = true;
        document.querySelector(".pd-checklist").innerHTML = "";
        document.querySelector(".pd-freshline").hidden = true;
        var cxo = document.getElementById("pd-open-cxo");
        if (cxo && token) {
            cxo.href = "breach-dashboard.html?email=" + encodeURIComponent(email) +
                "&token=" + encodeURIComponent(token);
        }
        document.querySelectorAll(".pd-live-only").forEach(function (el) { el.hidden = false; });
        if (!token) {
            document.querySelectorAll(".pd-needs-domain").forEach(function (el) {
                note(el, "This section needs a signed-in session. <a href='login'>Email me a sign-in link</a> and open this page from that email.");
            });
        }

        fetchAnalytics(Boolean(token));
        loadDbFreshness();
        if (token) loadDomainData();
    }

    function fetchAnalytics(withToken) {
        var analyticsUrl = API + "/breach-analytics?email=" + encodeURIComponent(email) +
            (withToken ? "&token=" + encodeURIComponent(token) : "");
        $.ajax(analyticsUrl)
            .done(function (response) {
                try {
                    populateOverview(response);
                } catch (e) {
                    note(document.getElementById("pd-overview-note"),
                        "We hit a problem rendering your data. Please reload the page.", "error");
                    populateBreachesPanel([], []);
                }
            })
            .fail(function (error) {
                if (withToken && (error.status === 403 || error.status === 401 || error.status === 400)) {
                    fetchAnalytics(false);
                    return;
                }
                hideOverlay();
                document.getElementById("pd-overview-loading").hidden = true;
                if (error.status === 404) {
                    populateOverview({});
                    setText("pd-risk-num", "0");
                    setText("pd-risk-word", "Low");
                    note(document.getElementById("pd-overview-note"),
                        token
                            ? "No breach data was found for this email."
                            : "No breach data was found. If Privacy Shield is on for this email, results are hidden by design. <a href='login'>Sign in</a> to see your own shielded data.");
                } else if (error.status === 0) {
                    var blockMsg = "The request to the breach-data API was blocked before it left your browser, most likely by an ad blocker: the endpoint name contains the word analytics, which many blocker filter lists match. Allow xposedornot.com in your blocker or pause it for this page, then reload.";
                    note(document.getElementById("pd-overview-note"), blockMsg, "error");
                    populateBreachesPanel([], []);
                    document.getElementById("pd-breaches-live").innerHTML =
                        '<p class="pd-empty-note">' + blockMsg + "</p>";
                    navPill("pd-nav-breaches", "-");
                } else {
                    if (authRedirect(error)) return;
                    note(document.getElementById("pd-overview-note"), authFailHtml(error.status), "error");
                    populateBreachesPanel([], []);
                    document.getElementById("pd-breaches-live").innerHTML =
                        '<p class="pd-empty-note">' + authFailHtml(error.status) + "</p>";
                    navPill("pd-nav-breaches", "-");
                }
            });
    }

    function initShield() {
        var btn = document.getElementById("pd-shield-btn");
        if (!btn) return;
        btn.addEventListener("click", function () {
            var noteEl = document.getElementById("pd-shield-note");
            var original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Sending...';
            $.ajax({ url: API + "/shield-on/" + encodeURIComponent(email), type: "GET" })
                .done(function (res) {
                    var already = res && res.Success === "AlreadyOn";
                    if (already) {
                        renderShieldStatus(true);
                    } else {
                        btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Email sent';
                    }
                    note(noteEl, already
                        ? "Privacy Shield is already on for " + esc(email) +
                            ". This email is hidden from public breach searches in XposedOrNot."
                        : "A confirmation email is on its way to " + esc(email) +
                            ". Privacy Shield turns on when you click the link in that email.");
                })
                .fail(function (error) {
                    btn.disabled = false;
                    btn.innerHTML = original;
                    note(noteEl, error.status === 429
                        ? "Rate limited. Wait a moment and try again."
                        : "We couldn't process the Shield request right now. Try again later.", "error");
                });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!liveMode) {
            window.location.replace("login");
            return;
        }
        initNav();
        initPhishing();
        initShield();
        loadLive();
    });
})();
