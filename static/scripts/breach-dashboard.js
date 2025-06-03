$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results ? results[1] : 0;
};

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

    // Initialize phishing button if it exists
    const phishingBtn = document.getElementById('phishingBtn');
    if (phishingBtn) {
        initializePhishingButton();
    }

    $('#breachAnalysisBtn').click(function () {
        var analysisUrl = 'breach-analysis.html?email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token);
        window.location.href = analysisUrl;
    });

    const backToTop = $('.back-to-top');

    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            backToTop.addClass('visible');
        } else {
            backToTop.removeClass('visible');
        }
    });

    backToTop.click(function (e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: 0
        }, {
            duration: 500,
            easing: 'easeInOutQuad'
        });
    });

    if ($(window).scrollTop() <= 300) {
        backToTop.removeClass('visible');
    }


    $('.api-key-btn').click(function () {
        var newUrl = 'api_key_management.html?email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token);
        window.location.href = newUrl;
    });

    $('.domain-add-btn').click(function () {
        window.open("https://xposedornot.com/domain.html", "_blank");
    });

    $('.analysis-btn').click(function () {
        var analysisUrl = 'breach-analysis.html?email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token);
        window.location.href = analysisUrl;
    });


    $('.utility-buttons .btn-utility').click(function (e) {
        const buttonType = $(this).attr('class').split(' ')[2];
        const bottomButton = $(`.xon .btn-lg[data-button="${buttonType}"]`);
        if (bottomButton.length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: bottomButton.offset().top
            }, 1000);
        }
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
            $('#tree-container').empty();
            $('#tree-container').hortree({
                data: [yearlyBreachHierarchy],
                levelSeparation: 30,
                nodeWidth: 120,
                nodeHeight: 80,
                rootClass: 'hortree-root',
                childrenClass: 'hortree-children',
                labelClass: 'hortree-label',
                edgeClass: 'hortree-edge'
            });
        }

        const domainSummary = myjson.Domain_Summary;
        if (domainSummary && typeof domainSummary === 'object') {
            addDomainSummaryToTable(domainSummary, email, token);
        }
        updateSenioritySummary(myjson.Seniority_Summary);

        // Only initialize if button exists
        const phishingBtn = document.getElementById('phishingBtn');
        if (phishingBtn) {
            initializePhishingButton();
        }

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
            $("#db-s").html("<b>Please Slow down.</b><br>Looks like you're going too fast, please try again after some time.");
            $("#db-s").show();
        } else if (n.status === 400) {
            $.LoadingOverlay("hide");
            $("#db-s").html("<b>Please Slow down.</b><br>Looks like you're not authenticated properly.");
            window.location.replace("http://xposedornot.com");
            $("#db-s").show();
        }
    });


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

    window.breachesData = breaches;

    const table = $('#xposed_emails');

    if ($.fn.DataTable.isDataTable(table)) {
        table.DataTable().destroy();
    }

    const tableBody = table.find('tbody');
    tableBody.empty();

    for (let breach in breaches) {
        const row = $('<tr>');


        const cellName = $('<td>');
        const link = $('<a>', {
            href: `https://xposedornot.com/xposed#${breach}`,
            target: '_blank',
            text: breach
        });
        cellName.append(link);
        row.append(cellName);


        const cellRecords = $('<td>');
        let records = breaches[breach].xposed_records;
        if (records && !isNaN(records)) {
            cellRecords.text(parseInt(records).toLocaleString());
        }
        row.append(cellRecords);


        const cellDesc = $('<td style="min-width: 250px;">');
        const breachDescription = breaches[breach].xposure_desc || '';
        const trimmedDesc = breachDescription.length > 200 ?
            breachDescription.substring(0, 200) + '...' :
            breachDescription;

        const descContent = $('<div>', {
            class: 'description-content',
            text: trimmedDesc
        }).css({
            maxHeight: '150px',
            overflow: 'hidden'
        });

        if (breachDescription.length > 200) {
            const toggleButton = $('<button>', {
                text: 'See more',
                class: 'btn btn-link',
                css: {
                    padding: '0',
                    display: 'block'
                }
            }).click(function () {
                const content = $(this).prev('.description-content');
                if (content.css('maxHeight') === '150px') {
                    content.css('maxHeight', 'none').text(breachDescription);
                    $(this).text('Show less');
                } else {
                    content.css('maxHeight', '150px').text(trimmedDesc);
                    $(this).text('See more');
                }
            });
            cellDesc.append(descContent).append(toggleButton);
        } else {
            cellDesc.append(descContent);
        }
        row.append(cellDesc);


        const cellData = $('<td style="min-width: 200px;">');
        let breaches_xposed_data = breaches[breach].xposed_data;
        let dataArray = breaches_xposed_data.split(";");
        let displayData = dataArray.join(", ");

        const dataContent = $('<div>', {
            class: 'data-content',
            text: displayData.length > 100 ? displayData.substring(0, 100) + '...' : displayData
        }).css({
            maxHeight: '150px',
            overflow: 'hidden'
        });

        if (displayData.length > 100) {
            const toggleDataButton = $('<button>', {
                text: 'See more',
                class: 'btn btn-link',
                css: {
                    padding: '0',
                    display: 'block'
                }
            }).click(function () {
                const content = $(this).prev('.data-content');
                if (content.css('maxHeight') === '150px') {
                    content.css('maxHeight', 'none').text(displayData);
                    $(this).text('Show less');
                } else {
                    content.css('maxHeight', '150px').text(displayData.substring(0, 100) + '...');
                    $(this).text('See more');
                }
            });
            cellData.append(dataContent).append(toggleDataButton);
        } else {
            cellData.append(dataContent);
        }
        row.append(cellData);


        const cellPasswordrisk = $('<td>');
        const span = $('<span>', {
            text: breaches[breach].password_risk || ''
        });

        switch (breaches[breach].password_risk) {
            case 'plaintext':
                span.addClass('alert alert-danger');
                break;
            case 'unknown':
                span.addClass('alert alert-dark');
                break;
            case 'easytocrack':
                span.addClass('alert alert-warning');
                break;
            case 'hardtocrack':
                span.addClass('alert alert-success');
                break;
        }

        cellPasswordrisk.append(span);
        row.append(cellPasswordrisk);
        tableBody.append(row);
    }


    table.DataTable({
        dom: '<"top"<"d-flex align-items-center justify-content-between"lB>f>rtip',
        buttons: [{
            extend: 'collection',
            text: 'Export',
            buttons: ['csv', 'excel', 'pdf']
        }],
        pageLength: 10,
        responsive: true,
        scrollX: true,
        autoWidth: false,
        order: [[0, 'desc']],
        columnDefs: [
            {
                targets: [1, 4],
                width: '10%'
            },
            {
                targets: [2, 3],
                width: '30%'
            }
        ]
    });
}

