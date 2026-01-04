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

let by25 = by24 = by23 = by22 = by21 = by20 = by19 = by18 = by17 = by16 = by15 = by14 = by13 = by12 = by11 = by10 = by09 = by08 = by07 = 0;
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
    let analysisText = "<div align='left' class='alert alert-info'>";
    const breachesDetails = jsonResponse.ExposedBreaches.breaches_details;
    const xposedData = jsonResponse.BreachMetrics.xposed_data[0].children;

    const categoryColor = "#407f7f";
    const actionTextColor = "#355035";

    let plaintextBreaches = [];
    let easyToCrackBreaches = [];
    breachesDetails.forEach(breach => {
        if (breach.password_risk === 'plaintext') {
            plaintextBreaches.push(`<strong>${breach.breach}</strong>`);
        } else if (breach.password_risk === 'easytocrack') {
            easyToCrackBreaches.push(`<strong>${breach.breach}</strong>`);
        }
    });

    let piiBreachesCount = xposedData.find(category => category.name.includes("Personal Identification"))?.children.reduce((sum, item) => sum + item.value, 0) || 0;
    let emailBreachesCount = xposedData.find(category => category.name.includes("Communication and Social Interactions"))?.children.reduce((sum, item) => sum + item.value, 0) || 0;
    let communicationBreachesCount = xposedData.find(category => category.name.includes("Communication and Social Interactions"))?.children.reduce((sum, item) => sum + item.value, 0) || 0;
    let demographicsBreachesCount = xposedData.find(category => category.name.includes("Demographics"))?.children.reduce((sum, item) => sum + item.value, 0) || 0;

    analysisText += "<ol>";

    if (plaintextBreaches.length > 0 || easyToCrackBreaches.length > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>🔐 Compromised Passwords (${plaintextBreaches.length + easyToCrackBreaches.length} Breaches):</strong></span><ul>`;
        if (plaintextBreaches.length > 0) {
            analysisText += `<li>Breaches with plain text passwords: ${plaintextBreaches.join(', ')}.</li>`;
        }
        if (easyToCrackBreaches.length > 0) {
            analysisText += `<li>Breaches with easy-to-crack passwords: ${easyToCrackBreaches.join(', ')}.</li>`;
        }
        analysisText += `<li style='color: ${actionTextColor};'><strong>Recommended Action:</strong> If your email is linked to any of these breaches, immediately change your passwords. Use strong, unique passwords for each account.</li></ul></li><br>`;
    }

    if (piiBreachesCount > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>👤 Personal Information Exposure (${piiBreachesCount} Occurrences):</strong></span> Your personal details might be exposed.<br><strong style='color: ${actionTextColor};'>Recommended Action:</strong> Monitor for unusual activities that could indicate identity theft or fraud.</li><br>`;
    }

    if (emailBreachesCount > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>📧 Email Addresses and Phishing Risks (${emailBreachesCount} Occurrences):</strong></span> Your email address might be used in phishing attempts.<br><strong style='color: ${actionTextColor};'>Recommended Action:</strong> Be cautious with emails from unknown sources and avoid clicking on suspicious links.</li><br>`;
    }

    if (communicationBreachesCount > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>💬 Communication and Social Interactions (${communicationBreachesCount} Occurrences):</strong></span> Your communication details may be at risk.<br><strong style='color: ${actionTextColor};'>Recommended Action:</strong> Be cautious with your online interactions and consider updating privacy settings on social platforms.</li><br>`;
    }

    if (demographicsBreachesCount > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>📊 Demographics (${demographicsBreachesCount} Occurrences):</strong></span> Sensitive demographic information might be exposed.<br><strong style='color: ${actionTextColor};'>Recommended Action:</strong> Review and secure any accounts that may contain detailed personal information to prevent identity theft.</li><br>`;
    }

    analysisText += "</ol>";

    analysisText += `<p><strong>Your Risk Score:</strong> <span class='alert alert-${getAlertType(riskLabel)}' style='padding: 2px 8px; display: inline-block; margin: 0;'><strong>${riskLabel}</strong></span><br><br><strong>Our Recommendations:</strong> `;
    switch (riskLabel) {
        case 'Low':
            analysisText += "<span style='display: inline-block;'>🟢 Stay vigilant and proactive in securing your data.</span>";
            break;
        case 'Medium':
            analysisText += "<span style='display: inline-block;'>🟠 Enhance your security measures and remain alert.</span>";
            break;
        case 'High':
            analysisText += "<span style='display: inline-block;'>🔴 Urgently review and fortify your security practices.</span>";
            break;
        default:
            analysisText += "<span style='display: inline-block;'>🔵 Regularly assess and update your security settings.</span>";
    }
    analysisText += "</p></div>";
    return analysisText;
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

const emailHeader = (category, prefixHtml = '') => `<div align="center" class="alert alert-primary"><strong>${prefixHtml}${escapeHtml(category)} For Email: ${escapeHtml(email)}</strong></div></p>`;

$("#email").html(emailHeader("Data Breaches Quick Information"));
$("#email_sensitive").html(emailHeader('🔥 Sensitive Data Breaches Summary', '<span class="help-icon" data-toggle="tooltip" data-placement="auto" title="Breaches that cannot be publicly searched considering the sensitivity of the data exposed.">?</span>&nbsp;&nbsp; '));
$("#data").html(emailHeader("Your Exposed Data Sorted by Categories"));


$("#db-sensitive").show();
$("#sensitive-data-table").hide();
document.getElementById("db-sensitive").className = "alert alert-info";
$("#db-sensitive").html(`
    <em class="fas fa-lock"></em>
    <strong>🔥 Sensitive Data Breaches Require Verification 🔥</strong>
    <p style="font-size:16px; margin-top:10px;">
        To view sensitive data breaches that may contain more critical information, 
        please verify your email address. This extra step helps protect sensitive data 
        from unauthorized access.
    </p>
    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal">
        <em class="fas fa-envelope"></em> Verify Email Now
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
        <em class="fas fa-lock"></em>
        <strong>🔥 Sensitive Data Breaches Require Verification 🔥</strong>
        <p style="font-size:16px; margin-top:10px;">
            To view sensitive data breaches that may contain more critical information, 
            please verify your email address. This extra step helps protect sensitive data 
            from unauthorized access.
        </p>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal">
            <em class="fas fa-envelope"></em> Verify Email Now
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
                        <em class="fas fa-check-circle"></em>
                        <strong>🔥 Your email is not found in any sensitive data breaches loaded in XposedOrNot</strong>
                        <p style="color:green;font-size:20px"></p>
                        <h3><strong>Good news 🎉</strong></h3>
                    `);
                } else {
                    $("#db-sensitive").hide();
                    $("#sensitive-data-table").show();
                    let tableRowsHtml = "";
                    for (var i = 0; i < sensitiveBreaches.length; i++) {
                        tableRowsHtml += '<tr>' +
                            '<td style="text-align: center;"><span style="color:#FF4500;">🔥</span> ' + sensitiveBreaches[i].breach + '<br>' +
                            '<img src="' + sensitiveBreaches[i].logo + '" alt="Logo" style="width: 50px; height: 50px;">' +
                            '</td>' +
                            '<td><div class="text">' + sensitiveBreaches[i].details + '</div>' +
                            '<a href="#" class="see-more">See More</a></td>' +
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
                    <em class="fas fa-check-circle"></em>
                    <strong>🔥 Your email is not found in any sensitive data breaches loaded in XposedOrNot</strong>
                    <p style="color:green;font-size:20px"></p>
                    <h3><strong>Good news 🎉</strong></h3>
                `);
            }
        } else if (jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.sensitive_breaches_details &&
            jsonResponse.ExposedBreaches.sensitive_breaches_details.length > 0) {

            $("#db-sensitive").show();
            $("#sensitive-data-table").hide();
            document.getElementById("db-sensitive").className = "alert alert-info";
            $("#db-sensitive").html(`
                
                <strong>🔥 Sensitive Data Breaches Require Verification 🔥</strong>
                <p style="font-size:16px; margin-top:10px;">
                    To view sensitive data breaches that may contain more critical information, 
                    please verify your email address. This extra step helps protect sensitive data 
                    from unauthorized access.
                </p>
                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertMeModal">
                    <em class="fas fa-envelope"></em> Verify Email Now
                </button>
            `);
        }


        breachesDetailsHtml = ''
        breachesSite = '', xposedData = '', riskScore = '', riskLabel = '';
        let passwordScore = 0;
        const passwordsCounts = [];
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

            // Responsive options based on screen size
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

            // Apply text color styles after chart is drawn
            const applyTextColor = function() {
                const isDarkMode = document.body.classList.contains('dark-mode') ||
                                  document.documentElement.getAttribute('data-theme') === 'dark';
                const chartDiv = document.getElementById('chart_div');
                if (chartDiv) {
                    // Target all text elements in the SVG including the number value
                    const textElements = chartDiv.querySelectorAll('svg text');
                    textElements.forEach(text => {
                        text.setAttribute('fill', isDarkMode ? '#ffffff' : '#000000');
                        text.style.fill = isDarkMode ? '#ffffff' : '#000000';
                        text.style.fontWeight = '600';
                    });
                }
            };

            // Draw chart once with the actual risk score
            chart.draw(data, options);

            // Apply text color after initial draw
            setTimeout(applyTextColor, 150);

            // Redraw on window resize
            window.addEventListener('resize', function () {
                const isMobile = window.innerWidth <= 767;
                options.width = isMobile ? 300 : 500;
                options.height = isMobile ? 200 : 300;
                chart.draw(data, options);
                setTimeout(applyTextColor, 150);
            });

            // Watch for dark mode changes and update text color
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
                        setTimeout(applyTextColor, 50);
                    }
                });
            });

            // Observe body class changes (for .dark-mode class)
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });

            // Observe documentElement data-theme changes
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

        const riskScoreHtml = `<div align="center" class="alert alert-${alertType}">&nbsp;Your Risk Score :  <strong>${riskLabel}</strong>&nbsp;&nbsp;<span class="help-icon" data-toggle="tooltip" data-placement="auto" title="Calculated based on the number and severity of data breaches, the time since the last breach, and the strength of the exposed password. Please read FAQ for more details on this. ">?</span></div>`;
        $('#risk').html(riskScoreHtml);

        if (xposedData.toString().length > 0) {
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
                    background-color: #ff7675;
                    color: white;
                }
                .badge-medium {
                    background-color: #fdcb6e;
                    color: #2d3436;
                }
                .badge-low {
                    background-color: #00b894;
                    color: white;
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
                            <i class="fab fa-github fa-3x"></i>
                        </div>
                        <h4 class="mb-3">Join Our Open Source Community! 🚀</h4>
                        <p class="mb-4">
                            Help us make the internet safer by contributing to XposedOrNot. 
                            Your ideas & contributions can make a difference!
                        </p>
                        <div class="github-stats mb-3">
                            <div class="row justify-content-center">
                                <div class="col-auto px-3">
                                    <div class="stat-item">
                                        <i class="fas fa-code-branch"></i>
                                        <span>Open Source</span>
                                    </div>
                                </div>
                                <div class="col-auto px-3">
                                    <div class="stat-item">
                                        <i class="fas fa-users"></i>
                                        <span>Community</span>
                                    </div>
                                </div>
                                <div class="col-auto px-3">
                                    <div class="stat-item">
                                        <i class="fas fa-shield-alt"></i>
                                        <span>Security</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a href="https://github.com/xposedornot" target="_blank" class="btn btn-github">
                            <i class="fab fa-github mr-2"></i> Visit our GitHub
                        </a>
                    </div>
                </div>
            `;

            $('.xon-row2-right .text-center').html(githubSection);

            breachesDetailsHtml = ''
            if (jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.breaches_details) {
                let breachesTable = "";
                const regularBreaches = jsonResponse.ExposedBreaches.breaches_details;
                for (var i = 0; i < regularBreaches.length; i++) {
                    breachesTable += '<tr>' +
                        '<td style="text-align: center;">' + regularBreaches[i].breach + '<br>' +
                        '<img src="' + regularBreaches[i].logo + '" alt="Logo" style="width: 50px; height: 50px;">' +
                        '</td>' +
                        '<td><div class="text">' + regularBreaches[i].details + '</div>' +
                        '<a href="#" class="see-more">See More</a></td>' +
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
                // Add regular breaches to counts array
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

            var top5chart = new Chart(top5, {
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
                    cutoutPercentage: 65,
                    layout: {
                        padding: {
                            top: 20,
                            right: 20,
                            bottom: 40,
                            left: 20
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            fontColor: document.body.classList.contains('dark-mode') ? '#FFFFFF' : '#666666',
                            fontSize: 12,
                            fontStyle: 'bold',
                            usePointStyle: true,
                            boxWidth: 10
                        }
                    },
                    tooltips: {
                        enabled: true,
                        mode: 'index',
                        callbacks: {
                            label: function (tooltipItem, data) {
                                var dataset = data.datasets[tooltipItem.datasetIndex];
                                var total = dataset.data.reduce((acc, curr) => acc + curr, 0);
                                var currentValue = dataset.data[tooltipItem.index];
                                var percentage = ((currentValue / total) * 100).toFixed(1);
                                return data.labels[tooltipItem.index] + ': ' + currentValue.toLocaleString() + ' (' + percentage + '%)';
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 2000,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        datalabels: {
                            color: document.body.classList.contains('dark-mode') ? '#FFFFFF' : '#666666',
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
                    }
                }
            });

            var passwords = document.getElementById('passwords');

            passwords.parentElement.style.height = '400px';

            var passwordschart = new Chart(passwords, {
                type: 'doughnut',
                data: {
                    labels: ['Plain Text Password', 'Easily Crackable', 'Strong Hashes', 'Unknown'],
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
                    cutoutPercentage: 65,
                    layout: {
                        padding: {
                            top: 20,
                            right: 20,
                            bottom: 40,
                            left: 20
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            fontColor: document.body.classList.contains('dark-mode') ? '#FFFFFF' : '#666666',
                            fontSize: 12,
                            fontStyle: 'bold',
                            usePointStyle: true,
                            boxWidth: 10
                        }
                    },
                    tooltips: {
                        enabled: true,
                        mode: 'index',
                        callbacks: {
                            label: function (tooltipItem, data) {
                                var dataset = data.datasets[tooltipItem.datasetIndex];
                                var total = dataset.data.reduce((acc, curr) => acc + curr, 0);
                                var currentValue = dataset.data[tooltipItem.index];
                                var percentage = ((currentValue / total) * 100).toFixed(1);
                                return data.labels[tooltipItem.index] + ': ' + currentValue.toLocaleString() + ' (' + percentage + '%)';
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 2000,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        datalabels: {
                            color: document.body.classList.contains('dark-mode') ? '#FFFFFF' : '#666666',
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
                    }
                }
            });
            $("#data_breach").append(nn);
            $("#details").append(breachesDetailsHtml);
        }

        g1();
    })
    .fail(function (response) {
        if (response.status === 404) {
            $.LoadingOverlay("hide");
            document.getElementById("db-s").className = "visible alert alert-success";
            $("#db-s").show();
            g1()
        } else if (response.status === 429) {
            $.LoadingOverlay("hide");
            document.getElementById("db-s").className = "visible alert alert-danger";
            $("#db-s").html("<b>Please Slow down.</b><br>Looks like your going too fast, please try again after some time.");
            $("#db-s").show();
        }
    })

Chart.defaults.global.defaultFontColor = 'white';
var color = Chart.helpers.color;
var barChartData1 = {
    labels: ['Plain Text Password', 'Easily Crackable', 'Strong Hashes'],
    datasets: [{
        label: 'Exposed Passwords Risk Profile',
        backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
        borderColor: window.chartColors.blue,
        borderWidth: 1,
        data: [
            plaintext,
            easy,
            hard
        ],
        backgroundColor: [
            'rgba(255, 0, 0, 0.7)',
            'rgba(255, 165, 0, 0.7)',
            'rgba(0,255,0, 0.7)'
        ],
        borderColor: [
            'rgba(255,99,132,1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)'
        ],
    }]

};

function g1() {

    const isDarkMode = document.body.classList.contains('dark-mode');

    const chartLabels = ['2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

    var config = {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Breaches Count',
                fill: false,
                backgroundColor: window.chartColors.red,
                borderColor: window.chartColors.red,
                data: [by07, by08, by09, by10, by11, by12, by13, by14, by15, by16, by17, by18, by19, by20, by21, by22, by23, by24, by25],
            }]
        },
        options: {
            responsive: true,
            defaultFontColor: isDarkMode ? '#FFFFFF' : '#666666',
            legend: {
                position: 'bottom',
                labels: {
                    fontColor: isDarkMode ? '#FFFFFF' : '#666666',
                    fontSize: 12,
                    fontStyle: 'bold'
                }
            },
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        precision: 0,
                        fontColor: isDarkMode ? '#FFFFFF' : '#666666',
                        fontSize: 12,
                        fontStyle: 'bold'
                    },
                    gridLines: {
                        display: false,
                        color: '#e0e0e0',
                        drawOnChartArea: false,
                        drawBorder: true,
                        zeroLineColor: isDarkMode ? '#FFFFFF' : '#666666'
                    },
                    scaleLabel: {
                        display: true,
                        fontColor: isDarkMode ? '#FFFFFF' : '#666666',
                        fontSize: 12,
                        fontStyle: 'bold'
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        precision: 0,
                        fontColor: isDarkMode ? '#FFFFFF' : '#666666',
                        fontSize: 12,
                        fontStyle: 'bold'
                    },
                    gridLines: {
                        display: isDarkMode ? false : true,
                        color: '#e0e0e0',
                        drawOnChartArea: isDarkMode ? false : true,
                        drawBorder: true,
                        zeroLineColor: isDarkMode ? '#FFFFFF' : '#666666'
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Count of Data Breaches',
                        fontColor: isDarkMode ? '#FFFFFF' : '#666666',
                        fontSize: 12,
                        fontStyle: 'bold'
                    }
                }]
            }
        }
    };

    var ctx = document.getElementById('bc').getContext('2d');
    window.myLine = new Chart(ctx, config);
}

$(window).on("load", function () {
    //  $.LoadingOverlay("hide");
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
        if (isValid) {
            $(this).css("border", "2px solid green");
            $('#alertMe').prop('disabled', false);
        } else {
            $(this).css("border", "2px solid red");
            $('#alertMe').prop('disabled', true);
        }
    });
    $("#alertMe").click(function (event) {
        event.preventDefault();
        var inputValue = document.getElementById("recipient-name").value.toLowerCase();
        var apiUrl = 'https://api.xposedornot.com/v1/alertme/' + encodeURIComponent(inputValue);

        var successMessage = "Successfully added to the alert service. Please check your email and click on the verification link to confirm";
        var alreadySubscribedMessage = "We thank you for your interest. However our records indicate you are already added to the AlertMe Service.";

        $.ajax(apiUrl)
            .done(function () {
                $('#message-text').val(successMessage);
                document.getElementById("h2head").className = "modal-header-success";
                $("#alertMe").hide();
                $("#alertMeClose").show();
            })
            .fail(function () {
                $('#message-text').val(alreadySubscribedMessage);
                document.getElementById("h2head").className = "modal-header-success";
                $("#alertMe").hide();
                $("#alertMeClose").show();
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
var topPos = 100;
floatingButton.style.position = 'fixed';
floatingButton.style.top = '10px';
floatingButton.style.right = '20px';

document.addEventListener('scroll', function () {
    var y = window.pageYOffset;
    if (y > 0) {
        floatingButton.style.position = 'fixed';
        floatingButton.style.top = '10px';
        floatingButton.style.right = '20px';
    } else {
        floatingButton.style.position = 'absolute';
        floatingButton.style.top = topPos + 'px';
        floatingButton.style.right = '20px';
    }
});

var analyticsApiUrl = `https://api.xposedornot.com/v1/analytics/${encodeURIComponent(email)}`;

$.get(analyticsApiUrl, function (response) {

    const dataForTree = [{
        description: response.description,
        children: response.children.filter(year => year.children && year.children.length > 0)
    }];

    $('#tree-container').hortree({
        data: dataForTree
    });
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
                background-color: #ff7675;
                color: white;
            }
            .badge-medium {
                background-color: #fdcb6e;
                color: #2d3436;
            }
            .badge-low {
                background-color: #00b894;
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
                background-color: #38a169;
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
            /* Responsive styles for mobile view */
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
                        <h5>${categoryName} (${totalItems} items)</h5>
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

        if ($this.text() == 'See More') {
            $text.css({
                'overflow': 'visible',
                'display': 'block',
                '-webkit-line-clamp': 'unset',
                '-webkit-box-orient': 'unset'
            });
            $this.text('See Less');
        } else {
            $text.css({
                'overflow': 'hidden',
                'display': '-webkit-box',
                '-webkit-line-clamp': '3',
                '-webkit-box-orient': 'vertical'
            });
            $this.text('See More');
        }
    });
});

