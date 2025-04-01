$.LoadingOverlaySetup({
    background: "rgba(0, 0, 0, 0.5)",
    image: "/static/images/shield-alt.svg",
    imageAnimation: "1s fadein",
    imageColor: "#6daae0"
});

$.LoadingOverlay("show");


$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results[1] || 0;
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}




function generateRiskAnalysis(riskLabel, jsonResponse) {
    let analysisText = "<div align='left' class='alert alert-info'>";
    const breachesDetails = jsonResponse.ExposedBreaches.breaches_details;
    const xposedData = jsonResponse.BreachMetrics.xposed_data[0].children;


    const categoryColor = "#407f7f"; // Muted Teal
    const actionTextColor = "#355035"; // Deep Green


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
        analysisText += `<li><span style='color: ${categoryColor};'><strong>Compromised Passwords (${plaintextBreaches.length + easyToCrackBreaches.length} Breaches):</strong></span><ul>`;
        if (plaintextBreaches.length > 0) {
            analysisText += `<li>Breaches with plain text passwords: ${plaintextBreaches.join(', ')}.</li>`;
        }
        if (easyToCrackBreaches.length > 0) {
            analysisText += `<li>Breaches with easy-to-crack passwords: ${easyToCrackBreaches.join(', ')}.</li>`;
        }
        analysisText += `<li style='color: ${actionTextColor};'><strong>Recommended Action:</strong> If your email is linked to any of these breaches, immediately change your passwords. Use strong, unique passwords for each account.</li></ul></li><br>`;
    }


    if (piiBreachesCount > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>Personal Information Exposure (${piiBreachesCount} Occurrences):</strong></span> Your personal details might be exposed.<br><strong style='color: ${actionTextColor};'>Recommended Action:</strong> Monitor for unusual activities that could indicate identity theft or fraud.</li><br>`;
    }


    if (emailBreachesCount > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>Email Addresses and Phishing Risks (${emailBreachesCount} Occurrences):</strong></span> Your email address might be used in phishing attempts.<br><strong style='color: ${actionTextColor};'>Recommended Action:</strong> Be cautious with emails from unknown sources and avoid clicking on suspicious links.</li><br>`;
    }


    if (communicationBreachesCount > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>Communication and Social Interactions (${communicationBreachesCount} Occurrences):</strong></span> Your communication details may be at risk.<br><strong style='color: ${actionTextColor};'>Recommended Action:</strong> Be cautious with your online interactions and consider updating privacy settings on social platforms.</li><br>`;
    }


    if (demographicsBreachesCount > 0) {
        analysisText += `<li><span style='color: ${categoryColor};'><strong>Demographics (${demographicsBreachesCount} Occurrences):</strong></span> Sensitive demographic information might be exposed.<br><strong style='color: ${actionTextColor};'>Recommended Action:</strong> Review and secure any accounts that may contain detailed personal information to prevent identity theft.</li><br>`;
    }

    analysisText += "</ol>";


    analysisText += `<p><strong>Your Risk Score:</strong> <span class='alert alert-${getAlertType(riskLabel)}' style='padding: 2px 8px; display: inline-block; margin: 0;'><strong>${riskLabel}</strong></span><br><br><strong>Our Recommendations:</strong><br>`;
    switch (riskLabel) {
        case 'Low':
            analysisText += "🟢 Stay vigilant and proactive in securing your data.";
            break;
        case 'Medium':
            analysisText += "🟠 Enhance your security measures and remain alert.";
            break;
        case 'High':
            analysisText += "🔴 Urgently review and fortify your security practices.";
            break;
        default:
            analysisText += "🔵 Regularly assess and update your security settings.";
    }
    analysisText += "</p></div>";
    return analysisText;
}

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




by25 = by24 = by23 = by22 = by21 = by20 = by19 = by18 = by17 = by16 = by15 = by14 = by13 = by12 = by11 = by10 = by09 = by08 = by07 = 0;
py25 = py24 = py23 = py22 = py21 = py20 = py19 = py18 = py17 = py16 = py15 = py14 = py13 = py12 = py11 = py10 = py09 = py08 = py07 = 0;
i11 = i12 = i13 = i14 = i15 = i16 = i17 = i18 = i19 = i20 = i1 = i2 = i3 = i4 = i5 = i6 = i7 = i8 = i9 = i10 = i20 = i21 = i22 = i23 = i24 = i25 = i26 = 0;
unknown = plaintext = easy = hard = password_score = 0;


let email;
try {
    email = decodeURIComponent($.urlParam('email'));
} catch (error) {
    window.location.replace("https://xposedornot.com");
}

const emailHeader = (category) => `<div align="center" class="alert alert-primary"><strong>${category} For Email: ${email}</strong></div></p>`;

$("#email").html(emailHeader("Data Breaches Quick Information"));
$("#email_sensitive").html(emailHeader('<span class="help-icon" data-toggle="tooltip" data-placement="auto" title="Breaches that cannot be publicly searched considering the sensitivity of the data exposed.">?</span>&nbsp;&nbsp; Sensitive Data Breaches Summary'));
$("#paste").html(emailHeader("Exposed Pastes Summary"));
$("#data").html(emailHeader("Your Exposed Data Sorted by Categories"));

//const url = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;
const url = `https://xon-api-test.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;

let jsonResponse;

var j = $.ajax(url)
    .done(function (response) {
        jsonResponse = response;
        breachesDetailsHtml = ''
        numPastes = '', breachesSite = '', xposedData = '', riskScore = '', riskLabel = '';
        let passwordScore = 0;
        const passwordsCounts = [];
        numPastes = jsonResponse.PastesSummary.cnt;
        breachesSite = jsonResponse.BreachesSummary.site;
        xposedData = jsonResponse.BreachMetrics.xposed_data[0]
        riskScore = jsonResponse.BreachMetrics.risk[0].risk_score
        riskLabel = jsonResponse.BreachMetrics.risk[0].risk_label

        const riskAnalysisHtml = generateRiskAnalysis(riskLabel, jsonResponse);
        $('#risk-analysis').html(riskAnalysisHtml);

        drawChart_categories(xposedData)
        google.charts.load('current', {
            'packages': ['gauge']
        });
        google.charts.setOnLoadCallback(drawChart);

        function drawChart() {
            var data = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['Risk Score', 0]
            ]);

            var options = {
                width: 500,
                height: 300,
                greenFrom: 0,
                greenTo: 40,
                yellowFrom: 41,
                yellowTo: 100,
                redFrom: 101,
                redTo: 200,
                minorTicks: 10,
                max: 200
            };

            var chart = new google.visualization.Gauge(document.getElementById('chart_div'));

            chart.draw(data, options);
            setInterval(function () {
                data.setValue(0, 1, Math.round(riskScore))
                chart.draw(data, options);
            }, 1000);
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

            industries = jsonResponse.BreachMetrics.industry[0]

            for (var i = 0; i < 19; i++) {
                var ind_split = industries[i];
                var categoryName = ind_split[0];
                var categoryCount = ind_split[1];

                switch (categoryName) {
                    case "aero":
                        i1 = categoryCount;
                        break;
                    case "tran":
                        i2 = categoryCount;
                        break;
                    case "info":
                        i3 = categoryCount;
                        break;
                    case "tele":
                        i4 = categoryCount;
                        break;
                    case "agri":
                        i5 = categoryCount;
                        break;
                    case "cons":
                        i6 = categoryCount;
                        break;
                    case "educ":
                        i7 = categoryCount;
                        break;
                    case "phar":
                        i8 = categoryCount;
                        break;
                    case "food":
                        i9 = categoryCount;
                        break;
                    case "heal":
                        i10 = categoryCount;
                        break;
                    case "hosp":
                        i11 = categoryCount;
                        break;
                    case "ente":
                        i12 = categoryCount;
                        break;
                    case "news":
                        i13 = categoryCount;
                        break;
                    case "ener":
                        i14 = categoryCount;
                        break;
                    case "manu":
                        i15 = categoryCount;
                        break;
                    case "musi":
                        i16 = categoryCount;
                        break;
                    case "mini":
                        i17 = categoryCount;
                        break;
                    case "elec":
                        i18 = categoryCount;
                        break;
                    case "misc":
                        i19 = categoryCount;
                        break;
                    case "fina":
                        i20 = categoryCount;
                        break;
                    case "reta":
                        i21 = categoryCount;
                        break;
                    case "nonp":
                        i22 = categoryCount;
                        break;
                    case "govt":
                        i23 = categoryCount;
                        break;
                    case "spor":
                        i24 = categoryCount;
                        break;
                    case "envi":
                        i25 = categoryCount;
                        break;

                }
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
        },
        ];

        counts.sort((a, b) => b.cnt - a.cnt);
        let industryList = `
            <div class="industry-list">
                <div class="row">
                    ${counts.filter(item => item.cnt > 0).map(item => `
                        <div class="col-md-6 mb-2">
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
        `;
        document.head.appendChild(style);


        function getBadgeClass(count) {
            if (count > 10) return 'high';
            if (count > 5) return 'medium';
            return 'low';
        }

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
                        Whether you're a developer, designer, or security enthusiast, 
                        your ideas can make a difference!
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
                                    <span>Community Driven</span>
                                </div>
                            </div>
                            <div class="col-auto px-3">
                                <div class="stat-item">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>Security Focused</span>
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

        pasteDetailsTable = ""
        if (numPastes == 0) {
            $("#db-p").show();
            document.getElementById("db-p").className = "visible alert alert-success";
        } else {
            if (numPastes.toString().length > 0) {
                py23 = jsonResponse.PasteMetrics.yearwise_details[0].y2023;
                py22 = jsonResponse.PasteMetrics.yearwise_details[0].y2022;
                py21 = jsonResponse.PasteMetrics.yearwise_details[0].y2021;
                py20 = jsonResponse.PasteMetrics.yearwise_details[0].y2020;
                py19 = jsonResponse.PasteMetrics.yearwise_details[0].y2019;
                py18 = jsonResponse.PasteMetrics.yearwise_details[0].y2018;
                py17 = jsonResponse.PasteMetrics.yearwise_details[0].y2017;
                py16 = jsonResponse.PasteMetrics.yearwise_details[0].y2016;
                py15 = jsonResponse.PasteMetrics.yearwise_details[0].y2015;
                py14 = jsonResponse.PasteMetrics.yearwise_details[0].y2014;
                py13 = jsonResponse.PasteMetrics.yearwise_details[0].y2013;
                py12 = jsonResponse.PasteMetrics.yearwise_details[0].y2012;
                py11 = jsonResponse.PasteMetrics.yearwise_details[0].y2011;
                py10 = jsonResponse.PasteMetrics.yearwise_details[0].y2010;
                py09 = jsonResponse.PasteMetrics.yearwise_details[0].y2009;
                py08 = jsonResponse.PasteMetrics.yearwise_details[0].y2008;
                py07 = jsonResponse.PasteMetrics.yearwise_details[0].y2007;
            }
            let pastesDetails = jsonResponse.ExposedPastes.pastes_details;
            for (let i = 0; i < pastesDetails.length; i++) {
                pasteDetailsTable += `<tr><td>${pastesDetails[i].pasteId}</td><td>${pastesDetails[i].xposed_date}</td><td>${pastesDetails[i].xposed_records}</td></tr>`;
            }

        }
        $("#paste_breach").append(pasteDetailsTable);

        pasteDetailsTable = ""
        nn = ""
        if (xposedData.toString().length <= 0) {
            document.getElementById("db-s").className = "visible alert alert-success";
            $("#db-s").show();
        } else {
            breachesCountsArray = []
            exposedBreachesDetails = jsonResponse.ExposedBreaches.breaches_details;
            if (exposedBreachesDetails.length > 0) {
                for (var i = 0; i < exposedBreachesDetails.length; i++) {
                    ia = i + 1;
                    breaches_id = exposedBreachesDetails[i].breach;
                    breaches_cnt = exposedBreachesDetails[i].xposed_records;
                    breaches_dt = exposedBreachesDetails[i].details
                    breaches_domain = exposedBreachesDetails[i].domain
                    breaches_industry = exposedBreachesDetails[i].industry
                    breaches_logo = exposedBreachesDetails[i].logo
                    breaches_xposed_data = exposedBreachesDetails[i].xposed_data
                    breaches_password_risk = exposedBreachesDetails[i].password_risk
                    breaches_searchable = exposedBreachesDetails[i].searchable
                    breaches_verified = exposedBreachesDetails[i].verified
                    breaches_xposed_date = exposedBreachesDetails[i].xposed_date
                    breaches_references = exposedBreachesDetails[i].references
                    nn += '<tr><td> ' + breaches_id + '</td><td><div class="text">' + breaches_dt + '</div><a href="#" class="see-more">See More</a></td><td>' + parseInt(breaches_cnt).toLocaleString() + '</td></tr>';
                    breachesCountsArray.push({
                        'breach': breaches_id,
                        'cnt': breaches_cnt
                    })

                    breachesDetailsHtml += "<div>   <b><span class='notser'>" + breaches_xposed_date + "</span></b><br><br>   <div class='row'>      <div class='col-sm-4'> <img height=75 width=100 src='";
                    breachesDetailsHtml += breaches_logo + "'>    </div>      <div class='col-sm-4'>         <h3><strong><font>  <a  href='xposed.html#" + breaches_id + "' target='_blank'>";
                    breachesDetailsHtml += breaches_id + "</font></strong></h3>         </a>      </div>      <div class='col-sm-4'>         <img height=75 width=75 src='";
                    breachesDetailsHtml += 'static/logos/industry/' + breaches_industry + ".png' title='";
                    breachesDetailsHtml += breaches_industry + ' Industry';
                    breachesDetailsHtml += "'>  <figcaption>Industry: ";
                    breachesDetailsHtml += breaches_industry + "</figcaption></div></div><br><p><div align='center'><table width=85% class='table-striped table-bordered table-hover' style='font-size:16px'><tr><td>Number of Records Exposed</td><td>";
                    breachesDetailsHtml += parseInt(breaches_cnt).toLocaleString();
                    breachesDetailsHtml += "</td></tr><tr><td table width=30%>Data Types Exposed<td>";
                    breachesDetailsHtml += breaches_xposed_data.replace(/;/g, ', ');
                    breachesDetailsHtml += " </td></tr><tr><td>Password/Hash Status</td><td>";
                    breachesDetailsHtml += breaches_password_risk;
                    breachesDetailsHtml += "</td></tr><tr><td>Affected Domain</td><td> ";
                    breachesDetailsHtml += breaches_domain;
                    breachesDetailsHtml += "</td></tr></table><p style='font-size:22px;'>";
                    breachesDetailsHtml += breaches_dt;
                    breachesDetailsHtml += "</p></div><br><br><b><u>Reference link(s):</u></b><br><a target='_blank' href='" + encodeURI(breaches_references) + "'> " + breaches_references + "</a></p>";
                    breachesDetailsHtml += "<span class='ver'>Searchable</span>";
                    if (breaches_verified === "Yes") {
                        breachesDetailsHtml += "<span class='ver'>Verified</span>";
                    } else {
                        breachesDetailsHtml += "<span class='notver'>Untrusted</span>";
                    }
                    breachesDetailsHtml += "<span class='notser'>Data Breach</span></div><hr>";

                }
            }

            breachesCountsArray.sort(function (cnt1, cnt2) {
                if (cnt1.cnts > cnt2.cnts) return -1;
                if (cnt1.cnts < cnt2.cnts) return 1;
                return 0;
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

            // Set canvas container height
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
            $("#data_breach_sensitive").append(nn);
            $("#details").append(breachesDetailsHtml);
        }

        g1();
    })
    .fail(function (response) {
        if (response.status === 404) {
            $.LoadingOverlay("hide");
            document.getElementById("db-s").className = "visible alert alert-success";
            document.getElementById("db-p").className = "visible alert alert-success";
            $("#db-s").show();
            $("#db-p").show();
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
        //var apiUrl = 'https://api.xposedornot.com/v1/alertme/' + encodeURIComponent(inputValue);
        var apiUrl = 'https://xon-api-test.xposedornot.com/v1/alertme/' + encodeURIComponent(inputValue);

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

//var apiUrl = `https://api.xposedornot.com/v1/analytics/${encodeURIComponent(email)}`;
var apiUrl = `https://xon-api-test.xposedornot.com/v1/analytics/${encodeURIComponent(email)}`;

$.get(apiUrl, function (response) {

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
        agent.animate();
        agent.animate();
        agent.speak('Want to check if your passwords are secure? Head over to the "Password" page - I\'ll help you strengthen your digital armor! 💪');
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
    // First add the styles if they don't exist
    if (!document.getElementById('category-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'category-styles';
        styleElement.textContent = `
            .category-list {
                padding: 15px;
            }
            .category-group {
                background-color: var(--card-bg);
                border-radius: 12px;
                margin-bottom: 15px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: all 0.3s ease;
                border: 1px solid var(--border-color);
            }
            .category-group:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                cursor: pointer;
                background-color: var(--card-bg);
                border-bottom: 1px solid var(--border-color);
            }
            .category-header:hover {
                background-color: var(--hover-bg);
            }
            .category-name {
                font-weight: 600;
                font-size: 1.1em;
                color: var(--text-color);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .category-total {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 0.9em;
            }
            .badge-high {
                background-color: var(--danger-color);
                color: white;
            }
            .badge-medium {
                background-color: var(--warning-color);
                color: var(--text-color);
            }
            .badge-low {
                background-color: var(--success-color);
                color: white;
            }
            .subcategories {
                padding: 0;
                margin: 0;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-out;
            }
            .subcategories.expanded {
                max-height: 1000px;
            }
            .subcategory-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px 12px 40px;
                border-bottom: 1px solid var(--border-color);
                background-color: var(--card-bg);
            }
            .subcategory-item:last-child {
                border-bottom: none;
            }
            .subcategory-name {
                color: var(--text-color);
                font-size: 0.95em;
            }
            .subcategory-count {
                font-size: 0.9em;
                color: var(--text-muted);
            }
            .toggle-icon {
                transition: transform 0.3s ease;
                color: var(--text-color);
            }
            .toggle-icon.expanded {
                transform: rotate(180deg);
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Handle the categories list
    try {
        const categoriesList = document.getElementById('categories-list');
        if (categoriesList && xposedData && xposedData.children) {
            let categoryGroups = [];

            // Process each category and its subcategories
            xposedData.children.forEach(category => {
                let subcategories = [];
                let total = 0;

                if (category.children && Array.isArray(category.children)) {
                    category.children.forEach(subcategory => {
                        const count = parseInt(subcategory.value || 0);
                        if (count > 0) {
                            subcategories.push({
                                name: subcategory.name.replace('data_', ''),
                                count: count
                            });
                            total += count;
                        }
                    });
                }

                if (total > 0) {
                    categoryGroups.push({
                        name: category.name,
                        total: total,
                        subcategories: subcategories.sort((a, b) => b.count - a.count)
                    });
                }
            });

            // Sort categories by total count
            categoryGroups.sort((a, b) => b.total - a.total);

            // Generate HTML
            if (categoryGroups.length > 0) {
                let categoriesHTML = `
                    <div class="category-list">
                        ${categoryGroups.map(group => `
                            <div class="category-group">
                                <div class="category-header">
                                    <div class="category-name">
                                        <span class="toggle-icon">▼</span>
                                        ${group.name}
                                    </div>
                                    <div class="category-total">
                                        <span class="badge badge-${getCategoryBadgeClass(group.total)}">${group.total.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div class="subcategories">
                                    ${group.subcategories.map(sub => `
                                        <div class="subcategory-item">
                                            <span class="subcategory-name">${sub.name}</span>
                                            <span class="subcategory-count">${sub.count.toLocaleString()}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                categoriesList.innerHTML = categoriesHTML;

                // Add click handlers for expand/collapse
                document.querySelectorAll('.category-header').forEach(header => {
                    header.addEventListener('click', () => {
                        const subcategories = header.nextElementSibling;
                        const toggleIcon = header.querySelector('.toggle-icon');
                        subcategories.classList.toggle('expanded');
                        toggleIcon.classList.toggle('expanded');
                    });
                });
            } else {
                categoriesList.innerHTML = '<div class="alert alert-info">No category data available</div>';
            }
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