function addBreachesDetailsToTable(breachesDetails) {
    const table = $('#xposed_emails_details');

    if ($.fn.DataTable.isDataTable(table)) {
        table.DataTable().destroy();
    }

    const tableBody = table.find('tbody');
    tableBody.empty();

    let totalRecords = 0;


    const breachesData = window.breachesData || {};

    breachesDetails.forEach(breachDetail => {
        const row = $('<tr>');


        row.append($('<td>').text(breachDetail.breach));


        row.append($('<td>').text(breachDetail.email));


        const breachInfo = breachesData[breachDetail.breach];
        const exposedData = breachInfo ? breachInfo.xposed_data : '';
        row.append($('<td>').text(exposedData));

        tableBody.append(row);
        totalRecords++;
    });

    $('#exposed-records').text(totalRecords.toLocaleString());

    table.DataTable({
        dom: '<"top"<"d-flex align-items-center justify-content-between"lB>f>rtip',
        buttons: [{
            extend: 'collection',
            text: 'Export',
            buttons: ['csv', 'excel', 'pdf']
        }],
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        autoWidth: false,
        responsive: true,
        scrollX: true,
        initComplete: function () {
            $(".dt-buttons").prepend('<span class="buttons-label">Export as: &nbsp;</span>');
        },
        order: [[0, 'asc']]
    });
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

function updateApiCall(timeFilter) {
    const emailVerificationUrl = `https://api.xposedornot.com/v2/send_domain_breaches?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&time_filter=${timeFilter}`;
    $.LoadingOverlay("show");

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
                $('#tree-container').empty();
                $('#tree-container').hortree({
                    data: [yearlyBreachHierarchy],
                    levelSeparation: 30,
                    nodeWidth: 120,
                    nodeHeight: 80,
                    rootClass: 'hortree-root',
                    childrenClass: 'hortree-children',
                    labelClass: 'hortree-label',
                    edgeClass: 'hortree-edge'
                });
            }

            const domainSummary = myjson.Domain_Summary;
            if (domainSummary && typeof domainSummary === 'object') {
                addDomainSummaryToTable(domainSummary, email, token);
            }
            updateSenioritySummary(myjson.Seniority_Summary);

            // Only initialize if button exists
            const phishingBtn = document.getElementById('phishingBtn');
            if (phishingBtn) {
                initializePhishingButton();
            }

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
                $("#db-s").html("<b>Please Slow down.</b><br>Looks like you're going too fast, please try again after some time.");
                $("#db-s").show();
            } else if (n.status === 400) {
                $.LoadingOverlay("hide");
                $("#db-s").html("<b>Please Slow down.</b><br>Looks like you're not authenticated properly.");
                window.location.replace("http://xposedornot.com");
                $("#db-s").show();
            }
        });
}

