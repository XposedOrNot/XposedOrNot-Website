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

// Announce loading state to screen readers
$('body').append('<div id="sr-loading-status" class="sr-only" aria-live="assertive" role="status">Loading your breach report...</div>');

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

// Lazy-load confetti library
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
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
        script.crossOrigin = 'anonymous';
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
        // Confetti library unavailable — skip animation
    });
}

function showNoBreachView(emailAddr) {
    $.LoadingOverlay("hide");
    $('#sr-loading-status').text('Report loaded.');

    // Hide all report sections except the first
    $('section[aria-label="Risk analysis and recommendations"]').hide();
    $('section[aria-label="Breach summary"]').hide();
    $('section[aria-label="Sensitive data breaches"]').hide();
    $('section[aria-label="Password risk and top breaches"]').hide();
    $('section[aria-label="Industry exposure"]').hide();
    $('section[aria-label="Exposed data categories"]').hide();
    $('section[aria-label="Detailed breach breakdown"]').hide();
    $('section[aria-label="Breach timeline visualization"]').hide();
    $('section[aria-label="Protect your accounts"]').hide();

    // Replace the first section content with a clean "all clear" view
    var safeEmail = escapeHtml(emailAddr);
    var isDark = document.body.classList.contains('dark-mode') ||
                 document.documentElement.getAttribute('data-theme') === 'dark';

    $('section[aria-label="Risk score overview"] .container').html(
        '<h1 class="report-h1">Your Data Breach Report</h1>' +
        '<div style="text-align:center; padding: 60px 20px; max-width: 600px; margin: 0 auto;">' +
            '<div style="font-size: 72px; margin-bottom: 20px;" role="img" aria-label="Celebration">&#127881;</div>' +
            '<h2 style="color: ' + (isDark ? '#5bb8d0' : '#28a745') + '; font-size: 28px; font-weight: 700; margin-bottom: 16px;">All Clear!</h2>' +
            '<p style="font-size: 18px; color: ' + (isDark ? '#ccc' : '#555') + '; margin-bottom: 12px;">' +
                '<strong>' + safeEmail + '</strong> was not found in any data breaches loaded in XposedOrNot.' +
            '</p>' +
            '<p style="font-size: 16px; color: ' + (isDark ? '#aaa' : '#777') + '; margin-bottom: 30px;">' +
                'Your email doesn\'t appear in our database of known breaches. Stay protected by setting up free alerts — we\'ll notify you if this changes.' +
            '</p>' +
            '<button type="button" class="btn btn-lg btn-alert" data-toggle="modal" data-target="#alertMeModal" style="margin-top: 10px;">' +
                '<i class="fa fa-bell" aria-hidden="true"></i>&nbsp; Get Free Breach Alerts' +
            '</button>' +
        '</div>'
    );

    // Fire confetti
    setTimeout(fireConfetti, 300);
}

let by26 = by25 = by24 = by23 = by22 = by21 = by20 = by19 = by18 = by17 = by16 = by15 = by14 = by13 = by12 = by11 = by10 = by09 = by08 = by07 = 0;
let i11 = i12 = i13 = i14 = i15 = i16 = i17 = i18 = i19 = i20 = i1 = i2 = i3 = i4 = i5 = i6 = i7 = i8 = i9 = i10 = i20 = i21 = i22 = i23 = i24 = i25 = i26 = 0;
let unknown = plaintext = easy = hard = password_score = 0;