$(document).ajaxStart(function () {
    $.LoadingOverlay("show");
}).ajaxStop(function () {
    $.LoadingOverlay("hide");
});

function generateBreachDetailHtml(breach, isSensitive) {
    let html = "<div>   <b><span class='notser'>" + breach.xposed_date + "</span></b><br><br>   <div class='row'>      <div class='col-sm-4'> <img height=75 width=100 src='";
    html += breach.logo + "'>    </div>      <div class='col-sm-4'>         <h3><strong><font>  <a  href='breach.html#" + breach.breach + "' target='_blank'>";
    html += breach.breach + "</font></strong></h3>         </a>      </div>      <div class='col-sm-4'>         <img height=75 width=75 src='";
    html += 'static/logos/industry/' + breach.industry + ".png' title='";
    html += breach.industry + ' Industry';
    html += "'>  <figcaption>Industry: ";
    html += breach.industry + "</figcaption></div></div><br><p><div align='center'><table width=85% class='table-striped table-bordered table-hover' style='font-size:16px'><tr><td>Number of Records Exposed</td><td>";
    html += parseInt(breach.xposed_records).toLocaleString();
    html += "</td></tr><tr><td table width=30%>Data Types Exposed<td>";
    html += breach.xposed_data.replace(/;/g, ', ');
    html += " </td></tr><tr><td>Password/Hash Status</td><td>";
    html += breach.password_risk;
    html += "</td></tr><tr><td>Affected Domain</td><td> ";
    html += breach.domain;
    html += "</td></tr></table><p style='font-size:22px;'>";
    html += breach.details;
    html += "</p></div><br><br><b><u>Reference link(s):</u></b><br><a target='_blank' href='" + encodeURI(breach.references) + "'> " + breach.references + "</a></p>";
    html += "<span class='ver'>Searchable</span>";
    if (breach.verified === "Yes") {
        html += "<span class='ver'>Verified</span>";
    } else {
        html += "<span class='notver'>Untrusted</span>";
    }
    html += isSensitive ? "<span class='notser'>Sensitive Data Breach</span>" : "<span class='notser'>Data Breach</span>";
    html += "</div><hr>";
    return html;
}