$('#data-filter').change(function () {
    const selectedValue = $(this).val();
    updateApiCall(selectedValue);
});

if (typeof jQuery.easing.easeInOutQuad === 'undefined') {
    jQuery.easing.easeInOutQuad = function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    };
}

// Modify the initialization function to check for button existence
function initializePhishingButton() {
    const phishingBtn = document.getElementById('phishingBtn');
    const domainDropdown = document.getElementById('domainDropdown');

    if (!phishingBtn || !domainDropdown) {
        console.warn('Phishing button or dropdown not found in DOM');
        return;
    }

    let domains = [];

    // Get domains from the API response
    if (myjson && myjson.Breaches_Details) {
        domains = [...new Set(myjson.Breaches_Details.map(detail => detail.domain))];
    }

    // Remove any existing event listeners
    const newPhishingBtn = phishingBtn.cloneNode(true);
    phishingBtn.parentNode.replaceChild(newPhishingBtn, phishingBtn);

    // Toggle dropdown on button click
    newPhishingBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        domainDropdown.classList.toggle('show');

        // Populate domains if not already done
        if (domainDropdown.children.length === 0) {
            domainDropdown.innerHTML = '';
            if (domains.length === 1) {
                // If only one domain, create a single clickable item
                const item = document.createElement('div');
                item.className = 'domain-dropdown-item';
                item.textContent = domains[0];
                item.addEventListener('click', () => {
                    window.open(`domains-phishing-detail.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&domain=${encodeURIComponent(domains[0])}`, '_blank');
                    domainDropdown.classList.remove('show');
                });
                domainDropdown.appendChild(item);
            } else {
                // If multiple domains, create items for each
                domains.forEach(domain => {
                    const item = document.createElement('div');
                    item.className = 'domain-dropdown-item';
                    item.textContent = domain;
                    item.addEventListener('click', () => {
                        window.open(`domains-phishing-detail.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&domain=${encodeURIComponent(domain)}`, '_blank');
                        domainDropdown.classList.remove('show');
                    });
                    domainDropdown.appendChild(item);
                });
            }
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!newPhishingBtn.contains(e.target) && !domainDropdown.contains(e.target)) {
            domainDropdown.classList.remove('show');
        }
    });
}
