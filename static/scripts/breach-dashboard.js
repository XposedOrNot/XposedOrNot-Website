$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results[1] || 0;
}

try {
    email = decodeURIComponent($.urlParam('email'));
    token = decodeURIComponent($.urlParam('token'));
} catch (e) {
    window.location.replace("https://xposedornot.com");
}

$.LoadingOverlaySetup({
    background: "rgba(0, 0, 0, 0.5)",
    image: "static/images/shield-alt.svg",
    imageAnimation: "1s fadein",
    imageColor: "#6daae0"
});
$.LoadingOverlay("show");

$(document).ready(function () {
    $('.btn-lg.btn-primary').click(function () {
        var newUrl = 'api_key_management.html?email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token);
        window.location.href = newUrl;
    });
});

s = '<div align="center" class="alert alert-primary"><strong>Data Breaches Details For Verified Domains</strong></div></p>';
$("#email").html(s);
$("#email_details").html(s);

var emailVerificationUrl = 'https://api.xposedornot.com/v1/send_domain_breaches?email=' + encodeURIComponent(email) + "&token=" + encodeURIComponent(token);
var myjson;
$.ajax(emailVerificationUrl)
    .done(function (n) {
        myjson = n;

        if (myjson) {
            var domains = new Set();
            var exposedEmails = new Set();
            myjson.Breaches_Details.forEach(function (detail) {
                domains.add(detail.domain);
                exposedEmails.add(detail.email);
            });

            $('#exposed-domains').text(domains.size.toLocaleString());
            $('#exposed-emails').text(exposedEmails.size.toLocaleString());
        }

        const breachMetrics = myjson.Yearly_Metrics;
        if (breachMetrics) {
            const years = Object.keys(breachMetrics);
            const breachCounts = Object.values(breachMetrics);
            g1(years, breachCounts);
        }

        const topBreaches = myjson.Top10_Breaches;
        if (topBreaches) {
            const breachNames = Object.keys(topBreaches);
            const breachCounts = Object.values(topBreaches);
            buildTopBreachesTable(breachNames, breachCounts);
        }

        const breachesDetails = myjson.Detailed_Breach_Info;
        if (breachesDetails) {
            addBreachesToTable(breachesDetails);
        }

        const breachesSummary = myjson.Breaches_Details;
        if (breachesSummary) {
            addBreachesDetailsToTable(breachesSummary);
        }

        const yearlyBreachHierarchy = myjson.Yearly_Breach_Hierarchy;
        if (yearlyBreachHierarchy) {
            $('#tree-container').hortree({
                data: [yearlyBreachHierarchy]
            });
        }

        const domainSummary = myjson.Domain_Summary;
        if (domainSummary && typeof domainSummary === 'object') {
            addDomainSummaryToTable(domainSummary, email, token);
        }
        updateSenioritySummary(myjson.Seniority_Summary);

        $.LoadingOverlay("hide");
    })
    .fail(function (n) {
        if (n.status === 404) {
            $.LoadingOverlay("hide");
            document.getElementById("db-s").className = "visible alert alert-success";
            $("#db-s").show();
        } else if (n.status === 429) {
            $.LoadingOverlay("hide");
            document.getElementById("db-s").className = "visible alert alert-danger";
            $("#db-s").html("<b>Please Slow down.</b><br>Looks like your going too fast, please try again after some time.");
            $("#db-s").show();
        } else if (n.status === 400) {
            $.LoadingOverlay("hide");
            $("#db-s").html("<b>Please Slow down.</b><br>Looks like your not authenticated properly.");
            window.location.replace("http://xposedornot.com");
            $("#db-s").show();
        }
    });

// Function to update the Seniority Summary
function updateSenioritySummary(senioritySummary) {
    if (senioritySummary) {
        $('#exposed-cxo').text(senioritySummary.c_suite ? senioritySummary.c_suite : 0);
        $('#exposed-vp').text(senioritySummary.vp ? senioritySummary.vp : 0);
        $('#exposed-directors').text(senioritySummary.director ? senioritySummary.director : 0);
    }
}

