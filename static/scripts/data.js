var _loadedScripts = {};
function loadScriptOnce(url) {
    if (_loadedScripts[url]) return _loadedScripts[url];
    _loadedScripts[url] = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
    return _loadedScripts[url];
}

var D3_URL = 'https://cdnjs.cloudflare.com/ajax/libs/d3/6.7.0/d3.min.js';

function _setupHeatMapLazyLoad() {
    var container = document.getElementById('heatmap-container');
    if (!container || typeof IntersectionObserver === 'undefined') {
        loadScriptOnce(D3_URL).then(function () {
            if (typeof lastHeatMapData !== 'undefined' && lastHeatMapData) drawHeatMap(lastHeatMapData);
        });
        return;
    }
    var obs = new IntersectionObserver(function (entries, observer) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                observer.disconnect();
                loadScriptOnce(D3_URL).then(function () {
                    if (typeof lastHeatMapData !== 'undefined' && lastHeatMapData) drawHeatMap(lastHeatMapData);
                });
                break;
            }
        }
    }, { rootMargin: '200px' });
    obs.observe(container);
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

$.LoadingOverlaySetup({
    background: "rgba(0, 0, 0, 0.5)",
    image: "/static/images/shield-alt.svg",
    imageAnimation: "1s fadein",
    imageColor: "#6daae0"
});

$.LoadingOverlay("show");

$('body').append('<div id="sr-loading-status" class="sr-only" aria-live="polite" role="status">Loading your breach report...</div>');
$('#risk-analysis, #details, #industry, #attack-paths-content').removeAttr('aria-live');

$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results) {
        if (name === 'email') {
            throw new Error('Email parameter is required');
        }
        return null;
    }
    return results[1] || 0;
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

var confettiLoading = false;
function loadConfetti() {
    return new Promise(function (resolve, reject) {
        if (typeof confetti === 'function') {
            resolve();
            return;
        }
        if (confettiLoading) {
            var checkLoaded = setInterval(function () {
                if (typeof confetti === 'function') {
                    clearInterval(checkLoaded);
                    resolve();
                }
            }, 50);
            return;
        }
        confettiLoading = true;
        var script = document.createElement('script');
        script.src = '/static/scripts/libs/confetti.browser.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function fireConfetti() {
    loadConfetti().then(function () {
        var colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9EAA', '#A06CD5'];

        confetti({
            particleCount: 150,
            spread: 80,
            origin: { x: 0.2, y: 0.8 },
            colors: colors,
            ticks: 200,
            gravity: 1.2,
            scalar: 1.2,
            shapes: ['square', 'circle']
        });

        setTimeout(function () {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { x: 0.8, y: 0.8 },
                colors: colors,
                ticks: 200,
                gravity: 1.2,
                scalar: 1.2,
                shapes: ['square', 'circle']
            });
        }, 250);

        setTimeout(function () {
            confetti({
                particleCount: 100,
                spread: 100,
                origin: { x: 0.5, y: 0.9 },
                colors: colors,
                ticks: 150,
                gravity: 1,
                scalar: 1,
                shapes: ['square', 'circle']
            });
        }, 500);
    }).catch(function () {
    });
}

function showNoBreachView(emailAddr) {
    $.LoadingOverlay("hide");
    $('#sr-loading-status').text('Report loaded.');

    $('#main-content > section').slice(1).hide();
    $('#xr-jumpnav').hide();

    var safeEmail = escapeHtml(emailAddr);
    var isDark = isDarkModeActive();

    $('#main-content > section').first().find('.container').html(
        '<h1 class="report-h1">Your Data Breach Report</h1>' +
        '<div style="text-align:center; padding: 60px 20px; max-width: 600px; margin: 0 auto;">' +
            '<div style="font-size: 72px; margin-bottom: 20px;" role="img" aria-label="Celebration">&#127881;</div>' +
            '<h2 style="color: ' + (isDark ? '#5bb8d0' : '#28a745') + '; font-size: 28px; font-weight: 700; margin-bottom: 16px;">All Clear!</h2>' +
            '<p style="font-size: 18px; color: ' + (isDark ? '#ccc' : '#555') + '; margin-bottom: 12px;">' +
                '<strong>' + safeEmail + '</strong> was not found in any of the breaches we have indexed.' +
            '</p>' +
            '<p style="font-size: 16px; color: ' + (isDark ? '#aaa' : '#6c757d') + '; margin-bottom: 30px;">' +
                'Your email doesn\'t appear in our database of known breaches. Stay protected by setting up free alerts: we\'ll notify you if this changes.' +
            '</p>' +
            '<button type="button" class="btn btn-lg btn-alert" data-toggle="modal" data-target="#alertMeModal" style="margin-top: 10px;">' +
                '<i class="fa fa-bell" aria-hidden="true"></i>&nbsp; Get Free Breach Alerts' +
            '</button>' +
            '<p class="xr-allclear-alt">Want to double-check? <a href="password">See if a password of yours has been exposed</a>.</p>' +
        '</div>'
    );

    setTimeout(fireConfetti, 300);
}

function showErrorView(kind) {
    $.LoadingOverlay("hide");
    $('#sr-loading-status').text('Report could not be loaded.');
    $('#main-content > section').slice(1).hide();
    $('#xr-jumpnav, #floating-button, #dash-nudge').hide();
    var heading, body;
    if (kind === 'slow') {
        heading = 'Too many requests';
        body = "You're checking reports faster than our free service allows. Please wait a minute, then try again.";
    } else {
        heading = "We couldn't load your report";
        body = 'Something went wrong on our side. Please try again in a moment. If it keeps failing, check back a little later.';
    }
    $('#main-content > section').first().find('.container').html(
        '<h1 class="report-h1">Your Data Breach Report</h1>' +
        '<div class="xr-error-view" role="alert">' +
            '<div class="xr-error-icon" aria-hidden="true"><i class="fas fa-exclamation-triangle"></i></div>' +
            '<h2>' + heading + '</h2>' +
            '<p>' + body + '</p>' +
            '<button type="button" id="xr-error-retry" class="btn btn-primary">Try again</button>' +
        '</div>'
    );
    var retry = document.getElementById('xr-error-retry');
    if (retry) {
        retry.addEventListener('click', function () {
            window.location.reload();
        });
    }
}

let by26 = 0, by25 = 0, by24 = 0, by23 = 0, by22 = 0, by21 = 0, by20 = 0, by19 = 0, by18 = 0, by17 = 0, by16 = 0, by15 = 0, by14 = 0, by13 = 0, by12 = 0, by11 = 0, by10 = 0, by09 = 0, by08 = 0, by07 = 0;
let i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0;
let unknown = 0, plaintext = 0, easy = 0, hard = 0, password_score = 0;

function getAlertType(riskLabel) {
    switch (riskLabel) {
        case 'Low':
            return 'success';
        case 'Moderate':
            return 'warning';
        case 'High':
            return 'danger';
        case 'Critical':
            return 'danger';
        default:
            return 'secondary';
    }
}

function generateRiskAnalysis(riskLabel, jsonResponse) {
    const breachesDetails = jsonResponse.ExposedBreaches.breaches_details;
    const xposedData = jsonResponse.BreachMetrics.xposed_data[0].children;
    const alertType = getAlertType(riskLabel);

    const plaintextBreaches = [];
    const easyToCrackBreaches = [];
    breachesDetails.forEach(function(breach) {
        if (breach.password_risk === 'plaintext') {
            plaintextBreaches.push(escapeHtml(breach.breach));
        } else if (breach.password_risk === 'easytocrack') {
            easyToCrackBreaches.push(escapeHtml(breach.breach));
        }
    });
    const totalPasswordBreaches = plaintextBreaches.length + easyToCrackBreaches.length;

    const piiCount = xposedData.find(function(c) { return c.name.includes("Personal Identification"); })?.children.reduce(function(s, i) { return s + i.value; }, 0) || 0;
    const commsCount = xposedData.find(function(c) { return c.name.includes("Communication and Social Interactions"); })?.children.reduce(function(s, i) { return s + i.value; }, 0) || 0;
    const demoCount = xposedData.find(function(c) { return c.name.includes("Demographics"); })?.children.reduce(function(s, i) { return s + i.value; }, 0) || 0;

    let introIcon, introTitle, introBody, introClass;
    switch (riskLabel) {
        case 'Critical':
            introIcon = '🔴';
            introTitle = 'Your accounts are at serious risk';
            introBody = 'Sensitive data like passwords or financial info has been exposed in multiple breaches. You should act on the steps below right away.';
            introClass = 'risk-intro-critical';
            break;
        case 'High':
            introIcon = '🟠';
            introTitle = 'Important data has been exposed';
            introBody = 'Your email shows up in breaches that leaked sensitive data. Change your compromised passwords now to stay safe.';
            introClass = 'risk-intro-high';
            break;
        case 'Moderate':
            introIcon = '🟡';
            introTitle = 'Some of your data has been exposed';
            introBody = 'Your email was found in a few data breaches. Check the details below and secure any affected accounts.';
            introClass = 'risk-intro-medium';
            break;
        default:
            introIcon = '🟢';
            introTitle = 'Your exposure is limited';
            introBody = 'Your email has very little breach exposure. Follow the steps below to stay protected.';
            introClass = 'risk-intro-low';
    }

    let html = '<div class="risk-analysis">';

    html += '<div class="risk-intro ' + introClass + '">';
    html += '<div class="risk-intro-icon" role="img" aria-label="' + riskLabel + ' risk">' + introIcon + '</div>';
    html += '<div class="risk-intro-text"><h3>' + introTitle + '</h3>';
    html += '<p>' + introBody + '</p></div></div>';

    html += '<div class="risk-cards">';

    if (totalPasswordBreaches > 0) {
        html += '<div class="risk-card risk-card-critical">';
        html += '<div class="risk-card-header">';
        html += '<span class="risk-card-icon" role="img" aria-label="Compromised passwords">⛓️‍💥</span>';
        html += '<span class="risk-card-title">Compromised Passwords</span>';
        html += '<span class="risk-badge risk-badge-high">' + totalPasswordBreaches + (totalPasswordBreaches === 1 ? ' breach' : ' breaches') + '</span>';
        html += '</div>';

        if (plaintextBreaches.length > 0) {
            html += '<p class="risk-card-impact">Your passwords were leaked <strong>in plain text</strong> from:</p>';
            html += '<div class="risk-card-breaches">';
            plaintextBreaches.forEach(function(name) {
                html += '<span class="risk-breach-name">' + name + '</span>';
            });
            html += '</div>';
        }
        if (easyToCrackBreaches.length > 0) {
            html += '<p class="risk-card-impact">' + (plaintextBreaches.length > 0 ? 'Additionally, passwords' : 'Your passwords') + ' from these breaches are <strong>easy to crack</strong>:</p>';
            html += '<div class="risk-card-breaches">';
            easyToCrackBreaches.forEach(function(name) {
                html += '<span class="risk-breach-name">' + name + '</span>';
            });
            html += '</div>';
        }

        html += '<div class="risk-card-action"><strong>Do this now:</strong> Change your password on ';
        const allBreachNames = plaintextBreaches.concat(easyToCrackBreaches);
        if (allBreachNames.length <= 3) {
            html += allBreachNames.join(', ');
        } else {
            html += 'these ' + allBreachNames.length + ' sites';
        }
        html += ' right away. Use a password manager like Bitwarden (free) to create a unique password for every account.</div>';
        html += '</div>';
    }

    if (piiCount > 0) {
        html += '<div class="risk-card risk-card-warning">';
        html += '<div class="risk-card-header">';
        html += '<span class="risk-card-icon" role="img" aria-label="Personal information">👤</span>';
        html += '<span class="risk-card-title">Personal Information Exposed</span>';
        html += '<span class="risk-badge risk-badge-medium">' + piiCount + (piiCount === 1 ? ' occurrence' : ' occurrences') + '</span>';
        html += '</div>';
        html += '<p class="risk-card-impact">Your personal details (name, address, phone, or date of birth) have been exposed. This data can be used for identity theft, fake accounts, or social engineering attacks.</p>';
        html += '<div class="risk-card-action"><strong>Do this now:</strong> Contact your bank to turn on transaction alerts and fraud monitoring. Check if your country offers a credit freeze or identity protection service. Watch out for calls, emails, or mail that mention your personal details.</div>';
        html += '</div>';
    }

    if (commsCount > 0) {
        html += '<div class="risk-card risk-card-info">';
        html += '<div class="risk-card-header">';
        html += '<span class="risk-card-icon" role="img" aria-label="Email exposure">📧</span>';
        html += '<span class="risk-card-title">Email &amp; Communication Exposure</span>';
        html += '<span class="risk-badge risk-badge-low">' + commsCount + (commsCount === 1 ? ' occurrence' : ' occurrences') + '</span>';
        html += '</div>';
        html += '<p class="risk-card-impact">Your email address and communication details are out there. Watch out for phishing emails, spam, and social engineering tricks, especially emails that mention breached services by name.</p>';
        html += '<div class="risk-card-action"><strong>Do this now:</strong> Never click password reset links you did not ask for. If an email mentions a breach you recognize, go to that site directly (type the URL yourself) instead of clicking any link. Turn on 2FA on your email account. It is the single best thing you can do to protect yourself.</div>';
        html += '</div>';
    }

    if (demoCount > 0) {
        html += '<div class="risk-card risk-card-info">';
        html += '<div class="risk-card-header">';
        html += '<span class="risk-card-icon" role="img" aria-label="Demographic data">📊</span>';
        html += '<span class="risk-card-title">Demographic Data Exposed</span>';
        html += '<span class="risk-badge risk-badge-low">' + demoCount + (demoCount === 1 ? ' occurrence' : ' occurrences') + '</span>';
        html += '</div>';
        html += '<p class="risk-card-impact">Demographic info like age, gender, location, or occupation has been exposed. This data is used to build profiles for targeted scams and impersonation.</p>';
        html += '<div class="risk-card-action"><strong>Do this now:</strong> Review your social media privacy settings and limit what is publicly visible. Be wary of unexpected calls or messages from people who seem to know personal details about you.</div>';
        html += '</div>';
    }

    html += '</div>';

    html += generateNextSteps(breachesDetails, jsonResponse);

    html += '</div>';
    return html;
}

