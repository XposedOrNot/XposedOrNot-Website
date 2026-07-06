(function () {
    var SVGNS = "http://www.w3.org/2000/svg";
    var API = "https://api.xposedornot.com/v1";
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

    function fmtDate(d) {
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }

    function note(el, html, tone) {
        el.innerHTML = html;
        el.hidden = false;
        el.style.borderLeft = tone === "error" ? "4px solid #cf222e" : "";
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
        if (info.xposed_date) return String(info.xposed_date);
        var d = info.breachedDate || info.breached_date || info.xposedDate || "";
        if (d) return String(d).slice(0, 4);
        d = info.added || info.addedDate || "";
        return d ? String(d).slice(0, 4) : "";
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
        [minYear, Math.round(minYear + span * 0.33), Math.round(minYear + span * 0.66)].forEach(function (yr) {
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

    function breachCard(b, stealer) {
        var chips = (b.xposed_data || "").split(";").filter(Boolean).map(function (c) {
            var pw = /password|cookie/i.test(c);
            return '<span class="pd-data-chip' + (pw ? " pd-data-chip-pw" : "") + '">' + esc(c.trim()) + "</span>";
        }).join("");
        var risk = { plaintext: "Plaintext passwords", easytocrack: "Easy-to-crack hashes", hardtocrack: "Strong hashes", unknown: "Password storage unknown" }[b.password_risk] || "";
        return '<article class="pd-breach">' +
            '<img class="pd-breach-logo" src="' + esc(b.logo || "/static/images/logos/logo.svg") + '" alt="" loading="lazy" onerror="this.src=\'/static/images/logos/logo.svg\'" />' +
            '<div class="pd-breach-main"><div class="pd-breach-title">' +
            '<a href="breach.html#' + encodeURIComponent(b.breach) + '">' + esc(b.breach) + "</a>" +
            (stealer ? '<span class="pd-badge-stealer"><i class="fas fa-bug" aria-hidden="true"></i> Stealer log</span>' : "") +
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
                sensitive.map(function (b) { return breachCard(b, false); }).join("") + "</div>";
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
            (token ? "&token=" + encodeURIComponent(token) : "") + '">Open your detailed report</a>.</p>';
        host.innerHTML = html;
        var btn = document.getElementById("pd-show-all");
        if (btn) {
            btn.addEventListener("click", function () {
                btn.insertAdjacentHTML("beforebegin",
                    rest.slice(LIMIT).map(function (b) { return breachCard(b, false); }).join(""));
                btn.remove();
            });
        }
        setText("pd-nav-breaches", String(sorted.length + (sensitive ? sensitive.length : 0)));
    }

    function populateOverview(data) {
        document.getElementById("pd-overview-loading").hidden = true;
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
            var latest = breaches.reduce(function (a, b) {
                return (b.added || "") > (a.added || "") ? b : a;
            });
            if (latest.added) {
                document.querySelector(".pd-freshline").hidden = false;
                setText("pd-freshness-date",
                    "latest exposure added " + fmtDate(new Date(latest.added)) + " (" + latest.breach + ")");
            }
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
                '<div><span class="pd-mini-name"><a href="breach.html#' + encodeURIComponent(b.name) + '">' + esc(b.name) + "</a></span> " +
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
                "<a href='breach.html#" + encodeURIComponent(r.breach) + "'>" + esc(r.breach) + "</a>",
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
                buttons: [
                    { extend: "copy", text: "Copy" },
                    { extend: "csv", text: "Export CSV", filename: "xon-domain-exposures" }
                ],
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
        if (!am || !am.alerts || !am.alerts.length) {
            host.innerHTML = '<div class="dashboard-card pd-card"><div class="pd-allclear"><i class="fas fa-check-circle" aria-hidden="true"></i>All clear<small>No pending breach alerts for your monitored domains.</small></div></div>';
            setText("pd-nav-alerts", "0");
            return;
        }
        var pending = (am.summary && am.summary.pending_count) || 0;
        setText("pd-nav-alerts", String(pending));
        host.innerHTML = '<ul class="pd-feed">' + am.alerts.map(function (a) {
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
                var data = (response && response.seniority_data) || [];
                renderVip(data);
            })
            .fail(function (error) {
                vipLoaded = false;
                note(document.getElementById("pd-vip-note"), authFailHtml(error.status), "error");
            });
    }

    function renderVip(data) {
        var filter = document.querySelector(".pd-vip-filter .pd-domchip-on");
        var level = filter ? filter.getAttribute("data-level") : "all";
        function norm(v) {
            return String(v || "").toLowerCase().replace(/[^a-z]/g, "");
        }
        var rows = data.filter(function (r) {
            return level === "all" || norm(r.seniority) === norm(level);
        });
        document.getElementById("pd-vip-body").innerHTML = rows.map(function (r) {
            var breaches = Array.isArray(r.breaches) ? r.breaches : [];
            return "<tr><td>" + esc(r.email) + "</td><td>" + esc(r.seniority || "") + "</td><td>" +
                breaches.length + "</td><td>" + esc(breaches.slice(0, 4).join(", ")) +
                (breaches.length > 4 ? " +" + (breaches.length - 4) + " more" : "") + "</td></tr>";
        }).join("") || '<tr><td colspan="4"><div class="pd-allclear"><i class="fas fa-check-circle" aria-hidden="true"></i>No exposed people at this level<small>That is exactly what you want to see here.</small></div></td></tr>';
        document.querySelectorAll(".pd-vip-filter button").forEach(function (btn) {
            btn.onclick = function () {
                document.querySelectorAll(".pd-vip-filter button").forEach(function (b) {
                    b.classList.remove("pd-domchip-on");
                });
                btn.classList.add("pd-domchip-on");
                renderVip(data);
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
                    var rows = (Array.isArray(data.raw_results) ? data.raw_results : []).map(function (r) {
                        return [
                            esc(r.domain || ""),
                            esc(r.fuzzer || ""),
                            esc((Array.isArray(r.dns_a) ? r.dns_a : []).join(", ")),
                            esc((Array.isArray(r.dns_ns) ? r.dns_ns : []).join(", ")),
                            esc((Array.isArray(r.dns_mx) ? r.dns_mx : []).join(", ")),
                            esc(r.whois_created || ""),
                            esc(r.whois_registrar || "")
                        ];
                    });
                    if (phishingTable) {
                        phishingTable.clear().rows.add(rows).draw();
                    } else if ($.fn.DataTable) {
                        phishingTable = $("#pd-ph-table").DataTable({
                            data: rows,
                            pageLength: 25,
                            dom: '<"d-flex align-items-center justify-content-between flex-wrap"lfB>rtip',
                            buttons: [
                                { extend: "copy", text: "Copy" },
                                { extend: "csv", text: "Export CSV", filename: "xon-phishing-domains" }
                            ],
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
            document.getElementById("pd-key-curl").textContent =
                'curl -L -X POST -H "x-api-key: ' + key + '" -H "Content-Length: 0" ' + API + "/domain-breaches/";
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
                    note(noteEl, authFailHtml(e && e.status), "error");
                });
        };
    }

    function loadLive() {
        document.querySelectorAll(".pd-preview-ribbon, .pd-sample-note").forEach(function (el) {
            el.hidden = true;
        });
        document.querySelector(".pd-email").textContent = email;
        document.querySelector(".pd-who-chips").hidden = true;
        setText("pd-greeting", greeting());
        setText("pd-greeting-sub", "Here is where " + email + " stands today, " + fmtDate(new Date()) + ".");
        document.getElementById("pd-signout").addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = "/";
        });
        document.getElementById("pd-overview-loading").hidden = false;
        setText("pd-risk-num", "-");
        setText("pd-risk-word", "");
        setText("pd-risk-why", "");
        ["pd-stat-breaches", "pd-stat-stealer", "pd-stat-passwords", "pd-stat-pastes"].forEach(function (id) {
            setText(id, "-");
        });
        setText("pd-nav-breaches", "-");
        document.getElementById("pd-chart-card").hidden = true;
        document.getElementById("pd-strength").hidden = true;
        document.querySelector(".pd-checklist").innerHTML = "";
        document.querySelector(".pd-freshline").hidden = true;
        var cxo = document.getElementById("pd-open-cxo");
        if (cxo && token) {
            cxo.href = "breach-dashboard.html?email=" + encodeURIComponent(email) +
                "&token=" + encodeURIComponent(token);
        }
        document.querySelectorAll(".pd-sample-only").forEach(function (el) { el.hidden = true; });
        document.querySelectorAll(".pd-live-only").forEach(function (el) { el.hidden = false; });
        if (!token) {
            document.querySelectorAll(".pd-needs-domain").forEach(function (el) {
                note(el, "This section needs your access token. Open the dashboard link from your domain-verification email, which includes both email and token.");
            });
        }

        fetchAnalytics(Boolean(token), false);
    }

    function fetchAnalytics(withToken, tokenRejected) {
        var analyticsUrl = API + "/breach-analytics?email=" + encodeURIComponent(email) +
            (withToken ? "&token=" + encodeURIComponent(token) : "");
        $.ajax(analyticsUrl)
            .done(function (response) {
                try {
                    populateOverview(response);
                    if (tokenRejected) {
                        note(document.getElementById("pd-overview-note"),
                            "Heads up: your dashboard token is for domain monitoring and was not accepted for the personal breach report, so this is the public view. Shielded and sensitive details stay hidden.");
                    }
                } catch (e) {
                    note(document.getElementById("pd-overview-note"),
                        "We hit a problem rendering your data. Please reload. If it persists, tell us.", "error");
                    populateBreachesPanel([], []);
                }
            })
            .fail(function (error) {
                document.getElementById("pd-overview-loading").hidden = true;
                if (withToken && (error.status === 403 || error.status === 401 || error.status === 400)) {
                    fetchAnalytics(false, true);
                    return;
                }
                if (error.status === 404) {
                    populateOverview({});
                    setText("pd-risk-num", "0");
                    setText("pd-risk-word", "Low");
                    var msg;
                    if (tokenRejected) {
                        msg = "There is no public breach data for this email. If Privacy Shield is on for it, results are hidden by design, and your domain-monitoring token cannot unlock the personal report yet. The Domains, Breach Analysis, VIP, Phishing, Alerts, and API Keys sections all work normally.";
                    } else if (token) {
                        msg = "No breach data was found for this email.";
                    } else {
                        msg = "No breach data was found. If Privacy Shield is on for this email, results are hidden by design.";
                    }
                    note(document.getElementById("pd-overview-note"), msg);
                } else if (error.status === 0) {
                    var blockMsg = "The request to api.xposedornot.com was blocked before it left your browser, most likely by an ad blocker: the endpoint name contains the word analytics, which many blocker filter lists match. Allow xposedornot.com in your blocker or pause it for this page, then reload.";
                    note(document.getElementById("pd-overview-note"), blockMsg, "error");
                    populateBreachesPanel([], []);
                    document.getElementById("pd-breaches-live").innerHTML =
                        '<p class="pd-empty-note">' + blockMsg + "</p>";
                    setText("pd-nav-breaches", "-");
                } else {
                    note(document.getElementById("pd-overview-note"), authFailHtml(error.status), "error");
                    populateBreachesPanel([], []);
                    document.getElementById("pd-breaches-live").innerHTML =
                        '<p class="pd-empty-note">' + authFailHtml(error.status) + "</p>";
                    setText("pd-nav-breaches", "-");
                }
            });
    }

    function initShield() {
        var btn = document.getElementById("pd-shield-btn");
        if (!btn) return;
        btn.addEventListener("click", function () {
            var noteEl = document.getElementById("pd-shield-note");
            if (!liveMode) {
                note(noteEl, "Design preview: open the dashboard with your email to manage Privacy Shield.");
                return;
            }
            btn.disabled = true;
            $.ajax({ url: API + "/shield-on/" + encodeURIComponent(email), type: "GET" })
                .done(function () {
                    btn.disabled = false;
                    note(noteEl, "A confirmation email is on its way to " + esc(email) +
                        ". Privacy Shield turns on when you click the link in that email. Until then, nothing changes.");
                })
                .fail(function (error) {
                    btn.disabled = false;
                    note(noteEl, error.status === 429
                        ? "Rate limited. Wait a moment and try again."
                        : "We couldn't process the Shield request right now. Try again later.", "error");
                });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initNav();
        initPhishing();
        initShield();
        if (liveMode) {
            loadLive();
        } else if (params.has("email") || params.has("token")) {
            document.querySelectorAll(".pd-preview-ribbon, .pd-sample-note").forEach(function (el) {
                el.hidden = true;
            });
            document.querySelectorAll(".pd-sample-only").forEach(function (el) { el.hidden = true; });
            setText("pd-greeting", "We couldn't sign you in");
            setText("pd-greeting-sub", "The link is missing a valid email address.");
            note(document.getElementById("pd-overview-note"),
                "This dashboard link looks incomplete or invalid. Open the most recent dashboard link from your XposedOrNot email, or request a fresh one from the <a href='domains'>domain verification page</a>.", "error");
            document.querySelectorAll(".pd-needs-domain").forEach(function (el) {
                note(el, "Sign in with a valid dashboard link to see this section.");
            });
            setText("pd-nav-breaches", "-");
            setText("pd-nav-alerts", "-");
        } else {
            document.querySelectorAll(".pd-needs-domain").forEach(function (el) {
                note(el, "This is the design preview. Open the dashboard with your email and access token to see live data here.");
            });
        }
    });
})();