function getAlertType(riskLabel) {
    switch (riskLabel) {
        case 'Low':
            return 'success';
        case 'Medium':
            return 'warning';
        case 'High':
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
        case 'High':
            introIcon = '🔴';
            introTitle = 'Your accounts are at serious risk';
            introBody = 'Multiple breaches have exposed sensitive data tied to your email. Take the steps below immediately to protect your accounts and identity.';
            introClass = 'risk-intro-high';
            break;
        case 'Medium':
            introIcon = '🟠';
            introTitle = 'Some of your data has been exposed';
            introBody = 'Your email appeared in several data breaches. Act now to change compromised passwords and limit potential damage.';
            introClass = 'risk-intro-medium';
            break;
        default:
            introIcon = '🟢';
            introTitle = 'Your exposure is limited';
            introBody = 'Your email has minimal breach exposure. The steps below will help you stay ahead of future threats.';
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
        html += ' immediately. Use a password manager (like Bitwarden — free) to generate a unique password for every account.</div>';
        html += '</div>';
    }

    if (piiCount > 0) {
        html += '<div class="risk-card risk-card-warning">';
        html += '<div class="risk-card-header">';
        html += '<span class="risk-card-icon" role="img" aria-label="Personal information">👤</span>';
        html += '<span class="risk-card-title">Personal Information Exposed</span>';
        html += '<span class="risk-badge risk-badge-medium">' + piiCount + (piiCount === 1 ? ' occurrence' : ' occurrences') + '</span>';
        html += '</div>';
        html += '<p class="risk-card-impact">Your personal details (name, address, phone, or date of birth) have been exposed. This data can be used for identity theft, fraudulent accounts, or social engineering attacks.</p>';
        html += '<div class="risk-card-action"><strong>Do this now:</strong> Set up a credit freeze at all 3 bureaus (Equifax, Experian, TransUnion) — it is free and takes 10 minutes. Enable transaction alerts on your bank accounts and watch for mail or calls referencing your personal details.</div>';
        html += '</div>';
    }

    if (commsCount > 0) {
        html += '<div class="risk-card risk-card-info">';
        html += '<div class="risk-card-header">';
        html += '<span class="risk-card-icon" role="img" aria-label="Email exposure">📧</span>';
        html += '<span class="risk-card-title">Email &amp; Communication Exposure</span>';
        html += '<span class="risk-badge risk-badge-low">' + commsCount + (commsCount === 1 ? ' occurrence' : ' occurrences') + '</span>';
        html += '</div>';
        html += '<p class="risk-card-impact">Your email address and communication details are exposed. Expect targeted phishing emails, spam, and social engineering attempts — especially emails mentioning breached services by name.</p>';
        html += '<div class="risk-card-action"><strong>Do this now:</strong> Never click password reset links you did not request. If an email mentions a breach you recognize, go directly to that site (type the URL yourself) instead of clicking any link. Enable 2FA on your email account — it is the single most effective protection.</div>';
        html += '</div>';
    }

    if (demoCount > 0) {
        html += '<div class="risk-card risk-card-info">';
        html += '<div class="risk-card-header">';
        html += '<span class="risk-card-icon" role="img" aria-label="Demographic data">📊</span>';
        html += '<span class="risk-card-title">Demographic Data Exposed</span>';
        html += '<span class="risk-badge risk-badge-low">' + demoCount + (demoCount === 1 ? ' occurrence' : ' occurrences') + '</span>';
        html += '</div>';
        html += '<p class="risk-card-impact">Demographic information like age, gender, location, or occupation has been exposed. This data is used to build profiles for targeted scams and impersonation.</p>';
        html += '<div class="risk-card-action"><strong>Do this now:</strong> Review your social media privacy settings — limit what is publicly visible. Be skeptical of unsolicited calls or messages that seem to know personal details about you.</div>';
        html += '</div>';
    }

    html += '</div>';

    html += '<div class="risk-cta">';
    html += '<p>Don\'t wait for the next breach to find out.</p>';
    html += '<button type="button" class="btn btn-lg btn-alert" data-toggle="modal" data-target="#alertMeModal">';
    html += '<i class="fa fa-bell" aria-hidden="true"></i>&nbsp; Get Breach Alerts — Free</button>';
    html += '</div>';

    html += '</div>';
    return html;
}

let email, token;