function showReportEmailEntry() {
    $.LoadingOverlay("hide");
    $('#sr-loading-status').remove();
    $('#floating-button, #dash-nudge').hide();
    $('#xr-jumpnav').hide();
    var main = document.getElementById('main-content') || document.body;
    main.innerHTML =
        '<div class="xon-row2-left" role="region" aria-label="Generate your breach report" style="max-width: 520px; margin: 70px auto; padding: 32px 28px; text-align: center;">' +
        '<h1 style="font-size: 24px; margin-bottom: 12px;">Your Data Breach Report</h1>' +
        '<p style="margin-bottom: 20px;">For your privacy, report links no longer contain an email address. Enter your email to generate your report. It stays in your browser.</p>' +
        '<form id="report-email-form" novalidate>' +
        '<label for="report-email-input" class="sr-only">Email address</label>' +
        '<input id="report-email-input" type="email" class="form-control" required placeholder="you@example.com" autocomplete="email" style="margin-bottom: 12px;" />' +
        '<button type="submit" class="btn btn-primary btn-block">View my report</button>' +
        '<p id="report-email-error" role="alert" class="xr-form-error" style="display: none; margin-top: 10px;">Please enter a valid email address.</p>' +
        '</form></div>';
    document.getElementById('report-email-form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var value = document.getElementById('report-email-input').value.toLowerCase().trim();
        if (!validateEmail(value)) {
            $('#report-email-error').show();
            return;
        }
        try {
            sessionStorage.setItem('xon_report_session', JSON.stringify({ email: value, token: null }));
        } catch (e) {}
        window.location.reload();
    });
    var input = document.getElementById('report-email-input');
    if (input) input.focus();
}

let email, token;

(function () {
    var TAB_KEY = 'xon_report_session';
    var HANDOFF_KEY = 'xon_report_email';

    function fromTab() {
        try {
            var d = JSON.parse(sessionStorage.getItem(TAB_KEY));
            if (d && typeof d.email === 'string' && d.email) return d;
        } catch (e) {}
        return null;
    }

    function fromHandoff() {
        var raw = null;
        try {
            raw = localStorage.getItem(HANDOFF_KEY);
            if (raw) localStorage.removeItem(HANDOFF_KEY);
        } catch (e) {}
        if (!raw) {
            try {
                raw = sessionStorage.getItem(HANDOFF_KEY);
                if (raw) sessionStorage.removeItem(HANDOFF_KEY);
            } catch (e) {}
        }
        if (!raw) return null;
        try {
            var d = JSON.parse(raw);
            if (d && typeof d.email === 'string' && d.email && Date.now() - d.ts < 300000) {
                return { email: d.email, token: (typeof d.token === 'string' && d.token) ? d.token : null };
            }
        } catch (e) {}
        return null;
    }

    var params = null;
    try { params = new URLSearchParams(window.location.search); } catch (e) {}
    var urlEmail = params ? params.get('email') : null;
    var urlToken = params ? params.get('token') : null;

    var resolved = null;
    if (urlEmail) {
        resolved = { email: urlEmail.toLowerCase(), token: urlToken || null };
    } else {
        resolved = fromTab() || fromHandoff();
    }

    if (params && (params.has('email') || params.has('token'))) {
        params.delete('email');
        params.delete('token');
        var query = params.toString();
        try {
            window.history.replaceState(window.history.state, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash);
        } catch (e) {}
    }

    if (resolved) {
        email = resolved.email;
        token = resolved.token || null;
        try { sessionStorage.setItem(TAB_KEY, JSON.stringify({ email: email, token: token })); } catch (e) {}
    }
})();

if (!email || !validateEmail(email)) {
    $(showReportEmailEntry);
    throw new Error('XposedOrNot: no email available for this report, showing the entry form');
}

const emailHeader = (category, prefixHtml = '') => `<h2 class="section-heading">${prefixHtml}${escapeHtml(category)} for: ${escapeHtml(email)}</h2>`;

$("#email").html(emailHeader("Breach Summary"));
$("#email_sensitive").html(emailHeader('Sensitive Data Breaches', '<span class="help-icon" tabindex="0" aria-label="Sensitive breach explanation" data-toggle="tooltip" data-placement="auto" title="Breaches that cannot be publicly searched considering the sensitivity of the data exposed."><i class="fas fa-question-circle" aria-hidden="true"></i></span>&nbsp;&nbsp; '));
$("#data").html(emailHeader("What Data Was Exposed"));

$("#db-sensitive").show();
$("#sensitive-data-table").hide();
document.getElementById("db-sensitive").className = "alert alert-info";
$("#db-sensitive").html(`
    <i class="fas fa-lock" aria-hidden="true"></i>
    <strong>Unlock Your Full Breach Report</strong>
    <p style="font-size:16px; margin-top:10px;">
        Some breaches contain sensitive data that requires email verification to view.
        Verify your email to see your complete breach exposure.
    </p>
    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal" data-intent="unlock">
        <i class="fas fa-envelope" aria-hidden="true"></i> Verify Email Now
    </button>
`);

const url = token
    ? `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
    : `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;

let jsonResponse;

if (!token) {
    $("#db-sensitive").show();
    $("#sensitive-data-table").hide();
    document.getElementById("db-sensitive").className = "alert alert-info";
    $("#db-sensitive").html(`
        <i class="fas fa-lock" aria-hidden="true"></i>
        <strong>Unlock Your Full Breach Report</strong>
        <p style="font-size:16px; margin-top:10px;">
            Some breaches contain sensitive data that requires email verification to view.
            Verify your email to see your complete breach exposure.
        </p>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal" data-intent="unlock">
            <i class="fas fa-envelope" aria-hidden="true"></i> Verify Email Now
        </button>
    `);
}

(function () {
    var nudge = document.getElementById('dash-nudge');
    if (!nudge || token) return;
    var storageKey = 'xon-dash-nudge-dismissed';
    try {
        var dismissedAt = parseInt(localStorage.getItem(storageKey), 10);
        if (dismissedAt && Date.now() - dismissedAt < 1209600000) return;
    } catch (e) {}
    var link = document.getElementById('dash-nudge-link');
    if (link && email && email.indexOf('@') > -1) {
        link.href = '/login?email=' + encodeURIComponent(email);
    }
    nudge.hidden = false;
    var dismiss = document.getElementById('dash-nudge-dismiss');
    if (dismiss) {
        dismiss.addEventListener('click', function () {
            nudge.hidden = true;
            try { localStorage.setItem(storageKey, String(Date.now())); } catch (e) {}
        });
    }
})();

(function renderReportMeta() {
    var el = document.getElementById('xr-report-meta');
    if (!el) return;
    var lang = document.documentElement.lang || 'en';
    var opts = { year: 'numeric', month: 'short', day: 'numeric' };
    var dateStr;
    try {
        dateStr = new Date().toLocaleDateString(lang, opts);
    } catch (e) {
        dateStr = new Date().toLocaleDateString('en', opts);
    }
    var prefix = 'Report for <strong>' + escapeHtml(email) + '</strong>, generated on ' + dateStr;
    el.innerHTML = prefix + '.';
    $.get('https://api.xposedornot.com/v1/metrics')
        .done(function (m) {
            var n = m && parseInt(m.Breaches_Count, 10);
            if (n > 0) {
                el.innerHTML = prefix + ', checked against ' + n.toLocaleString() + ' data breaches.';
            }
        })
        .fail(function () {
        });
})();

