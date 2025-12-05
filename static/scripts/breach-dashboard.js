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

// Validate authentication - check if email and token are present
var authValid = email && token && email !== '0' && token !== '0' && email !== 'undefined' && token !== 'undefined';

$.LoadingOverlaySetup({
    background: "rgba(0, 0, 0, 0.5)",
    image: "static/images/shield-alt.svg",
    imageAnimation: "1s fadein",
    imageColor: "#6daae0"
});
$.LoadingOverlay("show");

/**
 * Show authentication modal with countdown and redirect
 */
function showAuthModal(message, redirectUrl) {
    redirectUrl = redirectUrl || 'dashboard.html';

    // Hide loading overlay if visible
    $.LoadingOverlay("hide");

    // Wait for DOM to be ready
    $(function() {
        $('#auth-modal-message').text(message);
        $('#auth-modal').show();

        // Reset and start progress bar animation
        var progressBar = $('#auth-progress-bar');
        progressBar.css('animation', 'none');
        progressBar[0].offsetHeight; // Trigger reflow
        progressBar.css('animation', 'authProgressShrink 5s linear forwards');

        // Countdown timer
        var countdown = 5;
        var countdownEl = $('#auth-countdown');
        countdownEl.text(countdown);

        var countdownInterval = setInterval(function() {
            countdown--;
            countdownEl.text(countdown);

            if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = redirectUrl;
            }
        }, 1000);
    });
}

// Show auth modal if validation failed
if (!authValid) {
    showAuthModal('Authentication required. Please access this page from the main dashboard.');
}