function g1(years, breachCounts) {
    const allZero = breachCounts.every(count => count === 0);
    if (allZero) {
        document.getElementById('bc').style.display = 'none';

        const banner = document.createElement('div');
        banner.innerHTML = '<div align="center" class="alert alert-success" style="font-size: 20px; color: green;">Yay! No breaches in the recorded years.</div>';
        document.getElementById('bc').parentNode.insertBefore(banner, document.getElementById('bc'));
    } else {

        var ctx = document.getElementById('bc').getContext('2d');
        var config = {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Emails Count',
                    fill: false,
                    backgroundColor: window.chartColors.red,
                    borderColor: window.chartColors.red,
                    data: breachCounts,
                }]
            },
            options: {
                responsive: true,
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false,
                    text: 'Your Overall Breaches So Far'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            precision: 0
                        },
                        display: true,
                        scaleLabel: {
                            display: true,
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            precision: 0
                        },
                        gridLines: {
                            color: "#7CB9E8"
                        },
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Count of Emails Exposed'
                        }
                    }]
                }
            }
        };

        new Chart(ctx, config);
    }
}

function buildTopBreachesTable(breachNames, breachCounts) {
    const allZero = breachCounts.every(count => count === 0);

    if (allZero) {
        document.getElementById('chart_div').style.display = 'none';

        const banner = document.createElement('div');
        banner.innerHTML = '<div align="center" class="alert alert-success" style="font-size: 20px; color: green;">Great news! No significant breaches found.</div>';
        document.getElementById('chart_div').parentNode.insertBefore(banner, document.getElementById('chart_div'));
    } else {
        const breaches = breachNames.map((name, index) => ({
            name,
            count: breachCounts[index]
        }));

        breaches.sort((a, b) => b.count - a.count);

        let tableHtml = '<table style="width:100%; border-collapse: collapse;">';
        tableHtml += '<tr style="background-color: #f8f8f8; border-bottom: 1px solid #ddd;"><th style="padding: 10px; text-align: left;">Breach Name</th><th style="padding: 10px; text-align: left;">Count</th></tr>';

        for (let i = 0; i < breaches.length; i++) {
            let rowColor = i % 2 === 0 ? '#f8f8f8' : '#ffffff';
            let breachLink = `https://xposedornot.com/xposed#${breaches[i].name}`;
            tableHtml += `<tr style="background-color: ${rowColor}; border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><a href="${breachLink}" target="_blank">${breaches[i].name}</a></td><td style="padding: 10px;">${breaches[i].count}</td></tr>`;
        }

        tableHtml += '</table>';
        document.getElementById('chart_div').innerHTML = tableHtml;
    }
}

function addBreachesToTable(breaches) {
    const table = document.querySelector('#xposed_emails');
    const tableBody = table.querySelector('tbody');
    tableBody.innerHTML = '';

    for (let breach in breaches) {
        const row = document.createElement('tr');

        const cellName = document.createElement('td');
        const link = document.createElement('a');
        link.href = `https://xposedornot.com/xposed#${breach}`;
        link.target = '_blank';
        link.textContent = breach;
        cellName.appendChild(link);
        row.appendChild(cellName);

        const cellRecords = document.createElement('td');
        let records = breaches[breach].xposed_records;
        if (records && !isNaN(records)) {
            let formattedRecords = parseInt(records).toLocaleString();
            cellRecords.textContent = formattedRecords;
        } else {
            cellRecords.textContent = '';
        }
        row.appendChild(cellRecords);

        const cellDesc = document.createElement('td');
        cellDesc.textContent = breaches[breach].xposure_desc || '';
        row.appendChild(cellDesc);

        const cellData = document.createElement('td');
        let breaches_xposed_data = breaches[breach].xposed_data;
        let dataArray = breaches_xposed_data.split(";");
        let displayData = dataArray.join(", ");
        cellData.textContent = displayData || '';
        row.appendChild(cellData);

        const cellPasswordrisk = document.createElement('td');
        const span = document.createElement('span');
        span.textContent = breaches[breach].password_risk || '';
        switch (breaches[breach].password_risk) {
            case 'plaintext':
                span.classList.add('alert', 'alert-danger');
                break;
            case 'unknown':
                span.classList.add('alert', 'alert-dark');
                break;
            case 'easytocrack':
                span.classList.add('alert', 'alert-warning');
                break;
            case 'hardtocrack':
                span.classList.add('alert', 'alert-success');
                break;
            default:
                span.textContent = breaches[breach].password_risk || '';
                break;
        }

        cellPasswordrisk.appendChild(span);
        row.appendChild(cellPasswordrisk);
        tableBody.appendChild(row);
    }
}