try {
    email = decodeURIComponent($.urlParam('email'));
    const hasToken = $.urlParam('token');
    token = hasToken ? decodeURIComponent(hasToken) : null;
} catch (error) {
    console.error('Error parsing URL parameters:', error);
    window.location.replace("https://xposedornot.com");
}

const emailHeader = (category, prefixHtml = '') => `<h2 class="section-heading">${prefixHtml}${escapeHtml(category)} for: ${escapeHtml(email)}</h2>`;

$("#email").html(emailHeader("Breach Summary"));
$("#email_sensitive").html(emailHeader('Sensitive Data Breaches', '<span class="help-icon" tabindex="0" role="button" aria-label="Sensitive breach explanation" data-toggle="tooltip" data-placement="auto" title="Breaches that cannot be publicly searched considering the sensitivity of the data exposed."><i class="fas fa-question-circle" aria-hidden="true"></i></span>&nbsp;&nbsp; '));
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
    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal">
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
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal">
            <i class="fas fa-envelope" aria-hidden="true"></i> Verify Email Now
        </button>
    `);
}

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
                    let tableRowsHtml = "";
                    for (var i = 0; i < sensitiveBreaches.length; i++) {
                        tableRowsHtml += '<tr>' +
                            '<th scope="row" style="text-align: center;"><span role="img" aria-label="Sensitive breach">🔥</span> ' + escapeHtml(sensitiveBreaches[i].breach) + '<br>' +
                            '<img src="' + sensitiveBreaches[i].logo + '" alt="' + escapeHtml(sensitiveBreaches[i].breach) + ' logo" style="width: 50px; height: 50px;">' +
                            '</th>' +
                            '<td><div class="text">' + escapeHtml(sensitiveBreaches[i].details) + '</div>' +
                            '<button type="button" class="see-more" aria-expanded="false">See More</button></td>' +
                            '<td style="text-align: right;">' + parseInt(sensitiveBreaches[i].xposed_records).toLocaleString() + '</td>' +
                            '</tr>';
                    }
                    $("#data_breach_sensitive").html(tableRowsHtml);
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
                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal">
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

        drawChart_categories(xposedData.children)
        google.charts.load('current', {
            'packages': ['gauge']
        });
        google.charts.setOnLoadCallback(drawChart);

        function drawChart() {
            var data = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['Risk Score', Math.round(riskScore)]
            ]);

            const isMobile = window.innerWidth <= 767;

            var options = {
                width: isMobile ? 300 : 500,
                height: isMobile ? 200 : 300,
                greenFrom: 0,
                greenTo: 33,
                yellowFrom: 34,
                yellowTo: 66,
                redFrom: 67,
                redTo: 100,
                minorTicks: 5,
                max: 100,
                majorTicks: ['0', '20', '40', '60', '80', '100']
            };

            var chart = new google.visualization.Gauge(document.getElementById('chart_div'));

            const applyTextColor = function() {
                const isDarkMode = document.body.classList.contains('dark-mode') ||
                                  document.documentElement.getAttribute('data-theme') === 'dark';
                const chartDiv = document.getElementById('chart_div');
                if (chartDiv) {
                    const textElements = chartDiv.querySelectorAll('svg text');
                    textElements.forEach(text => {
                        text.setAttribute('fill', isDarkMode ? '#ffffff' : '#000000');
                        text.style.fill = isDarkMode ? '#ffffff' : '#000000';
                        text.style.fontWeight = '600';
                    });
                }
            };

            chart.draw(data, options);

            setTimeout(applyTextColor, 150);

            window.addEventListener('resize', function () {
                const isMobile = window.innerWidth <= 767;
                options.width = isMobile ? 300 : 500;
                options.height = isMobile ? 200 : 300;
                chart.draw(data, options);
                setTimeout(applyTextColor, 150);
            });

            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
                        setTimeout(applyTextColor, 50);
                    }
                });
            });

            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme']
            });
        }

        let alertType;
        switch (riskLabel) {
            case "Medium":
                alertType = "warning";
                break;
            case "High":
                alertType = "danger";
                break;
            case "Low":
                alertType = "success";
                break;
            default:
                alertType = "warning";
        }

        const riskScoreHtml = `<h2 class="section-heading section-heading-${alertType}">Your Risk Score: <span class="risk-level-${alertType}">${riskLabel}</span>&nbsp;&nbsp;<span class="help-icon" tabindex="0" role="button" aria-label="Risk score explanation" data-toggle="tooltip" data-placement="auto" title="Calculated based on the number and severity of data breaches, the time since the last breach, and the strength of the exposed password. Please read FAQ for more details on this."><i class="fas fa-question-circle" aria-hidden="true"></i></span></h2>`;
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

                sensitiveBreaches.forEach(breach => {
                    const industry = breach.industry.toLowerCase().substring(0, 4); // Get industry code
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
                name: 'News',
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
                    background-color: ${document.body.classList.contains('dark-mode') ? '#2d3436' : '#f8f9fa'};
                    transition: all 0.3s ease;
                    margin-bottom: 8px;
                }
                .industry-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .industry-name {
                    font-weight: 500;
                    color: ${document.body.classList.contains('dark-mode') ? '#fff' : '#2d3436'};
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
                [data-theme="dark"] .badge-low, .dark-mode .badge-low {
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
                <div class="github-collab-section h-100">
                    <div class="github-content text-center">
                        <div class="github-icon mb-3">
                            <i class="fab fa-github fa-3x" aria-hidden="true"></i>
                        </div>
                        <h3 class="mb-3">Join Our Open Source Community</h3>
                        <p class="mb-4">
                            Help us make the internet safer by contributing to XposedOrNot.
                            Your ideas and contributions can make a difference!
                        </p>
                        <div class="github-stats mb-3">
                            <div class="row justify-content-center">
                                <div class="col-auto px-3">
                                    <div class="stat-item">
                                        <i class="fas fa-code-branch" aria-hidden="true"></i>
                                        <span>Open Source</span>
                                    </div>
                                </div>
                                <div class="col-auto px-3">
                                    <div class="stat-item">
                                        <i class="fas fa-users" aria-hidden="true"></i>
                                        <span>Community</span>
                                    </div>
                                </div>
                                <div class="col-auto px-3">
                                    <div class="stat-item">
                                        <i class="fas fa-shield-alt" aria-hidden="true"></i>
                                        <span>Security</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a href="https://github.com/xposedornot" target="_blank" rel="noopener" class="btn btn-github">
                            <i class="fab fa-github mr-2" aria-hidden="true"></i> Visit our GitHub<span class="sr-only"> (opens in new tab)</span>
                        </a>
                    </div>
                </div>
            `;

            $('#github-section').html(githubSection);

            breachesDetailsHtml = ''
            if (jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.breaches_details) {
                let breachesTable = "";
                const regularBreaches = jsonResponse.ExposedBreaches.breaches_details;
                for (var i = 0; i < regularBreaches.length; i++) {
                    breachesTable += '<tr>' +
                        '<th scope="row" style="text-align: center;">' + escapeHtml(regularBreaches[i].breach) + '<br>' +
                        '<img src="' + regularBreaches[i].logo + '" alt="' + escapeHtml(regularBreaches[i].breach) + ' logo" style="width: 50px; height: 50px;">' +
                        '</th>' +
                        '<td><div class="text">' + escapeHtml(regularBreaches[i].details) + '</div>' +
                        '<button type="button" class="see-more" aria-expanded="false">See More</button></td>' +
                        '<td style="text-align: right;">' + parseInt(regularBreaches[i].xposed_records).toLocaleString() + '</td>' +
                        '</tr>';

                    breachesDetailsHtml += generateBreachDetailHtml(regularBreaches[i], false);
                }
                $("#data_breach").html(breachesTable);
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
                            color: getChartTextColor(),
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
                            color: getChartTextColor(),
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
    })
    .fail(function (response) {
        if (response.status === 404) {
            showNoBreachView(email);
        } else if (response.status === 429) {
            $.LoadingOverlay("hide");
            $('#sr-loading-status').text('Report loaded.');
            document.getElementById("db-s").className = "visible alert alert-danger";
            $("#db-s").html("<b>Please Slow down.</b><br>Looks like you're going too fast, please try again after some time.");
            $("#db-s").show();
        } else {
            $.LoadingOverlay("hide");
            $('#sr-loading-status').text('Report loaded.');
            document.getElementById("db-s").className = "visible alert alert-warning";
            $("#db-s").html("<b>Something went wrong.</b><br>We couldn't load your breach report. Please try again later.");
            $("#db-s").show();
        }
    })