var j = $.ajax(url)
    .done(function (response) {
        jsonResponse = response;

        if (token) {
            if (jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.sensitive_breaches_details) {
                const sensitiveBreaches = jsonResponse.ExposedBreaches.sensitive_breaches_details;

                if (!sensitiveBreaches || sensitiveBreaches.length === 0) {
                    $("#db-sensitive").show();
                    $("#sensitive-data-table").hide();
                    document.getElementById("db-sensitive").className = "visible alert alert-success";
                    $("#db-sensitive").html(`
                        <i class="fas fa-check-circle" aria-hidden="true"></i>
                        <strong>No sensitive data breaches found for your email</strong>
                        <p><strong>Good news!</strong></p>
                    `);
                } else {
                    $("#db-sensitive").hide();
                    $("#sensitive-data-table").show();
                    attachBreachSort('data_breach_sensitive', sensitiveBreaches, true, 'xr-sort-sensitive');
                }
            } else {
                $("#db-sensitive").show();
                $("#sensitive-data-table").hide();
                document.getElementById("db-sensitive").className = "visible alert alert-success";
                $("#db-sensitive").html(`
                    <i class="fas fa-check-circle" aria-hidden="true"></i>
                    <strong>No sensitive data breaches found for your email</strong>
                    <h3><strong>Good news!</strong></h3>
                `);
            }
        } else if (jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.sensitive_breaches_details &&
            jsonResponse.ExposedBreaches.sensitive_breaches_details.length > 0) {

            $("#db-sensitive").show();
            $("#sensitive-data-table").hide();
            document.getElementById("db-sensitive").className = "alert alert-info";
            $("#db-sensitive").html(`
                <i class="fas fa-lock" aria-hidden="true"></i>
                <strong>Unlock Your Full Breach Report</strong>
                <p style="font-size:16px; margin-top:10px;">
                    Some breaches contain sensitive data that requires email verification to view.
                    Verify your email to see your complete breach exposure.
                </p>
                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal" data-intent="unlock">
                    <i class="fas fa-envelope" aria-hidden="true"></i> Verify Email Now
                </button>
            `);
        }

        breachesDetailsHtml = ''
        breachesSite = '', xposedData = '', riskScore = '', riskLabel = '';
        let passwordScore = 0;
        const passwordsCounts = [];

        if (!jsonResponse.BreachesSummary || !jsonResponse.BreachMetrics ||
            !jsonResponse.BreachMetrics.xposed_data || !jsonResponse.BreachMetrics.risk) {
            showNoBreachView(email);
            return;
        }

        breachesSite = jsonResponse.BreachesSummary.site;
        xposedData = jsonResponse.BreachMetrics.xposed_data[0]
        riskScore = jsonResponse.BreachMetrics.risk[0].risk_score
        riskLabel = jsonResponse.BreachMetrics.risk[0].risk_label

        const riskAnalysisHtml = generateRiskAnalysis(riskLabel, jsonResponse);
        $('#risk-analysis').html(riskAnalysisHtml);

        drawHeatMap(xposedData.children)

        if (token) {
            var attackPaths = detectAttackPaths(jsonResponse.ExposedBreaches.breaches_details, email);
            renderAttackPaths(attackPaths);
        } else {
            renderSampleAttackPath();
        }

        renderRiskBand(Math.round(riskScore));
        renderExposureSummary(jsonResponse);
        renderStatTiles(jsonResponse);

        function renderRiskBand(score) {
            var el = document.getElementById('chart_div');
            if (!el) return;
            el.removeAttribute('role');
            el.removeAttribute('aria-label');
            var clamped = Math.max(0, Math.min(100, score));
            el.innerHTML =
                '<div class="xr-riskband-wrap">' +
                '<div class="xr-riskband-score">' + clamped + '<span> / 100</span></div>' +
                '<div class="xr-riskband" role="img" aria-label="Risk score ' + clamped + ' out of 100. Bands: Low 0 to 25, Moderate 26 to 50, High 51 to 75, Critical 76 to 100.">' +
                '<span class="xr-riskband-marker" style="left: ' + clamped + '%"></span>' +
                '</div>' +
                '<div class="xr-riskband-scale" aria-hidden="true"><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span></div>' +
                '<details class="xr-howcalc"><summary>How is this calculated? <i class="fas fa-chevron-down" aria-hidden="true"></i></summary>' +
                '<p>The score weighs four things: how many breaches your email appears in, how recent they are, whether passwords were exposed and how they were stored (plaintext weighs most, strong hashes least), and whether sensitive data or stealer-log captures are involved. One recent plaintext exposure can outweigh several old, well-hashed ones.</p>' +
                '</details>' +
                '</div>';
        }

        let alertType;
        switch (riskLabel) {
            case "Low":
                alertType = "success";
                break;
            case "Moderate":
                alertType = "warning";
                break;
            case "High":
                alertType = "danger";
                break;
            case "Critical":
                alertType = "danger";
                break;
            default:
                alertType = "warning";
        }

        const riskScoreHtml = `<h2 class="section-heading section-heading-${alertType}">Your Risk Score: <span class="risk-level-${alertType}">${riskLabel}</span></h2>`;
        $('#risk').html(riskScoreHtml);

        if (xposedData.toString().length > 0) {
            by26 = jsonResponse.BreachMetrics.yearwise_details[0].y2026;
            by25 = jsonResponse.BreachMetrics.yearwise_details[0].y2025;
            by24 = jsonResponse.BreachMetrics.yearwise_details[0].y2024;
            by23 = jsonResponse.BreachMetrics.yearwise_details[0].y2023;
            by22 = jsonResponse.BreachMetrics.yearwise_details[0].y2022;
            by21 = jsonResponse.BreachMetrics.yearwise_details[0].y2021;
            by20 = jsonResponse.BreachMetrics.yearwise_details[0].y2020;
            by19 = jsonResponse.BreachMetrics.yearwise_details[0].y2019;
            by18 = jsonResponse.BreachMetrics.yearwise_details[0].y2018;
            by17 = jsonResponse.BreachMetrics.yearwise_details[0].y2017;
            by16 = jsonResponse.BreachMetrics.yearwise_details[0].y2016;
            by15 = jsonResponse.BreachMetrics.yearwise_details[0].y2015;
            by14 = jsonResponse.BreachMetrics.yearwise_details[0].y2014;
            by13 = jsonResponse.BreachMetrics.yearwise_details[0].y2013;
            by12 = jsonResponse.BreachMetrics.yearwise_details[0].y2012;
            by11 = jsonResponse.BreachMetrics.yearwise_details[0].y2011;
            by10 = jsonResponse.BreachMetrics.yearwise_details[0].y2010;
            by09 = jsonResponse.BreachMetrics.yearwise_details[0].y2009;
            by08 = jsonResponse.BreachMetrics.yearwise_details[0].y2008;
            by07 = jsonResponse.BreachMetrics.yearwise_details[0].y2007;
            plaintext = jsonResponse.BreachMetrics.passwords_strength[0].PlainText;
            easy = jsonResponse.BreachMetrics.passwords_strength[0].EasyToCrack;
            hard = jsonResponse.BreachMetrics.passwords_strength[0].StrongHash;
            unknown = jsonResponse.BreachMetrics.passwords_strength[0].Unknown;
            passwordsCounts.push({
                'easy': easy,
                'hard': hard,
                'plaintext': plaintext,
                'unknown': unknown
            })
            password_score = (plaintext / (easy + hard + plaintext + unknown)) * 100

            industries = jsonResponse.BreachMetrics.industry[0];

            if (jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.sensitive_breaches_details) {
                const sensitiveBreaches = jsonResponse.ExposedBreaches.sensitive_breaches_details;

                const industryMap = new Map();
                industries.forEach(ind => {
                    industryMap.set(ind[0], ind[1]);
                });

                const industryCodeMap = {
                    'aerospace': 'aero', 'transport': 'tran', 'information technology': 'info',
                    'telecommunication': 'tele', 'agriculture': 'agri', 'construction': 'cons',
                    'education': 'educ', 'pharmaceutical': 'phar', 'food': 'food',
                    'health care': 'heal', 'hospitality': 'hosp', 'entertainment': 'ente',
                    'news media': 'news', 'energy': 'ener', 'manufacturing': 'manu',
                    'music': 'musi', 'mining': 'mini', 'electronics': 'elec',
                    'miscellaneous': 'misc', 'finance': 'fina', 'retail': 'reta',
                    'non-profit/charities': 'nonp', 'government': 'govt',
                    'sports': 'spor', 'environment': 'envi'
                };

                sensitiveBreaches.forEach(breach => {
                    const industry = industryCodeMap[breach.industry.toLowerCase()] || breach.industry.toLowerCase().substring(0, 4);
                    if (industryMap.has(industry)) {
                        industryMap.set(industry, industryMap.get(industry) + 1);
                    } else {
                        industryMap.set(industry, 1);
                    }
                });

                industries = Array.from(industryMap.entries());
            }

            for (var i = 0; i < industries.length; i++) {
                var ind_split = industries[i];
                var categoryName = ind_split[0];
                var categoryCount = ind_split[1];

                switch (categoryName) {
                    case "aero": i1 = categoryCount; break;
                    case "tran": i2 = categoryCount; break;
                    case "info": i3 = categoryCount; break;
                    case "tele": i4 = categoryCount; break;
                    case "agri": i5 = categoryCount; break;
                    case "cons": i6 = categoryCount; break;
                    case "educ": i7 = categoryCount; break;
                    case "phar": i8 = categoryCount; break;
                    case "food": i9 = categoryCount; break;
                    case "heal": i10 = categoryCount; break;
                    case "hosp": i11 = categoryCount; break;
                    case "ente": i12 = categoryCount; break;
                    case "news": i13 = categoryCount; break;
                    case "ener": i14 = categoryCount; break;
                    case "manu": i15 = categoryCount; break;
                    case "musi": i16 = categoryCount; break;
                    case "mini": i17 = categoryCount; break;
                    case "elec": i18 = categoryCount; break;
                    case "misc": i19 = categoryCount; break;
                    case "fina": i20 = categoryCount; break;
                    case "reta": i21 = categoryCount; break;
                    case "nonp": i22 = categoryCount; break;
                    case "govt": i23 = categoryCount; break;
                    case "spor": i24 = categoryCount; break;
                    case "envi": i25 = categoryCount; break;
                }
            }

            var counts = [{
                name: 'Aerospace',
                cnt: i1
            },
            {
                name: 'Transport',
                cnt: i2
            },
            {
                name: 'Information Technology',
                cnt: i3
            },
            {
                name: 'Telecommunication',
                cnt: i4
            },
            {
                name: 'Agriculture',
                cnt: i5
            },
            {
                name: 'Construction',
                cnt: i6
            },
            {
                name: 'Education',
                cnt: i7
            },
            {
                name: 'Pharmaceutical',
                cnt: i8
            },
            {
                name: 'Food',
                cnt: i9
            },
            {
                name: 'Health Care',
                cnt: i10
            },
            {
                name: 'Hospitality',
                cnt: i11
            },
            {
                name: 'Entertainment',
                cnt: i12
            },
            {
                name: 'News Media',
                cnt: i13
            },
            {
                name: 'Energy',
                cnt: i14
            },
            {
                name: 'Manufacturing',
                cnt: i15
            },
            {
                name: 'Music',
                cnt: i16
            },
            {
                name: 'Mining',
                cnt: i17
            },
            {
                name: 'Electronics',
                cnt: i18
            },
            {
                name: 'Miscellaneous',
                cnt: i19
            },
            {
                name: 'Finance',
                cnt: i20
            },
            {
                name: 'Retail',
                cnt: i21
            },
            {
                name: 'Non-Profit/Charities',
                cnt: i22
            },
            {
                name: 'Government',
                cnt: i23
            },
            {
                name: 'Sports',
                cnt: i24
            },
            {
                name: 'Environment',
                cnt: i25
            }
            ];

            counts.sort((a, b) => b.cnt - a.cnt);

            function getBadgeClass(count) {
                if (count > 10) return 'high';
                if (count > 5) return 'medium';
                return 'low';
            }

            let industryList = `
                <div class="industry-list">
                    <div class="row">
                        ${counts.filter(item => item.cnt > 0).map(item => `
                            <div class="${window.innerWidth <= 767 ? 'col-12' : 'col-md-6'} mb-2">
                                <div class="industry-item ${item.cnt > 0 ? 'has-breaches' : ''}">
                                    <span class="industry-name">${item.name}</span>
                                    <span class="badge badge-${getBadgeClass(item.cnt)}">${item.cnt}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
                .industry-list {
                    padding: 15px;
                }
                .industry-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    border-radius: 8px;
                    background-color: #f8f9fa;
                    transition: all 0.3s ease;
                    margin-bottom: 8px;
                }
                .industry-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .industry-name {
                    font-weight: 500;
                    color: #2d3436;
                }
                .badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                }
                .badge-high {
                    background-color: #d63031;
                    color: white;
                }
                .badge-medium {
                    background-color: #fdcb6e;
                    color: #2d3436;
                }
                .badge-low {
                    background-color: #2874a6;
                    color: white;
                }
                [data-theme="dark"] .badge-low {
                    background-color: #2874a6;
                    color: white;
                    border: none;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                }
                @media (max-width: 767px) {
                    .industry-list .row {
                        margin: 0 !important;
                    }
                    .industry-item {
                        margin-bottom: 10px;
                    }
                }
            `;
            document.head.appendChild(style);

            $('#industry').html(industryList);

            const githubSection = `
                <div class="github-collab-section">
                    <div class="xr-gh-grid">
                        <div class="xr-gh-main">
                            <h3><i class="fas fa-star xr-gh-star" aria-hidden="true"></i> Helped you today? A star helps the next person</h3>
                            <p>
                                XposedOrNot is free, open source, and community run.
                                No ads, no trackers, and your data is never sold.
                                Don't take our word for it, the code for this entire
                                report is public.
                            </p>
                            <div class="xr-gh-chips">
                                <span class="xr-gh-chip">
                                    <i class="fas fa-code" aria-hidden="true"></i> Open source
                                </span>
                                <span class="xr-gh-chip">
                                    <i class="fas fa-heart" aria-hidden="true"></i> Free forever
                                </span>
                                <span class="xr-gh-chip">
                                    <i class="fas fa-eye-slash" aria-hidden="true"></i> No ads or trackers
                                </span>
                            </div>
                        </div>
                        <div class="xr-gh-actions">
                            <a href="https://github.com/XposedOrNot" target="_blank" rel="noopener" class="btn btn-github">
                                <i class="fab fa-github" aria-hidden="true"></i> Star on GitHub<span class="sr-only"> (opens in new tab)</span>
                            </a>
                            <span class="xr-gh-note">Takes one click, means a lot</span>
                            <a href="api_doc" class="xr-gh-link">
                                <i class="fas fa-code" aria-hidden="true"></i> Explore the free API
                            </a>
                        </div>
                    </div>
                </div>
            `;

            $('#github-section').html(githubSection);

            breachesDetailsHtml = ''
            if (jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.breaches_details) {
                const regularBreaches = jsonResponse.ExposedBreaches.breaches_details;
                attachBreachSort('data_breach', regularBreaches, false, 'xr-sort-regular');
                for (var i = 0; i < regularBreaches.length; i++) {
                    breachesDetailsHtml += generateBreachDetailHtml(regularBreaches[i], false);
                }
            }

            if (token && jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.sensitive_breaches_details) {
                const sensitiveBreaches = jsonResponse.ExposedBreaches.sensitive_breaches_details;
                for (var i = 0; i < sensitiveBreaches.length; i++) {
                    breachesDetailsHtml += generateBreachDetailHtml(sensitiveBreaches[i], true);
                }
            }

            nn = "";
            if (xposedData.toString().length <= 0) {
                document.getElementById("db-s").className = "visible alert alert-success";
                $("#db-s").show();
            } else {
                breachesCountsArray = []
                if (jsonResponse.ExposedBreaches.breaches_details) {
                    jsonResponse.ExposedBreaches.breaches_details.forEach(breach => {
                        breachesCountsArray.push({
                            'breach': breach.breach,
                            'cnt': breach.xposed_records
                        });
                    });
                }

                if (token && jsonResponse.ExposedBreaches.sensitive_breaches_details) {
                    jsonResponse.ExposedBreaches.sensitive_breaches_details.forEach(breach => {
                        breachesCountsArray.push({
                            'breach': breach.breach,
                            'cnt': breach.xposed_records
                        });
                    });
                }
            }

            breachesCountsArray.sort(function (a, b) {
                return b.cnt - a.cnt;
            });

            breachesCountsArray = breachesCountsArray.slice(0, 5);
            breaches_id = [];
            breaches_cnt = [];

            for (i = 0; i < breachesCountsArray.length; i++) {
                breaches_id.push(breachesCountsArray[i].breach);
                breaches_cnt.push(parseInt(breachesCountsArray[i].cnt));
            }
            var top5 = document.getElementById('top5breaches');

            top5.parentElement.style.height = '400px';

            const isMobile = window.innerWidth <= 767;

            top5ChartInstance = new Chart(top5, {
                type: 'doughnut',
                data: {
                    labels: breaches_id,
                    datasets: [{
                        data: breaches_cnt,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    layout: {
                        padding: {
                            top: 20,
                            right: 20,
                            bottom: 40,
                            left: 20
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                color: getChartTextColor(),
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                },
                                usePointStyle: true,
                                boxWidth: 10
                            }
                        },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                label: function (context) {
                                    var total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                    var currentValue = context.parsed;
                                    var percentage = ((currentValue / total) * 100).toFixed(1);
                                    return context.label + ': ' + currentValue.toLocaleString() + ' (' + percentage + '%)';
                                }
                            }
                        },
                        datalabels: {
                            color: '#ffffff',
                            backgroundColor: 'rgba(15, 18, 31, 0.75)',
                            borderRadius: 4,
                            padding: { top: 3, bottom: 3, left: 6, right: 6 },
                            font: {
                                weight: 'bold',
                                size: 11
                            },
                            formatter: (value, ctx) => {
                                const total = ctx.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return percentage + '%';
                            },
                            offset: 10,
                            display: 'auto'
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 2000,
                        easing: 'easeInOutQuart'
                    }
                }
            });

            top5.setAttribute('aria-label', 'Top 5 breaches by total records exposed in each breach: ' +
                breaches_id.map(function (name, idx) { return name + ', ' + breaches_cnt[idx].toLocaleString() + ' records'; }).join('; ') + '.');

            var passwords = document.getElementById('passwords');

            passwords.parentElement.style.height = '400px';

            passwordsChartInstance = new Chart(passwords, {
                type: 'doughnut',
                data: {
                    labels: ['Exposed as Plain Text', 'Easy to Crack', 'Well Protected', 'Unknown'],
                    datasets: [{
                        data: [plaintext, easy, hard, unknown],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(255, 159, 64, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(201, 203, 207, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(201, 203, 207, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    layout: {
                        padding: {
                            top: 20,
                            right: 20,
                            bottom: 40,
                            left: 20
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                color: getChartTextColor(),
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                },
                                usePointStyle: true,
                                boxWidth: 10
                            }
                        },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                label: function (context) {
                                    var total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                    var currentValue = context.parsed;
                                    var percentage = ((currentValue / total) * 100).toFixed(1);
                                    return context.label + ': ' + currentValue.toLocaleString() + ' (' + percentage + '%)';
                                }
                            }
                        },
                        datalabels: {
                            color: '#ffffff',
                            backgroundColor: 'rgba(15, 18, 31, 0.75)',
                            borderRadius: 4,
                            padding: { top: 3, bottom: 3, left: 6, right: 6 },
                            font: {
                                weight: 'bold',
                                size: 11
                            },
                            formatter: (value, ctx) => {
                                const total = ctx.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return percentage + '%';
                            },
                            offset: 10,
                            display: 'auto'
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 2000,
                        easing: 'easeInOutQuart'
                    }
                }
            });
            passwords.setAttribute('aria-label', 'Password risk distribution: ' + plaintext + ' exposed as plain text, ' +
                easy + ' easy to crack, ' + hard + ' well protected, ' + unknown + ' unknown.');

            $("#data_breach").append(nn);
            $("#details").append(breachesDetailsHtml);
        }

        if (typeof tippy !== 'undefined') {
            tippy('[data-toggle="tooltip"]', {
                content: function(reference) {
                    return reference.getAttribute('title');
                },
                allowHTML: true,
                placement: 'auto',
                arrow: true,
                maxWidth: 300
            });
        }

        g1();
        renderExposureTimeline(jsonResponse);
        initJumpnavSpy();
    })
    .fail(function (response) {
        if (response.status === 404) {
            showNoBreachView(email);
        } else if (response.status === 429) {
            showErrorView('slow');
        } else {
            showErrorView('error');
        }
    })

Chart.register(ChartDataLabels);

var _printMode = false;

function isDarkModeActive() {
    if (_printMode) return false;
    return document.body.getAttribute('data-theme') === 'dark' ||
           document.body.classList.contains('dark-mode') ||
           localStorage.getItem('darkSwitch') === 'dark';
}

var _printPrevTheme = null;

window.addEventListener('beforeprint', function () {
    _printMode = true;
    _printPrevTheme = document.body.getAttribute('data-theme');
    if (_printPrevTheme) document.body.removeAttribute('data-theme');
    if (typeof updateChartsForDarkMode === 'function') updateChartsForDarkMode();
    if (lastHeatMapData) drawHeatMap(lastHeatMapData);
});

window.addEventListener('afterprint', function () {
    _printMode = false;
    if (_printPrevTheme) document.body.setAttribute('data-theme', _printPrevTheme);
    _printPrevTheme = null;
    if (typeof updateChartsForDarkMode === 'function') updateChartsForDarkMode();
    if (lastHeatMapData) drawHeatMap(lastHeatMapData);
});

function getChartTextColor() {
    return isDarkModeActive() ? '#FFFFFF' : '#333333';
}

let top5ChartInstance = null;
let passwordsChartInstance = null;
let lineChartInstance = null;
let timelineChartInstance = null;
let lastHeatMapData = null;

function updateChartsForDarkMode() {
    const textColor = getChartTextColor();
    const isDark = isDarkModeActive();

    Chart.defaults.color = textColor;

    if (top5ChartInstance) {
        top5ChartInstance.options.plugins.legend.labels.color = textColor;
        top5ChartInstance.update('none');
    }

    if (passwordsChartInstance) {
        passwordsChartInstance.options.plugins.legend.labels.color = textColor;
        passwordsChartInstance.update('none');
    }

    if (lineChartInstance) {
        lineChartInstance.options.plugins.legend.labels.color = textColor;
        lineChartInstance.options.plugins.datalabels.color = textColor;
        lineChartInstance.options.plugins.datalabels.backgroundColor = isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.85)';
        lineChartInstance.options.scales.x.ticks.color = textColor;
        lineChartInstance.options.scales.y.ticks.color = textColor;
        lineChartInstance.options.scales.y.title.color = textColor;
        lineChartInstance.options.scales.y.grid.color = isDark ? '#3a3a3a' : '#e0e0e0';
        lineChartInstance.update('none');
    }

    if (timelineChartInstance) {
        timelineChartInstance.options.scales.x.ticks.color = textColor;
        timelineChartInstance.options.scales.x.title.color = textColor;
        timelineChartInstance.options.scales.y.ticks.color = textColor;
        timelineChartInstance.options.scales.x.grid.color = isDark ? '#3a3a3a' : '#e0e0e0';
        timelineChartInstance.update('none');
    }
}

const chartDarkModeObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
            setTimeout(updateChartsForDarkMode, 100);
            if (lastHeatMapData) setTimeout(function() { drawHeatMap(lastHeatMapData); }, 120);
        }
    });
});

chartDarkModeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
});

Chart.defaults.color = getChartTextColor();

const chartColors = {
    red: 'rgb(255, 99, 132)',
    blue: 'rgb(54, 162, 235)',
    green: 'rgb(75, 192, 192)',
    orange: 'rgb(255, 159, 64)',
    purple: 'rgb(153, 102, 255)',
    yellow: 'rgb(255, 206, 86)',
    grey: 'rgb(201, 203, 207)'
};

function g1() {

    const textColor = getChartTextColor();
    const isDarkMode = isDarkModeActive();

    const chartLabels = ['2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

    var config = {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Breaches Count',
                fill: false,
                backgroundColor: chartColors.red,
                borderColor: chartColors.red,
                cubicInterpolationMode: 'monotone',
                data: [by07, by08, by09, by10, by11, by12, by13, by14, by15, by16, by17, by18, by19, by20, by21, by22, by23, by24, by25, by26],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    color: textColor,
                    font: {
                        size: 11,
                        weight: 'bold'
                    },
                    backgroundColor: isDarkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.85)',
                    borderRadius: 4,
                    padding: { top: 2, bottom: 2, left: 4, right: 4 },
                    display: function(context) {
                        return context.dataset.data[context.dataIndex] > 0;
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: true
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: true,
                        color: isDarkMode ? '#3a3a3a' : '#e0e0e0',
                        drawBorder: true
                    },
                    title: {
                        display: true,
                        text: 'Count of Data Breaches',
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    };

    var ctx = document.getElementById('bc').getContext('2d');
    lineChartInstance = new Chart(ctx, config);
    var yearCounts = [by07, by08, by09, by10, by11, by12, by13, by14, by15, by16, by17, by18, by19, by20, by21, by22, by23, by24, by25, by26];
    var yearSummary = chartLabels
        .map(function (label, idx) { return { label: label, count: yearCounts[idx] }; })
        .filter(function (item) { return item.count > 0; })
        .map(function (item) { return item.label + ': ' + item.count; })
        .join(', ');
    if (yearSummary) {
        ctx.canvas.setAttribute('aria-label', 'Yearly trend of your data breaches. ' + yearSummary + '.');
    }
}

$(window).on("load", function () {
});

var _alertModalTrigger = null;
var _alertModalIntent = 'alerts';

function announceAlertStatus(text) {
    var region = document.getElementById('xr-alert-status');
    if (!region) {
        region = document.createElement('div');
        region.id = 'xr-alert-status';
        region.className = 'sr-only';
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        var modal = document.getElementById('alertMeModal');
        (modal || document.body).appendChild(region);
    }
    region.textContent = '';
    setTimeout(function () { region.textContent = text; }, 100);
}

$('#alertMeModal').on('hidden.bs.modal', function () {
    $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
    $("#alertMe_i2").addClass("fa fa-bell ring");
    $("#h2head").attr("class", "modal-header-primary");
    _alertModalIntent = 'alerts';
    $('#alertMeModalLabel').text('Get Breach Alerts');
    var unlockNote = document.getElementById('xr-unlock-note');
    if (unlockNote) unlockNote.hidden = true;
    $('#message-text').text("We'll notify you instantly if your email appears in any new data breach. Verify your email and activate your FREE subscription by clicking 'Start Monitoring'.");
    $("#alertMe").show();
    $("#alertMeClose, #a_succ").hide();
    if (_alertModalTrigger && document.contains(_alertModalTrigger)) {
        _alertModalTrigger.focus();
    }
    _alertModalTrigger = null;
});

let turnstileLoaded = false;
function loadTurnstile() {
    if (turnstileLoaded) return;
    turnstileLoaded = true;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=_turnstileCb';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
}

$('#alertMeModal').on('show.bs.modal', function (event) {
    _alertModalTrigger = (event.relatedTarget && event.relatedTarget.focus) ? event.relatedTarget : document.activeElement;
    loadTurnstile();
    var button = $(event.relatedTarget)
    _alertModalIntent = button.data('intent') === 'unlock' ? 'unlock' : 'alerts';
    $('#alertMeModalLabel').text(_alertModalIntent === 'unlock' ? 'Verify Your Email' : 'Get Breach Alerts');
    var unlockNote = document.getElementById('xr-unlock-note');
    if (unlockNote) unlockNote.hidden = _alertModalIntent !== 'unlock';
    if (_alertModalIntent === 'unlock') {
        $('#message-text').text("Verify your email to unlock the sensitive breaches and personalized attack paths in this report. You'll also get free alerts for future breaches. Click 'Start Monitoring' to receive your verification email.");
    }
    var modal = $(this)
    modal.find('.modal-body input').val(email)
    $('#thedudalModal').modal('hide');
})
$(document).ready(function () {
    $('#alertMeModal').on('keydown', function (event) {
        if (event.keyCode === 13 && event.target && event.target.id === 'recipient-name') {
            event.preventDefault();
            $('#alertMe').click();
        }
    });
    $('#recipient-name').on('input', function () {
        var email = $(this).val();
        var isValid = validateEmail(email);
        var $errorMsg = $('#email-validation-error');
        if ($errorMsg.length === 0) {
            $(this).after('<div id="email-validation-error" role="alert" class="xr-form-error" style="display: none;">Please enter a valid email address.</div>');
            $(this).attr('aria-describedby', 'email-validation-error');
            $errorMsg = $('#email-validation-error');
        }
        if (isValid) {
            $(this).css("border", "2px solid #6daae0");
            $(this).attr('aria-invalid', 'false');
            $errorMsg.hide();
            $('#alertMe').prop('disabled', false);
        } else {
            $(this).css("border", "2px solid #c82333");
            $(this).attr('aria-invalid', 'true');
            if (email.length > 0) { $errorMsg.show(); } else { $errorMsg.hide(); }
            $('#alertMe').prop('disabled', true);
        }
    });
    $("#alertMe").click(function (event) {
        event.preventDefault();
        var inputValue = $("#recipient-name").val().toLowerCase().trim();

        if (!inputValue || !validateEmail(inputValue)) {
            $('#message-text').text("Please enter a valid email address to receive alerts.");
            announceAlertStatus("Please enter a valid email address to receive alerts.");
            $("#h2head").attr("class", "modal-header-danger");
            $("#recipient-name").css("border", "2px solid #c82333").focus();
            return;
        }

        var turnstileResponse = '';
        try {
            if (typeof turnstile !== 'undefined') {
                turnstileResponse = turnstile.getResponse() || '';
            }
        } catch (e) {
            console.error('Error getting Turnstile response:', e);
        }

        $("#alertMe_i1").addClass("fa fa-spinner fa-spin");
        $("#alertMe_i2").removeClass("fa fa-bell ring");
        announceAlertStatus("Sending verification email...");
        $("#alertMe").attr('aria-busy', 'true');

        var apiUrl = 'https://api.xposedornot.com/v1/alertme/' + encodeURIComponent(inputValue);
        var headers = turnstileResponse ? { 'X-Turnstile-Token': turnstileResponse } : {};

        var successMessage = _alertModalIntent === 'unlock'
            ? "Verification email sent! Click the link inside, then sign in to My Dashboard with this email to view your unlocked report."
            : "Verification email sent! Check your inbox to activate free breach monitoring.";
        var alreadySubscribedMessage = "You're already protected! This email is registered for breach alerts.";
        var unableToDeliverMessage = "Unable to send email to this address. Please check and try again.";
        var signupFailedMessage = "We couldn't set up alerts right now. Please try again in a few minutes.";

        $.ajax({
            url: apiUrl,
            type: 'GET',
            headers: headers
        })
            .done(function () {
                $('#message-text').text(successMessage);
                announceAlertStatus(successMessage);
                $("#h2head").attr("class", "modal-header-success");
                $("#alertMe").removeAttr('aria-busy').hide();
                $("#alertMeClose").show().focus();
                $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
                $("#alertMe_i2").addClass("fa fa-bell ring");
            })
            .fail(function (jqXHR) {
                var message = alreadySubscribedMessage;
                var headerClass = "modal-header-success";

                if (jqXHR.status === 0 || jqXHR.status === 429 || jqXHR.status >= 500) {
                    message = signupFailedMessage;
                    headerClass = "modal-header-danger";
                } else {
                    try {
                        var response = jqXHR.responseJSON || JSON.parse(jqXHR.responseText);
                        if (response && response.status === "Error") {
                            message = unableToDeliverMessage;
                            headerClass = "modal-header-danger";
                        }
                    } catch (e) {
                    }
                }

                $('#message-text').text(message);
                announceAlertStatus(message);
                $("#h2head").attr("class", headerClass);
                $("#alertMe").removeAttr('aria-busy').hide();
                $("#alertMeClose").show().focus();
                $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
                $("#alertMe_i2").addClass("fa fa-bell ring");
            });
    });

    function adjustLayoutForScreenSize() {
        const isMobile = window.innerWidth <= 767;

        if (isMobile) {
            $('.xon-row2-right, .xon-row2-left').css({
                'height': 'auto',
                'min-height': '350px',
                'margin-bottom': '30px'
            });

            $('.github-collab-section').css({
                'height': 'auto',
                'min-height': '280px',
                'overflow': 'visible',
                'margin-bottom': '30px'
            });
        } else {

            $('.xon-row2-right').css({
                'height': '',
                'min-height': '450px',
                'margin-bottom': ''
            });

            $('.github-collab-section').css({
                'height': '100%',
                'overflow': 'hidden',
                'margin-bottom': ''
            });
        }
    }

    adjustLayoutForScreenSize();
    $(window).on('resize', adjustLayoutForScreenSize);
});

$('.breach-timeline-section').hide();

var leaving = false;
$(document).on('mouseleave', function (e) {
    if (e.clientY < 0 && !leaving) {
        leaving = true;
        $('#alertMeModal').modal('show');
    }
});


function isEmpty(value) {
    return (value == null || (typeof value === "string" && value.trim().length === 0));
}

function _turnstileCb() {
    turns_status = turnstile.render('#turns', {
        sitekey: '0x4AAAAAAAA_T_0Qt4kJbXno',
        theme: 'light',
    });

    let timerId = setInterval(function () {
        $('#alertMe').prop('disabled', true);
        var today = new Date();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        turns_response = turnstile.getResponse(turns_status)
        if (isEmpty(turns_response) === false) {
            $('#alertMe').prop('disabled', false);
            clearInterval(timerId);
        }
    }, 1000);
}

document.getElementById('clippy-button').addEventListener('click', function () {
    this.style.display = 'none';
    clippy.load('Clippy', function (agent) {
        var hasBreaches = typeof breachesSite !== 'undefined' && breachesSite && breachesSite.length > 0;
        agent.show();
        agent.speak('Hi there! I\'m XON Clippy, your friendly security assistant! 👋');
        agent.gestureAt(200, 200);
        agent.moveTo(200, 200);
        agent.speak('I\'m here to help you understand your data breach exposure and keep your information safe 🛡️');
        agent.animate();
        agent.animate();
        agent.gestureAt(200, 200);
        agent.moveTo(200, 200);
        if (hasBreaches) {
            agent.speak('I noticed your email was found in some data breaches - but don\'t worry, I\'m here to help you take control! 💪');
        } else {
            agent.speak('Good news: your email isn\'t in any breach we\'ve indexed! Let\'s keep it that way 🎉');
        }
        agent.animate();
        agent.animate();
        agent.moveTo(1550, 650);
        agent.animate();
        agent.animate();
        if (hasBreaches) {
            agent.speak('First things first: Let\'s make sure this doesn\'t happen again. I recommend enabling breach alerts right away! 🔔');
        } else {
            agent.speak('To stay ahead of future leaks, I recommend enabling free breach alerts! 🔔');
        }
        agent.animate();
        agent.animate();
        agent.speak('Just click that "Get Free Breach Alerts" button, and I\'ll keep watch over your email 24/7. Think of me as your personal security guard! 🕵️');
        agent.animate();
        agent.animate();
        agent.speak('Did you know? We\'ve identified billions of exposed records in our database. That\'s why staying informed is crucial! 📊');
        agent.animate();
        agent.animate();
        agent.speak('Here\'s a shocking fact: Nearly 80% of data breaches involve weak or stolen passwords. But we can fix that! 🔑');
        agent.animate();
        agent.animate();
        agent.speak('Pro tip: Using a password manager is like having a secure vault for all your digital keys. It\'s a game-changer! 🏰');
        agent.animations();

        function speakRandom() {
            var phrases = [
                '🎯 Quick Tip: Create unique passwords for each account - it\'s like having different keys for different doors!',
                '🚨 Stay Alert: If an email asks for personal info, think twice! Legitimate companies rarely ask for sensitive data via email.',
                '🔒 Privacy Boost: A VPN is like a secret tunnel for your internet traffic - perfect for public WiFi!',
                '🛡️ Power Move: Enable two-factor authentication (2FA) - it\'s like adding a security guard to your password!',
                '🔄 Update Time: Keep your software fresh! Think of updates as armor upgrades for your digital life.',
                '📱 WiFi Warning: Public WiFi is like a crowded street - use a VPN to keep your data in a private car!',
                '⚡ Quick Action: If you suspect a breach, change your passwords immediately - better safe than sorry!',
                '👀 Stay Vigilant: Regular credit monitoring is like having a security camera for your financial life.',
                '🔍 Website Check: Look for the padlock icon in your browser - it\'s your website security badge!',
                '📧 Breach Alerts: Enable alerts to be your first line of defense against future breaches!',
                '💾 Backup Smart: Regular backups are like insurance for your digital life - they\'re priceless when you need them!',
                '🦠 Anti-Virus Tip: Keep your anti-virus updated - it\'s your digital immune system!',
                '🌐 Safe Browsing: Treat links in emails like strangers - verify before trusting!',
                '🔐 Password Power: Strong passwords are your digital shield - make them count!',
                '🤫 Privacy First: Think twice before sharing personal info online - less is more!',
                '📱 App Safety: Only download apps from official stores - they\'re like verified marketplaces!',
                '🔄 Auto-Updates: Enable automatic updates - let your devices protect themselves!',
                '📨 Email Smart: Hover over links before clicking - it\'s like checking ID at the door!',
                '💪 Security Habit: Regular security check-ups are like digital health examinations!',
                '🎮 2FA Power: Two-factor authentication is like having a backup superpower!',
                '🔑 Password Manager: Think of it as your digital keychain - organized and secure!',
                '🕵️ Phishing Alert: If an offer seems too good to be true, it probably is!',
                '✉️ Email Verify: When in doubt about an email, contact the company directly!',
                '🎯 Target Smart: Cybercriminals love easy targets - don\'t be one!',
                '🤝 Trust Wisely: Build your circle of trusted websites and stick to them!'
            ];

            var randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            agent.animate();
            agent.speak(randomPhrase);
            agent.animate();
        }
        function scheduleRandomTip() {
            var delay = 45000 + Math.floor(Math.random() * 45000);
            setTimeout(function () {
                speakRandom();
                scheduleRandomTip();
            }, delay);
        }
        scheduleRandomTip();
    });

});

var _heatMapResizeTimer = null;

function cleanLabel(raw) {
    var s = raw;
    if (s.startsWith('data_')) s = s.substring(5);
    return s.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function cleanCategory(raw) {
    return raw.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]\s*/gu, '').trim();
}

function detectAttackPaths(breachesDetails, emailAddr) {
    if (!breachesDetails || !breachesDetails.length) return [];

    var dataTypeMap = {};
    breachesDetails.forEach(function(breach) {
        if (!breach.xposed_data) return;
        breach.xposed_data.split(';').forEach(function(type) {
            var t = type.trim();
            if (!t) return;
            if (!dataTypeMap[t]) dataTypeMap[t] = [];
            dataTypeMap[t].push(breach.breach);
        });
    });

    var freemailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'live.com', 'mail.com', 'ymail.com', 'proton.me'];
    var emailDomain = (emailAddr || '').split('@')[1] || '';
    var isCorporate = emailDomain && freemailDomains.indexOf(emailDomain.toLowerCase()) === -1;

    function hasType(t) { return dataTypeMap[t] && dataTypeMap[t].length > 0; }
    function getBreaches(t) { return (dataTypeMap[t] || []).slice(0, 5); }
    function uniqueBreaches(arr) {
        return arr.filter(function(v, i, a) { return a.indexOf(v) === i; }).slice(0, 5);
    }

    var paths = [];

    if (hasType('Passwords') && dataTypeMap['Passwords'].length >= 2) {
        var pwBreaches = getBreaches('Passwords');
        var hasEmailType = hasType('Email addresses');
        paths.push({
            id: 'account-takeover',
            name: 'Account Takeover',
            severity: 'CRITICAL',
            stages: [
                { label: 'Exposed', icon: 'fa-database', status: 'red',
                  detail: 'Passwords found in ' + dataTypeMap['Passwords'].length + ' breaches.',
                  breaches: pwBreaches, dataTypes: ['Passwords'] },
                { label: 'Targeted', icon: 'fa-crosshairs', status: 'red',
                  detail: 'Credential stuffing lists include your email and leaked passwords.',
                  breaches: [], dataTypes: ['Email addresses'] },
                { label: 'Exploited', icon: 'fa-unlock-alt', status: 'red',
                  detail: 'Attacker logs into your accounts using leaked credentials.',
                  breaches: [], dataTypes: ['Passwords'] },
                { label: 'Cascading', icon: hasEmailType ? 'fa-project-diagram' : 'fa-check-circle',
                  status: hasEmailType ? 'red' : 'green',
                  detail: hasEmailType
                      ? 'Email account compromise cascades to password resets on linked services.'
                      : 'No email address exposed alongside passwords, so cascade is harder.',
                  breaches: hasEmailType ? getBreaches('Email addresses') : [], dataTypes: hasEmailType ? ['Email addresses'] : [] },
                { label: 'Impact', icon: 'fa-exclamation-triangle',
                  status: hasEmailType ? 'red' : 'amber',
                  detail: hasEmailType
                      ? 'Full account takeover: financial fraud, data theft, impersonation.'
                      : 'Limited to accounts sharing the same password. Change passwords to contain damage.',
                  breaches: [], dataTypes: [] }
            ]
        });
    }

    if (hasType('Passwords') && hasType('Phone numbers')) {
        var simBreaches = uniqueBreaches(getBreaches('Phone numbers').concat(getBreaches('Passwords')));
        var hasDob = hasType('Dates of birth');
        var hasAddr = hasType('Physical addresses');
        var hasCarrierData = hasDob || hasAddr;
        paths.push({
            id: 'sim-swap',
            name: 'SIM Swap Attack',
            severity: 'CRITICAL',
            stages: [
                { label: 'Exposed', icon: 'fa-database', status: 'red',
                  detail: 'Phone number and passwords found in breach data.',
                  breaches: simBreaches, dataTypes: ['Phone numbers', 'Passwords'] },
                { label: 'Targeted', icon: 'fa-crosshairs', status: 'red',
                  detail: 'Attacker identifies your carrier from your phone number.',
                  breaches: [], dataTypes: ['Phone numbers'] },
                { label: 'Exploited', icon: hasCarrierData ? 'fa-unlock-alt' : 'fa-check-circle',
                  status: hasCarrierData ? 'red' : 'green',
                  detail: hasCarrierData
                      ? 'Carrier tricked into porting your number. Identity data makes verification easier.'
                      : 'Carrier verification is harder without date of birth or address.',
                  breaches: hasCarrierData ? uniqueBreaches((hasDob ? getBreaches('Dates of birth') : []).concat(hasAddr ? getBreaches('Physical addresses') : [])) : [],
                  dataTypes: (hasDob ? ['Dates of birth'] : []).concat(hasAddr ? ['Physical addresses'] : []) },
                { label: 'Cascading', icon: 'fa-project-diagram', status: 'red',
                  detail: 'SMS 2FA intercepted. Password resets on banking, email, and social accounts.',
                  breaches: [], dataTypes: ['Phone numbers'] },
                { label: 'Impact', icon: 'fa-exclamation-triangle', status: 'red',
                  detail: 'Financial theft, cryptocurrency drain, complete account lockout.',
                  breaches: [], dataTypes: [] }
            ]
        });
    }

    var identityTypes = ['Dates of birth', 'Physical addresses', 'Social security numbers', 'Names'];
    var presentIdentityTypes = identityTypes.filter(function(t) { return hasType(t); });
    if (presentIdentityTypes.length >= 2) {
        var idBreaches = [];
        presentIdentityTypes.forEach(function(t) { idBreaches = idBreaches.concat(getBreaches(t)); });
        idBreaches = uniqueBreaches(idBreaches);
        var hasSsn = hasType('Social security numbers');
        var hasMany = presentIdentityTypes.length >= 3;
        paths.push({
            id: 'identity-theft',
            name: 'Identity Theft',
            severity: 'CRITICAL',
            stages: [
                { label: 'Exposed', icon: 'fa-database', status: 'red',
                  detail: escapeHtml(presentIdentityTypes.join(', ')) + ' found in breach data.',
                  breaches: idBreaches, dataTypes: presentIdentityTypes },
                { label: 'Targeted', icon: 'fa-crosshairs', status: 'red',
                  detail: 'Attacker builds an identity profile for fraudulent applications.',
                  breaches: [], dataTypes: presentIdentityTypes.slice(0, 2) },
                { label: 'Exploited', icon: hasSsn ? 'fa-unlock-alt' : 'fa-check-circle',
                  status: hasSsn ? 'red' : 'green',
                  detail: hasSsn
                      ? 'SSN exposed. Credit applications and identity verification are straightforward.'
                      : 'No SSN found, so harder to pass identity verification for credit applications.',
                  breaches: hasSsn ? getBreaches('Social security numbers') : [], dataTypes: hasSsn ? ['Social security numbers'] : [] },
                { label: 'Cascading', icon: hasMany ? 'fa-project-diagram' : 'fa-check-circle',
                  status: hasMany ? 'red' : 'green',
                  detail: hasMany
                      ? 'Multiple identity data types enable opening accounts across providers.'
                      : 'Limited identity data constrains how many fraudulent accounts can be opened.',
                  breaches: [], dataTypes: [] },
                { label: 'Impact', icon: 'fa-exclamation-triangle',
                  status: hasSsn ? 'red' : 'amber',
                  detail: hasSsn
                      ? 'Credit damage, fraudulent debt, legal complications.'
                      : 'Moderate identity risk. Monitor credit reports and set up fraud alerts.',
                  breaches: [], dataTypes: [] }
            ]
        });
    }

    if (hasType('Passwords') && isCorporate) {
        var corpBreaches = getBreaches('Passwords');
        paths.push({
            id: 'corporate-infiltration',
            name: 'Corporate Infiltration',
            severity: 'CRITICAL',
            stages: [
                { label: 'Exposed', icon: 'fa-database', status: 'red',
                  detail: 'Corporate email (' + escapeHtml(emailDomain) + ') and passwords found in breach data.',
                  breaches: corpBreaches, dataTypes: ['Passwords', 'Email addresses'] },
                { label: 'Targeted', icon: 'fa-crosshairs', status: 'red',
                  detail: 'Attacker identifies your employer from the email domain.',
                  breaches: [], dataTypes: ['Email addresses'] },
                { label: 'Exploited', icon: 'fa-unlock-alt', status: 'red',
                  detail: 'Attempts corporate VPN, email, or SSO login with leaked credentials.',
                  breaches: [], dataTypes: ['Passwords'] },
                { label: 'Cascading', icon: 'fa-check-circle', status: 'green',
                  detail: 'Internal network access depends on corporate security controls.',
                  breaches: [], dataTypes: [] },
                { label: 'Impact', icon: 'fa-check-circle', status: 'green',
                  detail: 'Potential corporate data breach, intellectual property theft.',
                  breaches: [], dataTypes: [] }
            ]
        });
    }

    if (hasType('Names') && hasType('Phone numbers') && hasType('Email addresses')) {
        var seBreaches = uniqueBreaches(getBreaches('Names').concat(getBreaches('Phone numbers')).concat(getBreaches('Email addresses')));
        var hasAddrSE = hasType('Physical addresses');
        paths.push({
            id: 'social-engineering',
            name: 'Social Engineering',
            severity: 'HIGH',
            stages: [
                { label: 'Exposed', icon: 'fa-database', status: 'red',
                  detail: 'Name, phone, and email found in breach data.',
                  breaches: seBreaches, dataTypes: ['Names', 'Phone numbers', 'Email addresses'] },
                { label: 'Targeted', icon: 'fa-crosshairs', status: 'red',
                  detail: 'Complete contact profile enables targeted attacks.',
                  breaches: [], dataTypes: ['Names', 'Email addresses'] },
                { label: 'Exploited', icon: 'fa-unlock-alt', status: 'red',
                  detail: 'Targeted phishing emails or vishing calls using your real details.',
                  breaches: [], dataTypes: ['Phone numbers'] },
                { label: 'Cascading', icon: hasAddrSE ? 'fa-project-diagram' : 'fa-check-circle',
                  status: hasAddrSE ? 'red' : 'green',
                  detail: hasAddrSE
                      ? 'Physical address also exposed, enabling in-person social engineering.'
                      : 'No physical address found. Attack limited to digital channels only.',
                  breaches: hasAddrSE ? getBreaches('Physical addresses') : [], dataTypes: hasAddrSE ? ['Physical addresses'] : [] },
                { label: 'Impact', icon: 'fa-exclamation-triangle', status: 'amber',
                  detail: 'Financial scams, relationship exploitation, further data compromise.',
                  breaches: [], dataTypes: [] }
            ]
        });
    }

    if (hasType('Physical addresses') && hasType('Names')) {
        var physBreaches = uniqueBreaches(getBreaches('Physical addresses').concat(getBreaches('Names')));
        var hasPhonePT = hasType('Phone numbers');
        paths.push({
            id: 'physical-threat',
            name: 'Physical Threat',
            severity: 'HIGH',
            stages: [
                { label: 'Exposed', icon: 'fa-database', status: 'red',
                  detail: 'Name and home address found in breach data.',
                  breaches: physBreaches, dataTypes: ['Physical addresses', 'Names'] },
                { label: 'Targeted', icon: 'fa-crosshairs', status: 'red',
                  detail: 'Physical location is publicly linked to your identity.',
                  breaches: [], dataTypes: ['Physical addresses'] },
                { label: 'Exploited', icon: hasPhonePT ? 'fa-unlock-alt' : 'fa-check-circle',
                  status: hasPhonePT ? 'red' : 'green',
                  detail: hasPhonePT
                      ? 'Phone number also exposed, enabling mail redirect and SIM-based attacks.'
                      : 'No phone number found. Exploitation limited to physical mail only.',
                  breaches: hasPhonePT ? getBreaches('Phone numbers') : [], dataTypes: hasPhonePT ? ['Phone numbers'] : [] },
                { label: 'Cascading', icon: 'fa-project-diagram', status: 'amber',
                  detail: 'Info gathered from redirected mail, bills, and correspondence.',
                  breaches: [], dataTypes: [] },
                { label: 'Impact', icon: 'fa-exclamation-triangle', status: 'amber',
                  detail: 'Physical stalking risk, mail fraud, targeted burglary.',
                  breaches: [], dataTypes: [] }
            ]
        });
    }

    paths.sort(function(a, b) {
        var order = { 'CRITICAL': 1, 'HIGH': 2 };
        return (order[a.severity] || 99) - (order[b.severity] || 99);
    });

    return paths;
}

function renderSampleAttackPath() {
    var section = document.getElementById('attack-paths-section');
    if (!section) return;

    section.style.display = '';
    var tabsContainer = document.getElementById('attack-paths-tabs');
    var contentContainer = document.getElementById('attack-paths-content');

    tabsContainer.innerHTML = '';

    var sampleStages = [
        { label: 'Exposed', status: 'red', icon: 'fa-exclamation-triangle', detail: 'Passwords found in 3 breaches.', breaches: ['SocialApp', 'ShoppingSite', 'OnlineForum'] },
        { label: 'Targeted', status: 'red', icon: 'fa-crosshairs', detail: 'Credential stuffing lists include your email and leaked passwords.' },
        { label: 'Exploited', status: 'red', icon: 'fa-unlock-alt', detail: 'Attacker logs into your accounts using leaked credentials.' },
        { label: 'Cascading', status: 'green', icon: 'fa-check-circle', detail: 'No email address exposed alongside passwords, so cascade is harder.' },
        { label: 'Impact', status: 'amber', icon: 'fa-exclamation-circle', detail: 'Limited to accounts sharing the same password. Change passwords to contain damage.' }
    ];

    var flowHtml = '<div class="hybrid-flow" role="list" aria-label="Sample account takeover attack flow">';
    sampleStages.forEach(function(stage, j) {
        var posClass = j === 0 ? ' hybrid-first' : '';
        flowHtml += '<div class="hybrid-node" role="listitem">';
        flowHtml += '<div class="hybrid-header status-' + stage.status + posClass + '"><i class="fas ' + stage.icon + '" aria-hidden="true"></i> ' + stage.label + '</div>';
        flowHtml += '<div class="hybrid-body status-' + stage.status + '-border">';
        flowHtml += '<p class="hybrid-detail">' + stage.detail + '</p>';
        if (stage.breaches && stage.breaches.length > 0) {
            flowHtml += '<div class="attack-path-tags">';
            stage.breaches.forEach(function(b) {
                flowHtml += '<span class="attack-path-breach-tag">' + b + '</span>';
            });
            flowHtml += '</div>';
        }
        flowHtml += '</div></div>';
    });
    flowHtml += '</div>';

    var html = '';
    html += '<div class="attack-path-sample-badge" aria-hidden="true">SAMPLE</div>';
    html += '<div class="attack-path-sample-wrapper" aria-hidden="true">';
    html += '<div class="attack-path-single-header"><span class="attack-path-severity-badge severity-critical">CRITICAL</span> Account Takeover</div>';
    html += flowHtml;
    html += '</div>';
    html += '<div class="attack-path-nudge" aria-hidden="true"><span class="nudge-chevron"><i class="fas fa-chevron-down"></i></span></div>';
    html += '<div class="attack-path-cta">';
    html += '<strong><i class="fas fa-lock" aria-hidden="true"></i> See Your Personalized Attack Paths</strong>';
    html += '<p>Verify your email to see how attackers could target you based on your actual breach data.</p>';
    html += '<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal" data-intent="unlock">';
    html += '<i class="fas fa-envelope" aria-hidden="true"></i> Verify Email Now</button>';
    html += '</div>';

    contentContainer.innerHTML = html;
}

function renderAttackPaths(paths) {
    var section = document.getElementById('attack-paths-section');
    if (!section) return;

    section.style.display = '';

    if (!paths || paths.length === 0) {
        var tabsContainer = document.getElementById('attack-paths-tabs');
        var contentContainer = document.getElementById('attack-paths-content');
        tabsContainer.innerHTML = '';
        tabsContainer.removeAttribute('role');
        var desc = section.querySelector('.attack-path-description');
        if (desc) desc.style.display = 'none';
        var isDark = isDarkModeActive();
        contentContainer.innerHTML = '<div style="text-align:center; padding: 32px 24px; max-width: 500px; margin: 0 auto; border-radius: 12px; background:' + (isDark ? '#0f2a1f' : '#f0fdf4') + '; border: 1px solid ' + (isDark ? '#16a34a44' : '#bbf7d0') + ';">' +
            '<div style="font-size: 40px; margin-bottom: 8px;" role="img" aria-label="Shield">&#128737;&#65039;</div>' +
            '<h3 style="margin-bottom: 6px; color:' + (isDark ? '#86efac' : '#166534') + ';">You\'re looking good</h3>' +
            '<p style="color:' + (isDark ? '#94a3b8' : '#64748b') + '; margin: 0; font-size: 14px;">Your exposed data does not match any known attack scenario. Keep your passwords unique and stay alert to keep it that way.</p>' +
            '</div>';
        return;
    }
    var tabsContainer = document.getElementById('attack-paths-tabs');
    var contentContainer = document.getElementById('attack-paths-content');

    var tabsHtml = '';
    if (paths.length > 1) {
        tabsContainer.setAttribute('role', 'tablist');
    } else {
        tabsContainer.removeAttribute('role');
    }
    if (paths.length > 1) {
        tabsHtml = '<div class="attack-path-tabs-wrapper">';
        paths.forEach(function(path, i) {
            var isActive = i === 0;
            tabsHtml += '<button class="attack-path-tab' + (isActive ? ' active' : '') + '" role="tab" id="tab-' + path.id + '" aria-selected="' + isActive + '" aria-controls="panel-' + path.id + '" tabindex="' + (isActive ? '0' : '-1') + '">';
            tabsHtml += '<span class="attack-path-severity-badge severity-' + path.severity.toLowerCase() + '">' + path.severity + '</span> ';
            tabsHtml += escapeHtml(path.name);
            tabsHtml += '</button>';
        });
        tabsHtml += '</div>';
    }
    tabsContainer.innerHTML = tabsHtml;

    var contentHtml = '';
    paths.forEach(function(path, i) {
        var isActive = i === 0;
        contentHtml += '<div class="attack-path-panel' + (isActive ? ' active' : '') + '" role="tabpanel" id="panel-' + path.id + '" aria-labelledby="tab-' + path.id + '"' + (!isActive ? ' hidden' : '') + '>';

        if (paths.length === 1) {
            contentHtml += '<div class="attack-path-single-header"><span class="attack-path-severity-badge severity-' + path.severity.toLowerCase() + '">' + path.severity + '</span> ' + escapeHtml(path.name) + '</div>';
        }

        contentHtml += '<div class="hybrid-flow" role="list" aria-label="' + escapeHtml(path.name) + ' attack flow">';
        path.stages.forEach(function(stage, j) {
            var posClass = j === 0 ? ' hybrid-first' : '';
            contentHtml += '<div class="hybrid-node" role="listitem">';
            contentHtml += '<div class="hybrid-header status-' + stage.status + posClass + '"><i class="fas ' + stage.icon + '" aria-hidden="true"></i> ' + escapeHtml(stage.label) + '</div>';
            contentHtml += '<div class="hybrid-body status-' + stage.status + '-border">';
            contentHtml += '<p class="hybrid-detail">' + stage.detail + '</p>';
            if (stage.breaches && stage.breaches.length > 0) {
                contentHtml += '<div class="attack-path-tags">';
                stage.breaches.forEach(function(b) {
                    contentHtml += '<span class="attack-path-breach-tag">' + escapeHtml(b) + '</span>';
                });
                contentHtml += '</div>';
            }
            if (stage.dataTypes && stage.dataTypes.length > 0) {
                contentHtml += '<div class="attack-path-tags">';
                stage.dataTypes.forEach(function(dt) {
                    contentHtml += '<span class="attack-path-data-tag">' + escapeHtml(dt) + '</span>';
                });
                contentHtml += '</div>';
            }
            contentHtml += '</div></div>';
        });
        contentHtml += '</div>';

        contentHtml += '</div>';
    });
    contentContainer.innerHTML = contentHtml;

    if (paths.length > 1) {
        var tabs = tabsContainer.querySelectorAll('.attack-path-tab');
        var panels = contentContainer.querySelectorAll('.attack-path-panel');

        function activateTab(tab) {
            tabs.forEach(function(t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });
            panels.forEach(function(p) {
                p.classList.remove('active');
                p.setAttribute('hidden', '');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');
            var panelId = tab.getAttribute('aria-controls');
            var panel = document.getElementById(panelId);
            if (panel) {
                panel.classList.add('active');
                panel.removeAttribute('hidden');
            }
            tab.focus();
        }

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                activateTab(tab);
            });

            tab.addEventListener('keydown', function(e) {
                var index = Array.prototype.indexOf.call(tabs, tab);
                var newIndex = -1;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    newIndex = (index + 1) % tabs.length;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    newIndex = (index - 1 + tabs.length) % tabs.length;
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    newIndex = 0;
                } else if (e.key === 'End') {
                    e.preventDefault();
                    newIndex = tabs.length - 1;
                }
                if (newIndex >= 0) {
                    activateTab(tabs[newIndex]);
                }
            });
        });
    }
}


function drawHeatMap(xposedData) {
    try {
        if (xposedData && xposedData.length) {
            lastHeatMapData = xposedData;
        }
        if (typeof d3 === 'undefined') return;

        var container = document.getElementById('heatmap-container');
        if (!container) return;

        var items = [];
        if (!xposedData || !xposedData.length) {
            container.innerHTML = '';
            return;
        }

        xposedData.forEach(function(cat) {
            if (cat.children && cat.children.length) {
                cat.children.forEach(function(item) {
                    if (item.value > 0) {
                        items.push({ name: cleanLabel(item.name), value: item.value, category: cleanCategory(cat.name) });
                    }
                });
            }
        });

        if (items.length === 0) {
            container.innerHTML = '';
            return;
        }

        lastHeatMapData = xposedData;

        var isDark = isDarkModeActive();

        var colorScale = d3.scaleThreshold()
            .domain([6, 11])
            .range(['#3b6be6', '#e67e22', '#d63031']);

        function textColor(count) {
            if (count > 10) return '#ffffff';
            if (count > 5)  return '#2d3436';
            return '#ffffff';
        }

        var width = container.clientWidth || 600;
        var height = Math.min(500, Math.max(300, items.length * 8));

        var root = d3.hierarchy({ children: items })
            .sum(function(d) { return d.value; })
            .sort(function(a, b) { return b.value - a.value; });

        d3.treemap()
            .size([width, height])
            .padding(2)
            .round(true)(root);

        container.innerHTML = '';
        container.removeAttribute('role');
        container.removeAttribute('aria-label');

        var svg = d3.select(container)
            .append('svg')
            .attr('viewBox', '0 0 ' + width + ' ' + height)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('role', 'list')
            .attr('aria-label', 'Treemap showing proportional exposure of each data type across breaches');

        var cells = svg.selectAll('g')
            .data(root.leaves())
            .enter()
            .append('g')
            .attr('class', 'heatmap-cell')
            .attr('tabindex', '0')
            .attr('role', 'listitem')
            .attr('aria-label', function(d) {
                return d.data.name + ': ' + d.data.value + ' exposures (' + d.data.category + ')';
            })
            .attr('transform', function(d) {
                return 'translate(' + d.x0 + ',' + d.y0 + ')';
            });

        cells.append('rect')
            .attr('width', function(d) { return Math.max(0, d.x1 - d.x0); })
            .attr('height', function(d) { return Math.max(0, d.y1 - d.y0); })
            .attr('fill', function(d) { return colorScale(d.data.value); })
            .attr('stroke', isDark ? '#1a1d2e' : '#ffffff')
            .attr('stroke-width', 1.5)
            .attr('rx', 3);

        cells.each(function(d) {
            var cellW = d.x1 - d.x0;
            var cellH = d.y1 - d.y0;
            if (cellW < 50 || cellH < 28) return;

            var g = d3.select(this);
            var fontSize = cellW < 80 ? 10 : 12;
            var maxChars = Math.floor(cellW / (fontSize * 0.62));
            var label = d.data.name.length > maxChars
                ? d.data.name.substring(0, maxChars - 1) + '\u2026'
                : d.data.name;

            var slots = 1 + (cellH >= 52 ? 1 : 0);
            var lineH = fontSize + 4;
            var blockH = slots * lineH;
            var startY = (cellH - blockH) / 2 + fontSize;
            var row = 0;

            g.append('text')
                .attr('x', cellW / 2)
                .attr('y', startY + row * lineH)
                .attr('text-anchor', 'middle')
                .attr('fill', textColor(d.data.value))
                .attr('font-size', fontSize + 'px')
                .attr('font-family', 'Poppins, sans-serif')
                .attr('font-weight', '500')
                .attr('pointer-events', 'none')
                .text(label);
            row++;

            if (cellH >= 52) {
                var badgeY = startY + row * lineH;
                var countStr = String(d.data.value);
                var badgeW = Math.max(28, countStr.length * 9 + 14);
                var badgeH = 18;

                g.append('rect')
                    .attr('x', (cellW - badgeW) / 2)
                    .attr('y', badgeY - badgeH + 4)
                    .attr('width', badgeW)
                    .attr('height', badgeH)
                    .attr('rx', 9)
                    .attr('fill', isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)')
                    .attr('pointer-events', 'none');

                g.append('text')
                    .attr('x', cellW / 2)
                    .attr('y', badgeY - 1)
                    .attr('text-anchor', 'middle')
                    .attr('fill', textColor(d.data.value))
                    .attr('font-size', '11px')
                    .attr('font-family', 'Poppins, sans-serif')
                    .attr('font-weight', '700')
                    .attr('pointer-events', 'none')
                    .text(d.data.value);
            }
        });

        if (typeof tippy !== 'undefined') {
            tippy(container.querySelectorAll('.heatmap-cell'), {
                content: function(el) {
                    var d = d3.select(el).datum();
                    return '<strong>' + d.data.name + '</strong><br>Category: ' + d.data.category + '<br>Exposures: ' + d.data.value;
                },
                allowHTML: true,
                placement: 'top',
                arrow: true,
                trigger: 'mouseenter focus',
                theme: isDark ? 'dark' : 'light',
                maxWidth: 220
            });
        }

        var legendEl = container.querySelector('.heatmap-legend');
        if (legendEl) legendEl.remove();

        var legend = document.createElement('div');
        legend.className = 'heatmap-legend';
        legend.setAttribute('aria-label', 'Heat map color legend');

        var tiers = [
            { color: '#3b6be6', label: 'Exposed 1\u20135 times' },
            { color: '#e67e22', label: 'Exposed 6\u201310 times' },
            { color: '#d63031', label: 'Exposed 11+ times' }
        ];

        tiers.forEach(function(t) {
            var item = document.createElement('span');
            item.className = 'heatmap-legend-item';

            var swatch = document.createElement('span');
            swatch.className = 'heatmap-legend-swatch';
            swatch.style.backgroundColor = t.color;
            swatch.setAttribute('aria-hidden', 'true');

            item.appendChild(swatch);
            item.appendChild(document.createTextNode(t.label));
            legend.appendChild(item);
        });

        container.appendChild(legend);

        window.removeEventListener('resize', _heatMapResizeHandler);
        window.addEventListener('resize', _heatMapResizeHandler);

    } catch (error) {
        console.warn('Error rendering heat map:', error);
    }
}

function _heatMapResizeHandler() {
    clearTimeout(_heatMapResizeTimer);
    _heatMapResizeTimer = setTimeout(function() {
        if (lastHeatMapData) drawHeatMap(lastHeatMapData);
    }, 250);
}

$(document).ready(function () {
    $('#xr-print-btn').on('click', function () {
        window.print();
    });

    var $backToTop = $('#back-to-top');
    var $floatingButton = $('#floating-button');
    var usesVisibleClass = $backToTop.hasClass('back-to-top');
    var backToTopShown = false;
    var floatingScrolled = false;

    function updateFloatingControls() {
        var y = $(window).scrollTop();
        var showBackToTop = y > 300;
        var pastHeader = y > 80;

        if (showBackToTop !== backToTopShown) {
            backToTopShown = showBackToTop;
            if (usesVisibleClass) {
                $backToTop.toggleClass('visible', showBackToTop);
            } else if (showBackToTop) {
                $backToTop.fadeIn();
            } else {
                $backToTop.fadeOut();
            }
        }

        if (pastHeader !== floatingScrolled) {
            floatingScrolled = pastHeader;
            $floatingButton.toggleClass('fb-scrolled', pastHeader);
        }
    }

    $(window).on('scroll', updateFloatingControls);
    updateFloatingControls();

    $backToTop.click(function () {
        var focusMain = function () {
            var main = document.getElementById('main-content');
            if (main) {
                main.focus({ preventScroll: true });
            }
        };
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            window.scrollTo(0, 0);
            focusMain();
        } else {
            $('body,html').animate({
                scrollTop: 0
            }, 400, focusMain);
        }
        return false;
    });

    $('body').on('click', '.see-more', function (e) {
        e.preventDefault();
        var $this = $(this);
        var $text = $this.prev('.text');
        var isExpanded = $this.attr('aria-expanded') === 'true';

        if (!isExpanded) {
            $text.css({
                'overflow': 'visible',
                'display': 'block',
                '-webkit-line-clamp': 'unset',
                '-webkit-box-orient': 'unset'
            });
            $this.text('See Less');
            $this.attr('aria-expanded', 'true');
        } else {
            $text.css({
                'overflow': 'hidden',
                'display': '-webkit-box',
                '-webkit-line-clamp': '3',
                '-webkit-box-orient': 'vertical'
            });
            $this.text('See More');
            $this.attr('aria-expanded', 'false');
        }
    });
});

$(document).ajaxStart(function () {
    $.LoadingOverlay("show");
}).ajaxStop(function () {
    $.LoadingOverlay("hide");
    $('#sr-loading-status').text('Report loaded.');
});

function formatAddedDate(added, monthYearOnly) {
    if (!added) return '';
    var d = new Date(added);
    if (isNaN(d.getTime())) return '';
    var lang = document.documentElement.lang || 'en';
    var opts = monthYearOnly ? { year: 'numeric', month: 'short' } : { year: 'numeric', month: 'short', day: 'numeric' };
    try {
        return d.toLocaleDateString(lang, opts);
    } catch (e) {
        return d.toLocaleDateString('en', opts);
    }
}

function breachAnchorId(name) {
    return 'xr-detail-' + String(name).replace(/[^A-Za-z0-9_-]/g, '');
}

function passwordRiskLabel(risk) {
    switch (String(risk || '').toLowerCase()) {
        case 'plaintext': return 'Exposed in plain text (no protection)';
        case 'easytocrack': return 'Weakly protected (easy to crack)';
        case 'hardtocrack': return 'Strongly protected (hard to crack)';
        case 'unknown': return 'Unknown (storage method not disclosed)';
        default: return escapeHtml(risk);
    }
}

function generateBreachDetailHtml(breach, isSensitive) {
    const addedStr = formatAddedDate(breach.added);
    let html = "<div id='" + breachAnchorId(breach.breach) + "' class='xr-detail-card'><b><span class='notser'>" + escapeHtml(breach.xposed_date) + "</span></b><br><br><div class='row'><div class='col-sm-4' style='text-align: center'><img height='75' width='100' src='";
    html += breach.logo + "' alt='" + escapeHtml(breach.breach) + " logo'></div><div class='col-sm-4' style='text-align: center'><h3><strong><a href='" + '/breach/' + encodeURIComponent(breach.breach) + "' target='_blank' rel='noopener'>";
    html += escapeHtml(breach.breach) + "<span class='sr-only'> (opens in new tab)</span></a></strong></h3></div><div class='col-sm-4' style='text-align: center'><img height='75' width='75' src='";
    html += 'static/logos/industry/' + encodeURIComponent(breach.industry) + ".png' alt='" + escapeHtml(breach.industry) + " industry icon'>";
    html += "<p>Industry: " + escapeHtml(breach.industry) + "</p></div></div><br>";
    html += "<div style='text-align: center'><table style='width: 85%; font-size: 16px' class='table-striped table-bordered table-hover'>";
    html += "<caption class='sr-only'>Breach details for " + escapeHtml(breach.breach) + "</caption>";
    html += "<thead><tr><th scope='col'>Detail</th><th scope='col'>Value</th></tr></thead><tbody>";
    html += "<tr><th scope='row'>Accounts Exposed (entire breach)</th><td>" + parseInt(breach.xposed_records).toLocaleString() + "</td></tr>";
    if (addedStr) {
        html += "<tr><th scope='row'>Added to XposedOrNot</th><td>" + addedStr + "</td></tr>";
    }
    html += "<tr><th scope='row'>Data Types Exposed</th><td>" + escapeHtml(breach.xposed_data.replace(/;/g, ', ')) + "</td></tr>";
    html += "<tr><th scope='row'>Password Protection</th><td>" + passwordRiskLabel(breach.password_risk) + "</td></tr>";
    html += "<tr><th scope='row'>Affected Domain</th><td>" + escapeHtml(breach.domain) + "</td></tr></tbody></table>";
    html += "<p style='font-size: 16px'>" + escapeHtml(breach.details) + "</p></div><br><br>";
    html += "<b>Reference link(s):</b><br><a target='_blank' rel='noopener' href='" + encodeURI(breach.references) + "'>" + escapeHtml(breach.references) + "<span class='sr-only'> (opens in new tab)</span></a>";
    html += "<br><br>";
    if (breach.verified === "Yes") {
        html += "<span class='ver'>Verified breach</span>";
    } else {
        html += "<span class='notver'>Unverified breach</span>";
    }
    html += isSensitive ? "<span class='notser'>Sensitive Data Breach</span>" : "<span class='notser'>Data Breach</span>";
    html += "</div><hr>";
    return html;
}

function buildBreachRowHtml(breach, isSensitive) {
    var prefix = isSensitive ? '<span role="img" aria-label="Sensitive breach">🔥</span> ' : '';
    var added = formatAddedDate(breach.added, true);
    var detailLink = (!isSensitive || token)
        ? '<br><a class="xr-detail-link" href="#' + breachAnchorId(breach.breach) + '">Full details<span class="sr-only"> for ' + escapeHtml(breach.breach) + '</span> <i class="fas fa-arrow-down" aria-hidden="true"></i></a>'
        : '';
    return '<tr>' +
        '<th scope="row" style="text-align: center;">' + prefix + escapeHtml(breach.breach) + '<br>' +
        '<img src="' + breach.logo + '" alt="' + escapeHtml(breach.breach) + ' logo" style="width: 50px; height: 50px;">' +
        detailLink +
        '</th>' +
        '<td><div class="text">' + escapeHtml(breach.details) + '</div>' +
        '<button type="button" class="see-more" aria-expanded="false">See More</button></td>' +
        '<td style="text-align: right;">' + parseInt(breach.xposed_records).toLocaleString() +
        (added ? '<br><span class="xr-added-pill">Added ' + added + '</span>' : '') + '</td>' +
        '</tr>';
}

function breachAddedTime(breach) {
    var t = new Date(breach.added || 0).getTime();
    return isNaN(t) ? 0 : t;
}

function sortBreaches(list, mode) {
    var arr = list.slice();
    if (mode === 'added') {
        arr.sort(function (a, b) {
            return breachAddedTime(b) - breachAddedTime(a);
        });
    } else {
        var dir = mode === 'oldest' ? 1 : -1;
        arr.sort(function (a, b) {
            var diff = (parseInt(a.xposed_date, 10) || 0) - (parseInt(b.xposed_date, 10) || 0);
            if (diff === 0) diff = breachAddedTime(a) - breachAddedTime(b);
            return dir * diff;
        });
    }
    return arr;
}

function renderSortedBreachTable(tbodyId, list, mode, isSensitive) {
    var rows = '';
    sortBreaches(list, mode).forEach(function (breach) {
        rows += buildBreachRowHtml(breach, isSensitive);
    });
    $('#' + tbodyId).html(rows);
}

function attachBreachSort(tbodyId, list, isSensitive, selectId) {
    var table = $('#' + tbodyId).closest('table');
    var hasPassword = function (breach) { return /password/i.test(breach.xposed_data || ''); };
    var passwordCount = list.filter(hasPassword).length;
    var mode = 'newest';
    var passwordsOnly = false;
    function rerender() {
        var visible = passwordsOnly ? list.filter(hasPassword) : list;
        renderSortedBreachTable(tbodyId, visible, mode, isSensitive);
        $('#' + selectId + '-count').text(passwordsOnly ? 'Showing ' + visible.length + ' of ' + list.length + ' breaches' : '');
    }
    if (table.length && list.length > 1 && !document.getElementById(selectId)) {
        var controls = '<div class="xr-sort">';
        if (passwordCount > 0 && passwordCount < list.length) {
            controls += '<label class="xr-filter-check" for="' + selectId + '-pw">' +
                '<input type="checkbox" id="' + selectId + '-pw"> Only breaches with passwords</label>' +
                '<span id="' + selectId + '-count" class="xr-sort-count" role="status"></span>';
        }
        controls += '<label for="' + selectId + '">Sort by</label>' +
            '<select id="' + selectId + '" class="xr-sort-select">' +
            '<option value="newest" selected>Newest breach first</option>' +
            '<option value="oldest">Oldest breach first</option>' +
            '<option value="added">Recently added first</option>' +
            '</select></div>';
        table.before(controls);
        var sortLabels = {
            newest: 'Table sorted by newest breach first.',
            oldest: 'Table sorted by oldest breach first.',
            added: 'Table sorted by recently added first.'
        };
        $('#' + selectId).on('change', function () {
            mode = this.value;
            rerender();
            $('#sr-loading-status').text(sortLabels[this.value] || 'Table sorted.');
        });
        $('#' + selectId + '-pw').on('change', function () {
            passwordsOnly = this.checked;
            rerender();
            $('#sr-loading-status').text(passwordsOnly ? 'Showing only breaches that exposed passwords.' : 'Showing all breaches.');
        });
    }
    rerender();
}

function collectVisibleBreaches(response) {
    var all = [];
    if (response && response.ExposedBreaches && response.ExposedBreaches.breaches_details) {
        all = all.concat(response.ExposedBreaches.breaches_details);
    }
    if (token && response && response.ExposedBreaches && response.ExposedBreaches.sensitive_breaches_details) {
        all = all.concat(response.ExposedBreaches.sensitive_breaches_details);
    }
    return all;
}

function renderExposureSummary(response) {
    var band = document.getElementById('chart_div');
    if (!band || document.getElementById('xr-quick-summary')) return;
    var all = collectVisibleBreaches(response);
    if (!all.length) return;
    var withPassword = all.filter(function (breach) {
        return /password/i.test(breach.xposed_data || '');
    }).length;
    var withoutPassword = all.length - withPassword;
    var breachWord = all.length === 1 ? 'breach' : 'breaches';
    var text;
    if (withPassword === 0) {
        text = 'Your email appeared in <strong>' + all.length + '</strong> ' + breachWord + '. None of them exposed a password, but details like your email address are out there.';
    } else if (withoutPassword === 0) {
        text = 'Your email appeared in <strong>' + all.length + '</strong> ' + breachWord + ', and ' + (all.length === 1 ? 'it' : 'every one of them') + ' exposed your password.';
    } else {
        text = 'Your email appeared in <strong>' + all.length + '</strong> breaches: <strong>' + withPassword + '</strong> exposed your password, <strong>' + withoutPassword + '</strong> exposed other details like your email but no password.';
    }
    band.insertAdjacentHTML('beforeend', '<p class="xr-quick-summary" id="xr-quick-summary">' + text + '</p>');
}

function initJumpnavSpy() {
    var nav = document.getElementById('xr-jumpnav');
    if (!nav || typeof IntersectionObserver === 'undefined') return;
    var links = nav.querySelectorAll('a[href^="#"]');
    var linkById = {};
    var targets = [];
    Array.prototype.forEach.call(links, function (link) {
        var id = link.getAttribute('href').slice(1);
        var el = document.getElementById(id);
        if (el) {
            linkById[id] = link;
            targets.push(el);
        }
    });
    if (!targets.length) return;
    function setActive(id) {
        Array.prototype.forEach.call(links, function (link) {
            link.classList.remove('xr-jumpnav-active');
            link.removeAttribute('aria-current');
        });
        if (linkById[id]) {
            linkById[id].classList.add('xr-jumpnav-active');
            linkById[id].setAttribute('aria-current', 'true');
        }
    }
    var observer = new IntersectionObserver(function (entries) {
        var current = null;
        entries.forEach(function (entry) {
            if (entry.isIntersecting) current = entry.target;
        });
        if (current) setActive(current.id);
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    targets.forEach(function (target) { observer.observe(target); });
}

function renderStatTiles(response) {
    var heroRow = document.querySelector('#xr-sec-score .row');
    if (!heroRow || document.getElementById('xr-stat-tiles')) return;
    var all = collectVisibleBreaches(response);
    if (!all.length) return;
    var withPassword = all.filter(function (breach) {
        return /password/i.test(breach.xposed_data || '');
    }).length;
    var types = {};
    all.forEach(function (breach) {
        String(breach.xposed_data || '').split(';').forEach(function (item) {
            item = item.trim();
            if (item) types[item.toLowerCase()] = true;
        });
    });
    var typeCount = Object.keys(types).length;
    var latestYear = all.reduce(function (max, breach) {
        return Math.max(max, parseInt(breach.xposed_date, 10) || 0);
    }, 0);
    var tiles = [
        { label: 'Breaches found', value: all.length.toLocaleString(), icon: 'fa-database' },
        { label: 'Breaches exposing passwords', value: withPassword.toLocaleString(), icon: 'fa-key' },
        { label: 'Data types exposed', value: typeCount.toLocaleString(), icon: 'fa-th-large' },
        { label: 'Most recent breach', value: latestYear ? String(latestYear) : 'n/a', icon: 'fa-calendar-alt' }
    ];
    var html = '<div id="xr-stat-tiles" class="xr-stat-tiles">';
    tiles.forEach(function (tile) {
        html += '<div class="xr-stat-tile">' +
            '<span class="xr-stat-icon" aria-hidden="true"><i class="fas ' + tile.icon + '"></i></span>' +
            '<span class="xr-stat-value">' + tile.value + '</span>' +
            '<span class="xr-stat-label">' + tile.label + '</span>' +
            '</div>';
    });
    html += '</div>';
    heroRow.insertAdjacentHTML('beforebegin', html);
}

function generateNextSteps(breachesDetails, jsonResponse) {
    var all = collectVisibleBreaches(jsonResponse);
    if (!all.length) all = breachesDetails || [];
    var classes = {};
    all.forEach(function (breach) {
        String(breach.xposed_data || '').split(';').forEach(function (item) {
            item = item.trim();
            if (item) classes[item.toLowerCase()] = item;
        });
    });
    function hasClass(re) {
        return Object.keys(classes).some(function (key) { return re.test(key); });
    }
    var passwordSites = [];
    all.forEach(function (breach) {
        if (/password/i.test(breach.xposed_data || '')) passwordSites.push(escapeHtml(breach.breach));
    });

    var steps = [];
    if (passwordSites.length > 0) {
        var siteList = passwordSites.length <= 3 ? passwordSites.join(', ') : 'the ' + passwordSites.length + ' sites flagged above';
        steps.push('<strong>Change your exposed passwords first.</strong> Start with ' + siteList + '. If you reused any of those passwords on other sites, change them there too, and make every new password unique.');
    }
    steps.push('<strong>Turn on two-factor authentication (2FA).</strong> Begin with your email account, then banking and social media. With 2FA on, a stolen password alone is not enough to break in.');
    if (hasClass(/bank|credit|card|financ|payment|transaction|salar|income|tax/)) {
        steps.push('<strong>Keep an eye on your money.</strong> Financial details were exposed, so review your recent statements and ask your bank to turn on transaction alerts.');
    }
    if (hasClass(/phone|mobile|cell/)) {
        steps.push('<strong>Be careful with calls and texts.</strong> Your phone number was exposed. Treat unexpected calls or messages that ask for codes, payments, or personal details as scams.');
    }
    if (hasClass(/passport|government|national|social security|identity|date.{0,4}birth|physical address/)) {
        steps.push('<strong>Watch for identity theft.</strong> Identity details were exposed. Consider a credit freeze or fraud alert if your country offers one, and question any account or bill you did not initiate.');
    }
    var friendly = Object.keys(classes)
        .filter(function (key) { return !/password|hash/.test(key); })
        .slice(0, 3)
        .map(function (key) { return escapeHtml(classes[key].toLowerCase()); });
    var knownBits = friendly.length ? friendly.join(', ') : 'email address';
    steps.push('<strong>Expect targeted phishing.</strong> Attackers now hold details like your ' + knownBits + ', so be suspicious of messages that quote them or name these breaches, and never use password reset links you did not request.');
    steps.push('<strong>Get alerted about future breaches.</strong> Use the Get Free Breach Alerts button above and we will notify you the moment your email shows up in a new breach.');

    var html = '<div class="xr-next-steps" id="xr-next-steps"><h3><i class="fas fa-tasks" aria-hidden="true"></i> Your Next Steps</h3><ol>';
    steps.forEach(function (step) { html += '<li>' + step + '</li>'; });
    html += '</ol></div>';
    return html;
}

function renderExposureTimeline(response) {
    var detailsEl = document.getElementById('details');
    var host = detailsEl ? detailsEl.parentElement : null;
    if (!host) {
        var bcCanvas = document.getElementById('bc');
        host = bcCanvas ? bcCanvas.closest('.container') : null;
        if (!host) return;
    }
    if (typeof Chart === 'undefined' || document.getElementById('xr-exposure-timeline')) return;
    var all = collectVisibleBreaches(response);
    var items = [];
    all.forEach(function (breach) {
        var year = parseInt(breach.xposed_date, 10);
        if (!year) return;
        var addedDate = new Date(breach.added || '');
        var hasAdded = !isNaN(addedDate.getTime());
        var addedDec = hasAdded ? addedDate.getFullYear() + addedDate.getMonth() / 12 : null;
        items.push({
            name: breach.breach,
            year: year,
            end: Math.max(addedDec === null ? year : addedDec, year + 0.05),
            addedLabel: hasAdded ? formatAddedDate(breach.added) : '',
            risk: String(breach.password_risk || '').toLowerCase()
        });
    });
    if (!items.length) return;
    items.sort(function (a, b) { return a.year - b.year || a.end - b.end; });
    var MAX_ROWS = 30;
    var truncated = 0;
    if (items.length > MAX_ROWS) {
        truncated = items.length - MAX_ROWS;
        items = items.slice(items.length - MAX_ROWS);
    }

    var riskColors = {
        plaintext: { fill: 'rgba(255, 99, 132, 0.8)', border: 'rgb(255, 99, 132)', label: 'Password exposed in plain text' },
        easytocrack: { fill: 'rgba(255, 159, 64, 0.8)', border: 'rgb(255, 159, 64)', label: 'Password easy to crack' },
        other: { fill: 'rgba(54, 162, 235, 0.8)', border: 'rgb(54, 162, 235)', label: 'No password or strongly hashed' }
    };
    function riskKey(risk) {
        return riskColors[risk] ? risk : 'other';
    }

    var minYear = items[0].year;
    var maxEnd = items.reduce(function (m, item) { return Math.max(m, item.end); }, minYear);
    var textColor = getChartTextColor();
    var isDark = isDarkModeActive();
    var height = Math.max(200, items.length * 32 + 80);

    var usedKeys = {};
    items.forEach(function (item) { usedKeys[riskKey(item.risk)] = true; });
    var legendHtml = '<div class="xr-tl-legend">';
    ['plaintext', 'easytocrack', 'other'].forEach(function (key) {
        if (usedKeys[key]) {
            legendHtml += '<span class="xr-tl-legend-item"><span class="xr-tl-dot" style="background:' + riskColors[key].border + '"></span>' + riskColors[key].label + '</span>';
        }
    });
    legendHtml += '</div>';

    var wrap = document.createElement('div');
    wrap.className = 'xr-tl-wrap';
    wrap.innerHTML =
        '<h3 class="xr-tl-title">From Breach to Discovery</h3>' +
        '<p class="xr-tl-sub">Each bar starts in the year a breach happened and ends when it was added to XposedOrNot. A long bar means your data circulated for years before you could be warned.</p>' +
        (truncated ? '<p class="xr-tl-note">Showing the ' + MAX_ROWS + ' most recent of your ' + (items.length + truncated) + ' breaches.</p>' : '') +
        '<div class="xr-tl-canvas" style="height:' + height + 'px"><canvas id="xr-exposure-timeline" role="img" aria-label="Timeline of your breaches from ' + minYear + ' to ' + Math.ceil(maxEnd) + '. Each bar spans from the breach year to the date the breach was added to XposedOrNot."></canvas></div>' +
        legendHtml;
    host.appendChild(wrap);

    timelineChartInstance = new Chart(document.getElementById('xr-exposure-timeline'), {
        type: 'bar',
        data: {
            labels: items.map(function (item) { return item.name; }),
            datasets: [{
                data: items.map(function (item) { return [item.year, item.end]; }),
                backgroundColor: items.map(function (item) { return riskColors[riskKey(item.risk)].fill; }),
                borderColor: items.map(function (item) { return riskColors[riskKey(item.risk)].border; }),
                borderWidth: 1,
                borderSkipped: false,
                borderRadius: 4,
                minBarLength: 8,
                barPercentage: 0.7
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            var item = items[ctx.dataIndex];
                            var lines = ['Breached in ' + item.year];
                            lines.push(item.addedLabel ? 'Added to XposedOrNot: ' + item.addedLabel : 'Date added not recorded');
                            lines.push(riskColors[riskKey(item.risk)].label);
                            return lines;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: minYear - 1,
                    max: Math.floor(maxEnd) + 1,
                    ticks: {
                        color: textColor,
                        stepSize: 1,
                        font: { size: 12, weight: 'bold' },
                        callback: function (value) { return Number.isInteger(value) ? value : ''; }
                    },
                    grid: { color: isDark ? '#3a3a3a' : '#e0e0e0' },
                    title: {
                        display: true,
                        text: 'Year',
                        color: textColor,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                y: {
                    ticks: {
                        color: textColor,
                        autoSkip: false,
                        font: { size: 12, weight: 'bold' }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var footerGroups = document.querySelectorAll('.footer-group h3');
    var footerAccordionActive = window.innerWidth <= 768;
    footerGroups.forEach(function(header) {
        if (footerAccordionActive) {
            header.setAttribute('tabindex', '0');
            header.setAttribute('role', 'button');
            header.setAttribute('aria-expanded', 'false');
        }

        function toggleGroup() {
            if (window.innerWidth <= 768) {
                var group = header.parentElement;
                var isActive = group.classList.toggle('active');
                header.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            }
        }

        header.addEventListener('click', toggleGroup);
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleGroup();
            }
        });
    });
});

_setupHeatMapLazyLoad();