$(document).ready(function () {
    $('.btn-lg.btn-primary').not('#xonPlusModal .btn-primary').click(function () {
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

// Don't make API calls if auth is invalid
if (!authValid) {
    $.LoadingOverlay("hide");
} else {

var emailVerificationUrl = 'https://api.xposedornot.com/v1/send_domain_breaches?email=' + encodeURIComponent(email) + "&token=" + encodeURIComponent(token);

var myjson;
$.ajax(emailVerificationUrl)
    .done(function (n) {
        myjson = n;

        if (myjson) {
            var domains = new Set();
            var exposedEmails = new Set();
            if (myjson.Breaches_Details && Array.isArray(myjson.Breaches_Details)) {
                myjson.Breaches_Details.forEach(function (detail) {
                    domains.add(detail.domain);
                    exposedEmails.add(detail.email);
                });
            }

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

        // Populate dynamic alerts if available
        if (myjson.Alert_Management) {
            populateDynamicAlerts(myjson.Alert_Management);
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
            showAuthModal('Your session is invalid. Please log in again to continue.');
        } else if (n.status === 401) {
            showAuthModal('Your session has expired. Please log in again to continue.');
        } else {
            // Catch-all for other errors that might be auth-related
            showAuthModal('An error occurred. Please log in again to continue.');
        }
    });

} // End of authValid check

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

    // Convert breaches object to array and sort by 'added' timestamp (descending)
    const breachesArray = Object.entries(breaches).sort((a, b) => {
        const addedA = a[1].added || '';
        const addedB = b[1].added || '';
        return addedB.localeCompare(addedA); // Descending order
    });

    for (let [breach, breachData] of breachesArray) {
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
        let records = breachData.xposed_records;
        if (records && !isNaN(records)) {
            cellRecords.text(parseInt(records).toLocaleString());
        }
        row.append(cellRecords);


        const cellDesc = $('<td style="min-width: 250px;">');
        const breachDescription = breachData.xposure_desc || '';
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
        let breaches_xposed_data = breachData.xposed_data;
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
            text: breachData.password_risk || ''
        });

        switch (breachData.password_risk) {
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
        order: [],
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

    // Sort breachesDetails by 'added' timestamp from breach info (descending)
    breachesDetails.sort((a, b) => {
        const breachInfoA = breachesData[a.breach] || {};
        const breachInfoB = breachesData[b.breach] || {};
        const addedA = breachInfoA.added || '';
        const addedB = breachInfoB.added || '';
        return addedB.localeCompare(addedA); // Descending order
    });

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
        order: []
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
                    <button type="button" class="btn btn-outline-primary" onclick="showXonPlusModal('teams')"><em class='fa fa-users' style='color:blue;font-size: 20px;'> &nbsp</em>Teams</button>
                    <button type="button" class="btn btn-outline-primary" onclick="showXonPlusModal('slack')"><em class='fa fa-comments' style='color:red;font-size: 20px;'> &nbsp</em>Slack</button>
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
    const emailVerificationUrl = `https://api.xposedornot.com/v1/send_domain_breaches?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&time_filter=${timeFilter}`;
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

            // Populate dynamic alerts if available
            if (myjson.Alert_Management) {
                populateDynamicAlerts(myjson.Alert_Management);
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
                showAuthModal('Your session is invalid. Please log in again to continue.');
            } else if (n.status === 401) {
                showAuthModal('Your session has expired. Please log in again to continue.');
            } else {
                // Catch-all for other errors
                showAuthModal('An error occurred. Please log in again to continue.');
            }
        });
}

$('#data-filter').change(function () {
    if (!authValid) {
        showAuthModal('Authentication required. Please log in to continue.');
        return;
    }
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

// Function to show xonPlus migration modal
function showXonPlusModal(service) {
    const modal = $('#xonPlusModal');
    const modalTitle = modal.find('#xonPlusModalTitle');
    const modalIcon = modal.find('#xonPlusModalIcon');
    const modalDescription = modal.find('#xonPlusModalDescription');

    // Update modal content based on service type
    if (service === 'teams') {
        modalTitle.text('Microsoft Teams Integration');
        modalIcon.html('<i class="fa fa-users" style="color: #0078d4; font-size: 2.5rem;"></i>');
        modalDescription.text('Get real-time breach notifications directly in your Microsoft Teams channels with advanced filtering and custom webhook support.');
    } else if (service === 'slack') {
        modalTitle.text('Slack Integration');
        modalIcon.html('<i class="fa fa-comments" style="color: #4a154b; font-size: 2.5rem;"></i>');
        modalDescription.text('Receive instant breach alerts in your Slack workspace with customizable message formatting and priority levels.');
    }

    modal.modal('show');
}

// Function to populate dynamic alert management table
function populateDynamicAlerts(alertManagement) {
    const alertSection = $('.breach-alerts-section');
    const alertIcon = $('.alert-section-icon');
    const alertDescription = $('.alert-section-description');

    if (!alertManagement || !alertManagement.summary || !alertManagement.alerts) {
        console.warn('No Alert_Management data found in API response');
        $('#dynamic-alert-badge').text('No Alerts').removeClass('badge-danger badge-warning').addClass('badge-success');
        alertSection.addClass('no-alerts');
        alertIcon.removeClass('fa-exclamation-triangle').addClass('fa-check-circle');
        alertDescription.text('All clear - no pending breach alerts');
        return;
    }

    const summary = alertManagement.summary;
    const alerts = alertManagement.alerts;

    // Update badge
    const pendingCount = summary.pending_count || 0;
    const totalAlerts = summary.total_alerts || 0;
    const badge = $('#dynamic-alert-badge');

    if (pendingCount > 0) {
        badge.text(`${pendingCount} Pending`).removeClass('badge-success badge-secondary').addClass('badge-danger');
        alertSection.removeClass('no-alerts');
        alertIcon.removeClass('fa-check-circle').addClass('fa-exclamation-triangle');
        alertDescription.text('New breaches requiring your acknowledgment');
    } else if (totalAlerts > 0) {
        badge.text('All Acknowledged').removeClass('badge-danger badge-secondary').addClass('badge-success');
        alertSection.addClass('no-alerts');
        alertIcon.removeClass('fa-exclamation-triangle').addClass('fa-check-circle');
        alertDescription.text('All breach alerts have been acknowledged');
    } else {
        badge.text('No Alerts').removeClass('badge-danger badge-warning').addClass('badge-secondary');
        alertSection.addClass('no-alerts');
        alertIcon.removeClass('fa-exclamation-triangle').addClass('fa-check-circle');
        alertDescription.text('All clear - no pending breach alerts');
    }

    // Populate table
    const tbody = $('#dynamic_alerts_tbody');
    tbody.empty();

    if (alerts.length === 0) {
        tbody.append('<tr><td colspan="7" class="text-center">No alerts to display</td></tr>');
        alertSection.addClass('no-alerts');
        return;
    }

    // Sort alerts by alert_time (most recent first)
    alerts.sort((a, b) => new Date(b.alert_time) - new Date(a.alert_time));

    // Get breach details from Detailed_Breach_Info for record counts
    const breachDetails = myjson && myjson.Detailed_Breach_Info ? myjson.Detailed_Breach_Info : {};

    alerts.forEach(alert => {
        const alertDate = new Date(alert.alert_time);
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = alertDate.toLocaleDateString('en-US', dateOptions);
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' };
        const formattedTime = alertDate.toLocaleTimeString('en-US', timeOptions);

        // Get breach record count from Detailed_Breach_Info
        let breachRecordCount = 'N/A';
        if (breachDetails[alert.breach_id] && breachDetails[alert.breach_id].xposed_records) {
            const records = parseInt(breachDetails[alert.breach_id].xposed_records);
            if (!isNaN(records)) {
                breachRecordCount = records.toLocaleString() + ' records';
            }
        }

        // Determine severity badge
        let severityBadge = '';
        let severityIcon = '';
        if (alert.severity === 'Critical') {
            severityBadge = 'background-color: #e74c3c; color: white;';
            severityIcon = '<i class="fas fa-fire"></i>';
        } else if (alert.severity === 'High') {
            severityBadge = 'background-color: #f39c12; color: white;';
            severityIcon = '<i class="fas fa-exclamation-circle"></i>';
        } else if (alert.severity === 'Medium') {
            severityBadge = 'background-color: #f1c40f; color: white;';
            severityIcon = '<i class="fas fa-exclamation-triangle"></i>';
        } else {
            severityBadge = 'background-color: #3498db; color: white;';
            severityIcon = '<i class="fas fa-info-circle"></i>';
        }

        // Determine status
        const isPending = alert.status === 'Pending';
        const rowClass = isPending ? 'pending-alert' : '';
        const statusBadge = isPending
            ? '<span class="badge badge-warning" style="padding: 6px 12px; border-radius: 15px; animation: pulse 2s infinite;"><i class="fas fa-clock"></i> Pending</span>'
            : '<span class="badge badge-success" style="padding: 6px 12px; border-radius: 15px;"><i class="fas fa-check-circle"></i> Acknowledged</span>';

        // Action button
        const actionButton = isPending
            ? `<button class="btn btn-sm btn-danger dynamic-acknowledge-btn" data-alert-id="${alert.alert_id}" data-breach="${alert.breach_name}" title="Acknowledge this alert" style="padding: 5px 10px; border-radius: 5px; font-weight: 500;"><i class="fas fa-check"></i></button>`
            : `<button class="btn btn-sm btn-warning dynamic-unacknowledge-btn" data-alert-id="${alert.alert_id}" data-breach="${alert.breach_name}" title="Un-acknowledge this alert" style="padding: 5px 10px; border-radius: 5px; font-weight: 500; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); border: none; color: white;"><i class="fas fa-undo"></i></button>`;

        // Truncate description
        const truncatedDesc = alert.description.length > 100
            ? alert.description.substring(0, 100) + '...'
            : alert.description;

        const row = `
            <tr class="alert-row ${rowClass}" data-alert-id="${alert.alert_id}">
                <td class="alert-time" data-timestamp="${alert.alert_time}">
                    <strong class="alert-date">${formattedDate}</strong><br>
                    <small class="alert-time-detail" style="color: #7f8c8d;">${formattedTime}</small>
                </td>
                <td>
                    <strong style="color: #2c3e50;">${alert.breach_name}</strong><br>
                    <small style="color: #7f8c8d;">${breachRecordCount}</small>
                </td>
                <td>
                    <span class="badge" style="${severityBadge} padding: 5px 10px; border-radius: 12px;">
                        ${severityIcon} ${alert.severity}
                    </span>
                </td>
                <td>
                    <strong style="color: #e74c3c;">${alert.affected_email_count}</strong> emails<br>
                    <small style="color: #7f8c8d;">1 domain</small>
                </td>
                <td style="font-size: 13px;">
                    ${truncatedDesc}
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td style="text-align: center;">
                    ${actionButton}
                </td>
            </tr>
        `;

        tbody.append(row);
    });
}

// Dynamic Alert Acknowledgment Handler - Show Modal
let pendingAcknowledgment = null;

$(document).on('click', '.dynamic-acknowledge-btn', function() {
    const alertId = $(this).data('alert-id');
    const breachName = $(this).data('breach');
    const button = $(this);
    const row = button.closest('tr');

    // Store reference for confirmation
    pendingAcknowledgment = {
        alertId: alertId,
        breachName: breachName,
        button: button,
        row: row
    };

    // Update modal content
    $('#modal-breach-name').text(breachName);
    $('#modal-alert-id').text(alertId);

    // Show modal
    $('#acknowledgeAlertModal').modal('show');
});

// Handle Confirm Button in Modal
$('#confirmAcknowledgeBtn').on('click', function() {
    if (!pendingAcknowledgment) return;

    const { alertId, breachName, button, row } = pendingAcknowledgment;
    const confirmBtn = $(this);
    const cancelBtn = $('#acknowledgeAlertModal').find('.btn-secondary');

    // Disable buttons and show loading state
    confirmBtn.prop('disabled', true);
    cancelBtn.prop('disabled', true);
    confirmBtn.html('<i class="fas fa-spinner fa-spin mr-1"></i>Processing...');

    // Make API call to acknowledge the alert
    const apiUrl = `https://api.xposedornot.com/v1/update_alert_status?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    $.ajax({
        url: apiUrl,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            alert_id: alertId,
            status: 'Acknowledged'
        }),
        success: function(response) {
            // Close modal
            $('#acknowledgeAlertModal').modal('hide');

            // Update status badge
            const statusCell = row.find('td:nth-child(6)');
            statusCell.html('<span class="badge badge-success" style="padding: 6px 12px; border-radius: 15px;"><i class="fas fa-check-circle"></i> Acknowledged</span>');

            // Update action button
            button.html('<i class="fas fa-check-double"></i>');
            button.removeClass('btn-danger dynamic-acknowledge-btn');
            button.addClass('btn-success');
            button.prop('disabled', true);

            // Remove pending background
            row.removeClass('pending-alert');
            row.css('background-color', '#f0fff4');

            // Update pending count in badge
            const badge = $('#dynamic-alert-badge');
            const alertSection = $('.breach-alerts-section');
            const alertIcon = $('.alert-section-icon');
            const alertDescription = $('.alert-section-description');
            const currentText = badge.text();
            const match = currentText.match(/(\d+)\s+Pending/);

            if (match) {
                const currentCount = parseInt(match[1]);
                const newCount = currentCount - 1;

                if (newCount > 0) {
                    badge.text(`${newCount} Pending`);
                    alertSection.removeClass('no-alerts');
                    alertIcon.removeClass('fa-check-circle').addClass('fa-exclamation-triangle');
                    alertDescription.text('New breaches requiring your acknowledgment');
                } else {
                    badge.text('All Acknowledged');
                    badge.removeClass('badge-danger');
                    badge.addClass('badge-success');
                    alertSection.addClass('no-alerts');
                    alertIcon.removeClass('fa-exclamation-triangle').addClass('fa-check-circle');
                    alertDescription.text('All breach alerts have been acknowledged');
                }
            }

            // Show success message
            const successMsg = $('<div>', {
                class: 'alert alert-success',
                css: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                },
                html: `<strong>Success!</strong> Alert for "${breachName}" has been acknowledged.<br><small>Acknowledged by: ${response.acknowledged_by || email}</small>`
            });

            $('body').append(successMsg);

            setTimeout(() => {
                successMsg.css({
                    transition: 'opacity 0.5s',
                    opacity: '0'
                });
                setTimeout(() => successMsg.remove(), 500);
            }, 4000);

            // Clear pending acknowledgment
            pendingAcknowledgment = null;

            // Reset button state
            confirmBtn.prop('disabled', false);
            cancelBtn.prop('disabled', false);
            confirmBtn.html('<i class="fas fa-check mr-1"></i>Acknowledge');
        },
        error: function(xhr, status, error) {
            // Close modal
            $('#acknowledgeAlertModal').modal('hide');

            // Show error message
            let errorMessage = 'Failed to acknowledge alert. Please try again.';

            // Handle auth errors with modal
            if (xhr.status === 401) {
                showAuthModal('Your session has expired. Please log in again to continue.');
                return;
            }

            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 404) {
                errorMessage = 'Alert not found.';
            } else if (xhr.status === 400) {
                errorMessage = 'Invalid request. Please refresh and try again.';
            }

            const errorMsg = $('<div>', {
                class: 'alert alert-danger',
                css: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                },
                html: `<strong>Error!</strong> ${errorMessage}`
            });

            $('body').append(errorMsg);

            setTimeout(() => {
                errorMsg.css({
                    transition: 'opacity 0.5s',
                    opacity: '0'
                });
                setTimeout(() => errorMsg.remove(), 500);
            }, 5000);

            // Clear pending acknowledgment
            pendingAcknowledgment = null;

            // Reset button state
            confirmBtn.prop('disabled', false);
            cancelBtn.prop('disabled', false);
            confirmBtn.html('<i class="fas fa-check mr-1"></i>Acknowledge');
        }
    });
});

// Clear pending acknowledgment when modal is dismissed
$('#acknowledgeAlertModal').on('hidden.bs.modal', function() {
    pendingAcknowledgment = null;

    // Reset button state in case modal was closed during processing
    const confirmBtn = $('#confirmAcknowledgeBtn');
    const cancelBtn = $('#acknowledgeAlertModal').find('.btn-secondary');

    confirmBtn.prop('disabled', false);
    cancelBtn.prop('disabled', false);
    confirmBtn.html('<i class="fas fa-check mr-1"></i>Acknowledge');
});

// ===============================================
// UN-ACKNOWLEDGE ALERT HANDLERS
// ===============================================

// Dynamic Alert Un-acknowledgment Handler - Show Modal
let pendingUnacknowledgment = null;

$(document).on('click', '.dynamic-unacknowledge-btn', function() {
    const alertId = $(this).data('alert-id');
    const breachName = $(this).data('breach');
    const button = $(this);
    const row = button.closest('tr');

    // Store reference for confirmation
    pendingUnacknowledgment = {
        alertId: alertId,
        breachName: breachName,
        button: button,
        row: row
    };

    // Update modal content
    $('#unack-modal-breach-name').text(breachName);
    $('#unack-modal-alert-id').text(alertId);

    // Show modal
    $('#unacknowledgeAlertModal').modal('show');
});

// Handle Confirm Button in Un-acknowledge Modal
$('#confirmUnacknowledgeBtn').on('click', function() {
    if (!pendingUnacknowledgment) return;

    const { alertId, breachName, button, row } = pendingUnacknowledgment;
    const confirmBtn = $(this);
    const cancelBtn = $('#unacknowledgeAlertModal').find('.btn-secondary');

    // Disable buttons and show loading state
    confirmBtn.prop('disabled', true);
    cancelBtn.prop('disabled', true);
    confirmBtn.html('<i class="fas fa-spinner fa-spin mr-1"></i>Processing...');

    // Make API call to un-acknowledge the alert
    const apiUrl = `https://api.xposedornot.com/v1/update_alert_status?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    $.ajax({
        url: apiUrl,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            alert_id: alertId,
            status: 'Pending'
        }),
        success: function(response) {
            // Close modal
            $('#unacknowledgeAlertModal').modal('hide');

            // Update status badge
            const statusCell = row.find('td:nth-child(6)');
            statusCell.html('<span class="badge badge-warning" style="padding: 6px 12px; border-radius: 15px; animation: pulse 2s infinite;"><i class="fas fa-clock"></i> Pending</span>');

            // Update action button back to acknowledge button
            button.html('<i class="fas fa-check"></i>');
            button.removeClass('btn-warning dynamic-unacknowledge-btn');
            button.addClass('btn-danger dynamic-acknowledge-btn');
            button.attr('title', 'Acknowledge this alert');
            button.css({
                'background': '',
                'border': '',
                'color': ''
            });

            // Add pending background
            row.addClass('pending-alert');
            row.css('background-color', '');

            // Update pending count in badge
            const badge = $('#dynamic-alert-badge');
            const alertSection = $('.breach-alerts-section');
            const alertIcon = $('.alert-section-icon');
            const alertDescription = $('.alert-section-description');
            const currentText = badge.text();

            if (currentText === 'All Acknowledged') {
                // Was all acknowledged, now we have 1 pending
                badge.text('1 Pending');
                badge.removeClass('badge-success');
                badge.addClass('badge-danger');
                alertSection.removeClass('no-alerts');
                alertIcon.removeClass('fa-check-circle').addClass('fa-exclamation-triangle');
                alertDescription.text('New breaches requiring your acknowledgment');
            } else {
                // Increment pending count
                const match = currentText.match(/(\d+)\s+Pending/);
                if (match) {
                    const currentCount = parseInt(match[1]);
                    const newCount = currentCount + 1;
                    badge.text(`${newCount} Pending`);
                    alertSection.removeClass('no-alerts');
                    alertIcon.removeClass('fa-check-circle').addClass('fa-exclamation-triangle');
                    alertDescription.text('New breaches requiring your acknowledgment');
                } else {
                    badge.text('1 Pending');
                    badge.removeClass('badge-success badge-secondary');
                    badge.addClass('badge-danger');
                    alertSection.removeClass('no-alerts');
                    alertIcon.removeClass('fa-check-circle').addClass('fa-exclamation-triangle');
                    alertDescription.text('New breaches requiring your acknowledgment');
                }
            }

            // Show success message
            const successMsg = $('<div>', {
                class: 'alert alert-warning',
                css: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    color: '#856404',
                    backgroundColor: '#fff3cd',
                    borderColor: '#ffeaa7'
                },
                html: `<strong>Reverted!</strong> Alert for "${breachName}" has been marked as pending.<br><small>Updated by: ${response.last_updated_by || email}</small>`
            });

            $('body').append(successMsg);

            setTimeout(() => {
                successMsg.css({
                    transition: 'opacity 0.5s',
                    opacity: '0'
                });
                setTimeout(() => successMsg.remove(), 500);
            }, 4000);

            // Clear pending unacknowledgment
            pendingUnacknowledgment = null;

            // Reset button state
            confirmBtn.prop('disabled', false);
            cancelBtn.prop('disabled', false);
            confirmBtn.html('<i class="fas fa-undo mr-1"></i>Un-acknowledge');
        },
        error: function(xhr, status, error) {
            // Close modal
            $('#unacknowledgeAlertModal').modal('hide');

            // Show error message
            let errorMessage = 'Failed to un-acknowledge alert. Please try again.';

            // Handle auth errors with modal
            if (xhr.status === 401) {
                showAuthModal('Your session has expired. Please log in again to continue.');
                return;
            }

            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 404) {
                errorMessage = 'Alert not found.';
            } else if (xhr.status === 400) {
                errorMessage = 'Invalid request. Please refresh and try again.';
            }

            const errorMsg = $('<div>', {
                class: 'alert alert-danger',
                css: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                },
                html: `<strong>Error!</strong> ${errorMessage}`
            });

            $('body').append(errorMsg);

            setTimeout(() => {
                errorMsg.css({
                    transition: 'opacity 0.5s',
                    opacity: '0'
                });
                setTimeout(() => errorMsg.remove(), 500);
            }, 5000);

            // Clear pending unacknowledgment
            pendingUnacknowledgment = null;

            // Reset button state
            confirmBtn.prop('disabled', false);
            cancelBtn.prop('disabled', false);
            confirmBtn.html('<i class="fas fa-undo mr-1"></i>Un-acknowledge');
        }
    });
});

// Clear pending unacknowledgment when modal is dismissed
$('#unacknowledgeAlertModal').on('hidden.bs.modal', function() {
    pendingUnacknowledgment = null;

    // Reset button state in case modal was closed during processing
    const confirmBtn = $('#confirmUnacknowledgeBtn');
    const cancelBtn = $('#unacknowledgeAlertModal').find('.btn-secondary');

    confirmBtn.prop('disabled', false);
    cancelBtn.prop('disabled', false);
    confirmBtn.html('<i class="fas fa-undo mr-1"></i>Un-acknowledge');
});