Chart.register(ChartDataLabels);

function isDarkModeActive() {
    return document.body.getAttribute('data-theme') === 'dark' ||
           document.body.classList.contains('dark-mode') ||
           localStorage.getItem('darkSwitch') === 'dark';
}

function getChartTextColor() {
    return isDarkModeActive() ? '#FFFFFF' : '#333333';
}

let top5ChartInstance = null;
let passwordsChartInstance = null;
let lineChartInstance = null;

function updateChartsForDarkMode() {
    const textColor = getChartTextColor();
    const isDark = isDarkModeActive();

    Chart.defaults.color = textColor;

    if (top5ChartInstance) {
        top5ChartInstance.options.plugins.legend.labels.color = textColor;
        top5ChartInstance.options.plugins.datalabels.color = textColor;
        top5ChartInstance.update('none');
    }

    if (passwordsChartInstance) {
        passwordsChartInstance.options.plugins.legend.labels.color = textColor;
        passwordsChartInstance.options.plugins.datalabels.color = textColor;
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
}

const chartDarkModeObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
            setTimeout(updateChartsForDarkMode, 100);
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
}

$(window).on("load", function () {
});

$('#alertMeModal').on('hidden.bs.modal', function () {
    $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
    $("#alertMe_i2").addClass("fa fa-bell ring");
    $("#h2head").attr("class", "modal-header-primary");
    $('#message-text').val("We'll notify you instantly if your email appears in any new data breach. Verify your email and activate your FREE subscription by clicking 'Start Monitoring'.");
    $("#alertMe").show();
    $("#alertMeClose, #a_succ").hide();
});