function addBreachesDetailsToTable(breachesDetails) {
    const table = document.querySelector('#xposed_emails_details');
    const tableBody = table.querySelector('tbody');
    tableBody.innerHTML = '';

    let totalRecords = 0;

    for (let breachDetail of breachesDetails) {
        const row = document.createElement('tr');

        const cellBreachName = document.createElement('td');
        cellBreachName.textContent = breachDetail.breach;
        row.appendChild(cellBreachName);

        const cellEmailAddress = document.createElement('td');
        cellEmailAddress.textContent = breachDetail.email;
        row.appendChild(cellEmailAddress);

        const cellExposedData = document.createElement('td');
        cellExposedData.textContent = breachDetail.email;
        row.appendChild(cellExposedData);

        totalRecords += 1;

        tableBody.appendChild(row);
    }

    $('#exposed-records').text(totalRecords.toLocaleString());

    $('#xposed_emails_details').DataTable({
        dom: 'Bfrtip',
        buttons: [
            'csv', 'excel', 'pdf'
        ],
        initComplete: function () {
            $(".dt-buttons").prepend('<span class="buttons-label">Export as: &nbsp;</span>');
        }
    });
}

function createChannelLink(channel, email, token, domain) {
    var url = `alert-${channel}.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&domain=${encodeURIComponent(domain)}`;
    return `<a href="${url}" target="_blank">${channel} Channel</a>`;
}

function addDomainSummaryToTable(domainSummary, email, token) {
    const tbody = $('#verified_domains_tbody');
    tbody.empty();
    for (const [domain, emailCount] of Object.entries(domainSummary)) {
        const teamsUrl = `alert-teams.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&domain=${encodeURIComponent(domain)}`;
        const slackUrl = `alert-slack.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&domain=${encodeURIComponent(domain)}`;
        const rowHTML = `
            <tr>
                <td>${domain}</td>
                <td>${emailCount}</td>
                <td><button type="button" class="btn btn-outline-primary"><em class='fa fa-check-circle' style='color:green;font-size: 20px;'> &nbsp</em>Success</button></td>
                <td><button type="button" class="btn btn-outline-primary"><em class='fa fa-check-circle' style='color:green;font-size: 20px;'> &nbsp</em>Email</button></td>
                <td>
                    <button type="button" class="btn btn-outline-primary" onclick="window.open('${teamsUrl}', '_blank')"><em class='fa fa-users' style='color:blue;font-size: 20px;'> &nbsp</em>Teams</button>
                    <button type="button" class="btn btn-outline-primary" onclick="window.open('${slackUrl}', '_blank')"><em class='fa fa-comments' style='color:red;font-size: 20px;'> &nbsp</em>Slack</button>
                </td>
            </tr>`;
        tbody.append(rowHTML);
    }
}

const googleLink = document.getElementById("googleLink");
googleLink.addEventListener("click", function (event) {
    event.preventDefault();
    window.open("https://xposedornot.com/domain.html", "_blank");
});