$('#alertMeModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget)
    var recipient = button.data('whatever')
    var modal = $(this)
    modal.find('.modal-body input').val(email)
    $('#thedudalModal').modal('hide');
})
$(document).ready(function () {
    $('#alertMeModal').on('keydown', function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            $('#alertMe').click();
        }
    });
    $('#recipient-name').on('input', function () {
        var email = $(this).val();
        var isValid = validateEmail(email);
        var $errorMsg = $('#email-validation-error');
        if ($errorMsg.length === 0) {
            $(this).after('<div id="email-validation-error" role="alert" style="color: #c82333; font-size: 13px; margin-top: 4px; display: none;">Please enter a valid email address.</div>');
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
            $('#message-text').val("Please enter a valid email address to receive alerts.");
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

        var apiUrl = 'https://api.xposedornot.com/v1/alertme/' + encodeURIComponent(inputValue);
        var headers = turnstileResponse ? { 'X-Turnstile-Token': turnstileResponse } : {};

        var successMessage = "Verification email sent! Check your inbox to activate free breach monitoring.";
        var alreadySubscribedMessage = "You're already protected! This email is registered for breach alerts.";
        var unableToDeliverMessage = "Unable to send email to this address. Please check and try again.";

        $.ajax({
            url: apiUrl,
            type: 'GET',
            headers: headers
        })
            .done(function () {
                $('#message-text').val(successMessage);
                $("#h2head").attr("class", "modal-header-success");
                $("#alertMe").hide();
                $("#alertMeClose").show();
                $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
                $("#alertMe_i2").addClass("fa fa-bell ring");
            })
            .fail(function (jqXHR) {
                var message = alreadySubscribedMessage;
                var headerClass = "modal-header-success";

                try {
                    var response = jqXHR.responseJSON || JSON.parse(jqXHR.responseText);
                    if (response && response.status === "Error") {
                        message = unableToDeliverMessage;
                        headerClass = "modal-header-danger";
                    }
                } catch (e) {
                }

                $('#message-text').val(message);
                $("#h2head").attr("class", headerClass);
                $("#alertMe").hide();
                $("#alertMeClose").show();
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

            $('.github-content').css({
                'padding': '15px 5px'
            });

            if (window.innerWidth < 400) {
                $('.github-stats .row').css({
                    'flex-direction': 'column',
                    'align-items': 'center'
                });

                $('.github-stats .col-auto').css({
                    'width': '100%',
                    'text-align': 'center',
                    'margin-bottom': '10px'
                });
            }
        } else {

            $('.xon-row2-right').css({
                'height': '450px',
                'margin-bottom': ''
            });

            $('.github-collab-section').css({
                'height': '100%',
                'overflow': 'hidden',
                'margin-bottom': ''
            });

            $('.github-content').css({
                'padding': ''
            });

            $('.github-stats .row').css({
                'flex-direction': '',
                'align-items': ''
            });

            $('.github-stats .col-auto').css({
                'width': '',
                'text-align': '',
                'margin-bottom': ''
            });
        }
    }

    adjustLayoutForScreenSize();
    $(window).on('resize', adjustLayoutForScreenSize);
});

var floatingButton = document.getElementById('floating-button');

function getFloatingButtonTop() {
    return window.innerWidth < 992 ? '70px' : '10px';
}

floatingButton.style.position = 'fixed';
floatingButton.style.top = getFloatingButtonTop();
floatingButton.style.right = '20px';

window.addEventListener('resize', function () {
    floatingButton.style.top = getFloatingButtonTop();
});

var analyticsApiUrl = `https://api.xposedornot.com/v1/analytics/${encodeURIComponent(email)}`;

$.get(analyticsApiUrl)
    .done(function (response) {
        if (!response || !response.description || !response.children) {
            return;
        }
        var dataForTree = [{
            description: response.description,
            children: response.children.filter(function (year) { return year.children && year.children.length > 0; })
        }];

        $('#tree-container').hortree({
            data: dataForTree
        });
    })
    .fail(function () {
        // Analytics data unavailable — silently skip hortree
    });


var leaving = false;
$(document).on('mouseleave', function (e) {
    if (e.clientY < 0 && !leaving) {
        leaving = true;
        $('#alertMeModal').modal('show');
    }
});

$(window).on('beforeunload', function () {
    if (!leaving) {
        $('#alertMeModal').modal('show');
        return false;
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
        agent.show();
        agent.speak('Hi there! I\'m XON Clippy, your friendly security assistant! 👋');
        agent.gestureAt(200, 200);
        agent.moveTo(200, 200);
        agent.speak('I\'m here to help you understand your data breach exposure and keep your information safe 🛡️');
        agent.animate();
        agent.animate();
        agent.gestureAt(200, 200);
        agent.moveTo(200, 200);
        agent.speak('I noticed your email was found in some data breaches - but don\'t worry, I\'m here to help you take control! 💪');
        agent.animate();
        agent.animate();
        agent.moveTo(1550, 650);
        agent.animate();
        agent.animate();
        agent.speak('First things first: Let\'s make sure this doesn\'t happen again. I recommend enabling breach alerts right away! 🔔');
        agent.animate();
        agent.animate();
        agent.speak('Just click that "Alert Me" button, and I\'ll keep watch over your email 24/7. Think of me as your personal security guard! 🕵️');
        agent.animate();
        agent.animate();
        agent.speak('Did you know? We\'ve identified over 10 billion exposed records in our database. That\'s why staying informed is crucial! 📊');
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
        setInterval(speakRandom, Math.floor(Math.random() * 60000));
    });

});

google.charts.load("current", {
    packages: ["corechart"]
});

function getCategoryBadgeClass(count) {
    if (count > 10) return 'high';
    if (count > 5) return 'medium';
    return 'low';
}

function drawChart_categories(xposedData) {
    try {
        if (!xposedData || !xposedData.length) {
            return;
        }

        const style = document.createElement('style');
        const isDarkMode = document.body.classList.contains('dark-mode');

        style.textContent = `
            .categories-list {
                padding: 15px;
            }
            .category-header {
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid ${isDarkMode ? '#444' : '#ddd'};
            }
            .category-header h5 {
                color: ${isDarkMode ? '#9fc0e0' : '#3A4B5E'};
                font-weight: 600;
                margin: 0;
                font-size: 1.1rem;
            }
            .category-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border-radius: 8px;
                background-color: #f8f9fa;
                transition: all 0.3s ease;
                margin-bottom: 8px;
                border: 1px solid #e1e4e8;
            }
            .category-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                background-color: #e9ecef;
            }
            .category-name {
                font-weight: 500;
                color: #2d3436;
            }
            [data-theme="dark"] .category-item, .dark-mode .category-item {
                background-color: #1f2937;
                color: #ffffff;
                border: 1px solid #4a5568;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            [data-theme="dark"] .category-item:hover, .dark-mode .category-item:hover {
                background-color: #2d3748;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                border: 1px solid #6daae0;
            }
            [data-theme="dark"] .category-name, .dark-mode .category-name {
                color: #e2e8f0;
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
            [data-theme="dark"] .badge, .dark-mode .badge {
                background-color: #2d3748;
                color: #e2e8f0;
                border: 1px solid #4a5568;
                font-weight: 700;
            }
            [data-theme="dark"] .badge-high, .dark-mode .badge-high {
                background-color: #e53e3e;
                color: white;
                border: none;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }
            [data-theme="dark"] .badge-medium, .dark-mode .badge-medium {
                background-color: #ecc94b;
                color: #1a202c;
                border: none;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }
            [data-theme="dark"] .badge-low, .dark-mode .badge-low {
                background-color: #2874a6;
                color: white;
                border: none;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }
            [data-theme="dark"] .category-header h5, .dark-mode .category-header h5 {
                color: #6daae0;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }
            @media (max-width: 767px) {
                .category-header h5 {
                    font-size: 0.95rem !important;
                    line-height: 1.3;
                    padding: 5px 0;
                }
                [data-theme="dark"] .category-header h5, .dark-mode .category-header h5 {
                    font-size: 0.95rem !important;
                }
                .category-header {
                    margin-bottom: 8px;
                    padding-bottom: 4px;
                }
                .categories-list {
                    padding: 10px;
                }
            }
        `;
        document.head.appendChild(style);

        let categoriesHTML = `
            <div class="categories-list">
                <div class="row">
        `;

        xposedData.forEach(category => {
            if (!category.children || !category.children.length) {
                return;
            }

            const totalItems = category.children.reduce((sum, item) => sum + item.value, 0);
            if (totalItems === 0) {
                return;
            }

            let categoryName = category.name;
            if (categoryName.startsWith("data_")) {
                categoryName = categoryName.substring(5);
            }

            categoriesHTML += `
                <div class="col-12 mb-3">
                    <div class="category-header">
                        <h3>${categoryName} (${totalItems} items)</h3>
                    </div>
                    <div class="row">
            `;

            category.children.forEach(item => {
                if (item.value === 0) return;

                let itemName = item.name;
                if (itemName.startsWith("data_")) {
                    itemName = itemName.substring(5);
                }

                categoriesHTML += `
                    <div class="col-md-6 mb-2">
                        <div class="category-item ${isDarkMode ? 'dark-mode' : ''}">
                            <span class="category-name">${itemName}</span>
                            <span class="badge badge-${getCategoryBadgeClass(item.value)}">${item.value}</span>
                        </div>
                    </div>
                `;
            });

            categoriesHTML += `
                    </div>
                </div>
            `;
        });

        categoriesHTML += `
                </div>
            </div>
        `;

        $('#categories-list').html(categoriesHTML);

        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    } catch (error) {
        console.warn('Error rendering categories list:', error);
    }
}

$(document).ready(function () {
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });
    $('#back-to-top').click(function () {
        $('body,html').animate({
            scrollTop: 0
        }, 400);
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

function generateBreachDetailHtml(breach, isSensitive) {
    let html = "<div><b><span class='notser'>" + escapeHtml(breach.xposed_date) + "</span></b><br><br><div class='row'><div class='col-sm-4' style='text-align: center'><img height='75' width='100' src='";
    html += breach.logo + "' alt='" + escapeHtml(breach.breach) + " logo'></div><div class='col-sm-4' style='text-align: center'><h3><strong><a href='breach.html#" + encodeURIComponent(breach.breach) + "' target='_blank' rel='noopener'>";
    html += escapeHtml(breach.breach) + "<span class='sr-only'> (opens in new tab)</span></a></strong></h3></div><div class='col-sm-4' style='text-align: center'><img height='75' width='75' src='";
    html += 'static/logos/industry/' + encodeURIComponent(breach.industry) + ".png' alt='" + escapeHtml(breach.industry) + " industry icon'>";
    html += "<p>Industry: " + escapeHtml(breach.industry) + "</p></div></div><br>";
    html += "<div style='text-align: center'><table style='width: 85%; font-size: 16px' class='table-striped table-bordered table-hover'>";
    html += "<caption class='sr-only'>Breach details for " + escapeHtml(breach.breach) + "</caption>";
    html += "<thead><tr><th scope='col'>Detail</th><th scope='col'>Value</th></tr></thead><tbody>";
    html += "<tr><th scope='row'>Number of Records Exposed</th><td>" + parseInt(breach.xposed_records).toLocaleString() + "</td></tr>";
    html += "<tr><th scope='row'>Data Types Exposed</th><td>" + escapeHtml(breach.xposed_data.replace(/;/g, ', ')) + "</td></tr>";
    html += "<tr><th scope='row'>Password/Hash Status</th><td>" + escapeHtml(breach.password_risk) + "</td></tr>";
    html += "<tr><th scope='row'>Affected Domain</th><td>" + escapeHtml(breach.domain) + "</td></tr></tbody></table>";
    html += "<p style='font-size: 16px'>" + escapeHtml(breach.details) + "</p></div><br><br>";
    html += "<b>Reference link(s):</b><br><a target='_blank' rel='noopener' href='" + encodeURI(breach.references) + "'>" + escapeHtml(breach.references) + "<span class='sr-only'> (opens in new tab)</span></a>";
    html += "<br><br><span class='ver'>Searchable</span>";
    if (breach.verified === "Yes") {
        html += "<span class='ver'>Verified</span>";
    } else {
        html += "<span class='notver'>Untrusted</span>";
    }
    html += isSensitive ? "<span class='notser'>Sensitive Data Breach</span>" : "<span class='notser'>Data Breach</span>";
    html += "</div><hr>";
    return html;
}

document.addEventListener('DOMContentLoaded', function() {
    var footerGroups = document.querySelectorAll('.footer-group h3');
    footerGroups.forEach(function(header) {
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        header.setAttribute('aria-expanded', 'false');

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
