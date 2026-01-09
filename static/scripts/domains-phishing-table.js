let phishingTable;

google.charts.load('current', { 'packages': ['gauge'] });

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    };
    return date.toLocaleString(undefined, options);
}

function showVerificationError(domain, errorDetail) {
    // Hide the table section and check another domain button
    $('.sec5').hide();
    $('#checkAnotherDomainBtn').hide();

    // Update the banner message
    $('.banner-row h1').html('Domain <span>verification required</span>');

    // Show error in sec3 area
    document.getElementById('domain-display').textContent = domain;
    document.getElementById('last-exposure').textContent = '--';
    document.getElementById('breach-count').textContent = '--';
    document.getElementById('record-count').textContent = '--';
    document.getElementById('email-count').textContent = '--';

    // Hide the chart and show error message
    const chartDiv = document.getElementById('chart_div');
    if (chartDiv) {
        chartDiv.innerHTML = '';
    }

    // Get email and token from URL for links
    const email = getUrlParameter('email');
    const token = getUrlParameter('token');
    let verifyUrl = 'domain.html';
    let dashboardUrl = 'breach-dashboard.html';
    if (email && token) {
        verifyUrl = `domain.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&domain=${encodeURIComponent(domain)}`;
        dashboardUrl = `breach-dashboard.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    }

    // Show note with error message
    const noteDiv = document.getElementById('note');
    if (noteDiv) {
        noteDiv.style.display = 'block';
        noteDiv.innerHTML = `
            <div class="verification-error-container">
                <div class="verification-error-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="verification-error-title">Domain Not Verified</h3>
                <p class="verification-error-domain">${domain}</p>
                <p class="verification-error-message">This domain has not been verified for your account. Please verify domain ownership to access the detailed phishing report.</p>
                <div class="verification-error-actions">
                    <a href="${verifyUrl}" class="btn-verify">
                        <i class="fas fa-check-circle"></i> Verify Domain
                    </a>
                    <a href="${dashboardUrl}" class="btn-back">
                        <i class="fas fa-arrow-left"></i> Back to Dashboard
                    </a>
                </div>
            </div>
        `;
    }
}

function calculateRiskScore(data) {
    const liveDomains = data.total_live;
    const totalScanned = data.total_scanned;
    const domainRisk = Math.min((liveDomains / 10) * 10, 70);
    const liveRatio = liveDomains / totalScanned;
    const ratioRisk = Math.min(liveRatio * 30, 30);
    return Math.round(domainRisk + ratioRisk);
}

function drawRiskMeter(riskScore) {
    const chartDiv = document.getElementById('chart_div');
    const chartData = new google.visualization.DataTable();
    chartData.addColumn('string', 'Label');
    chartData.addColumn('number', 'Value');
    chartData.addRows([
        ['Risk', riskScore]
    ]);

    const options = {
        width: 150,
        height: 150,
        redFrom: 90,
        redTo: 100,
        yellowFrom: 70,
        yellowTo: 90,
        greenFrom: 0,
        greenTo: 70,
        minorTicks: 5,
        majorTicks: ['0', '20', '40', '60', '80', '100'],
        max: 100,
        min: 0
    };

    const chart = new google.visualization.Gauge(chartDiv);
    chart.draw(chartData, options);


    let riskLevel;
    if (riskScore <= 70) {
        riskLevel = 'Low Risk';
    } else if (riskScore <= 90) {
        riskLevel = 'Medium Risk';
    } else {
        riskLevel = 'High Risk';
    }

    const riskLevelDiv = document.createElement('div');
    riskLevelDiv.style.textAlign = 'center';
    riskLevelDiv.style.color = '#fff';
    riskLevelDiv.style.marginTop = '10px';
    riskLevelDiv.style.fontSize = '14px';
    riskLevelDiv.textContent = riskLevel;

    const existingElements = chartDiv.parentElement.querySelectorAll('.risk-level, .risk-score');
    existingElements.forEach(el => el.remove());

    riskLevelDiv.className = 'risk-level';
    chartDiv.parentElement.appendChild(riskLevelDiv);
}


function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

async function checkDomain(domain) {
    const API_ENDPOINT = 'https://api.xposedornot.com/v1/domain-phishing/';
    try {

        const email = getUrlParameter('email');
        const token = getUrlParameter('token');

        let apiUrl = API_ENDPOINT + encodeURIComponent(domain);
        const params = [];
        if (email) params.push('email=' + encodeURIComponent(email));
        if (token) params.push('token=' + encodeURIComponent(token));
        if (params.length > 0) {
            apiUrl += '?' + params.join('&');
        }

        const response = await fetch(apiUrl);

        if (response.status === 429) {
            alert('Too many requests. Please try again in a few minutes.');
            $.LoadingOverlay("hide");
            return;
        }
        if (response.status === 404) {
            alert('Domain not found. Please check the domain name and try again.');
            $.LoadingOverlay("hide");
            return;
        }
        if (response.status >= 500) {
            alert('Service temporarily unavailable. Please try again later.');
            $.LoadingOverlay("hide");
            return;
        }

        const data = await response.json();

        // Handle error responses with detail field
        if (data.detail) {
            $.LoadingOverlay("hide");
            document.getElementById('content').classList.remove('blurred');
            showVerificationError(domain, data.detail);
            return;
        }

        if (!response.ok) {
            alert('An error occurred while checking the domain. Please try again.');
            $.LoadingOverlay("hide");
            return;
        }

        if (data.status === 'success') {
            document.getElementById('domain-display').textContent = domain;
            document.getElementById('last-exposure').textContent = formatDate(data.last_checked);

            const logoImg = document.getElementById('logo');
            if (logoImg) {
                logoImg.src = `https://logo.clearbit.com/${domain}`;
                logoImg.onerror = function () {
                    this.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                    this.onerror = function () {
                        this.style.display = 'none';
                    };
                };
                logoImg.style.display = 'inline-block';
            }


            document.getElementById('breach-count').textContent = data.total_scanned;
            document.getElementById('record-count').textContent = data.total_live;
            document.getElementById('email-count').textContent = data.unique_fuzzers || '-';

            // Show fire emoji if live domains > 0
            const fireEmoji = document.getElementById('fire-emoji');
            if (fireEmoji) {
                fireEmoji.style.display = data.total_live > 0 ? 'block' : 'none';
            }

            const riskScore = calculateRiskScore(data);
            google.charts.setOnLoadCallback(() => {
                drawRiskMeter(riskScore);
                $.LoadingOverlay("hide");
            });

            document.getElementById('content').classList.remove('blurred');
            document.getElementById('note').style.display = 'block';

            window.domainData = data;

            updatePhishingTable(data);
        } else {
            alert(data.message || 'An error occurred while checking the domain.');
            $.LoadingOverlay("hide");
        }
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            alert('Network error. Please check your internet connection and try again.');
        } else {
            alert('An unexpected error occurred. Please try again later.');
        }
        $.LoadingOverlay("hide");
    }
}

$(document).ready(function () {

    phishingTable = $('#phishingDomainsTable').DataTable({
        responsive: true,
        pageLength: 10,
        order: [[0, 'asc']],
        columns: [
            {
                data: 'domain',
                width: '20%',
                render: function (data, type, row) {
                    if (type === 'display') {
                        const isLive = row.dns_a && row.dns_a.length > 0;
                        const liveIndicator = isLive ?
                            '<span class="live-indicator" title="Domain is live"></span>' :
                            '<span class="dead-indicator" title="Domain is not live"></span>';
                        return `<div class="domain-cell">${liveIndicator} ${data || '-'}</div>`;
                    }
                    return data || '-';
                }
            },
            {
                data: 'fuzzer',
                width: '10%',
                render: function (data) {
                    return `<div class="table-cell">${data || '-'}</div>`;
                }
            },
            {
                data: 'dns_ns',
                width: '20%',
                render: function (data) {
                    return `<div class="table-cell">${Array.isArray(data) ? data.join('<br>') : '-'}</div>`;
                }
            },
            {
                data: 'dns_a',
                width: '20%',
                render: function (data) {
                    return `<div class="table-cell">${Array.isArray(data) ? data.join('<br>') : '-'}</div>`;
                }
            },
            {
                data: 'dns_mx',
                width: '15%',
                render: function (data) {
                    if (!data || data.length === 0 || (data.length === 1 && data[0] === '')) {
                        return '<div class="table-cell">-</div>';
                    }
                    return `<div class="table-cell">${Array.isArray(data) ? data.join('<br>') : data}</div>`;
                }
            },
            {
                data: 'whois_created',
                width: '10%',
                render: function (data) {
                    return `<div class="table-cell">${data ? new Date(data).toLocaleDateString() : '-'}</div>`;
                }
            },
            {
                data: null,
                width: '15%',
                render: function (row) {
                    return `<div class="table-cell">${row.whois_registrar || '-'}</div>`;
                }
            }
        ],
        language: {
            search: "Search domains:",
            lengthMenu: "Show _MENU_ domains per page",
            info: "",
            infoEmpty: "",
            infoFiltered: ""
        },
        dom: '<"top"Bf>rt<"bottom"l<"datatable-paginate"p>><"clear">',
        buttons: [
            {
                extend: 'collection',
                text: 'Export',
                className: 'btn btn-primary export-btn',
                buttons: [
                    {
                        extend: 'csv',
                        text: 'CSV',
                        className: 'btn btn-light',
                        exportOptions: {
                            columns: ':visible'
                        }
                    },
                    {
                        extend: 'excel',
                        text: 'Excel',
                        className: 'btn btn-light',
                        exportOptions: {
                            columns: ':visible'
                        }
                    },
                    {
                        extend: 'pdf',
                        text: 'PDF',
                        className: 'btn btn-light',
                        exportOptions: {
                            columns: ':visible'
                        }
                    }
                ]
            }
        ],
        initComplete: function () {

            $('.dataTables_wrapper').css('color', '#fff');
            $('.dataTables_length').css('color', '#fff');
            $('.dataTables_filter').css({
                'color': '#fff',
                'margin-left': 'auto'
            });
            $('.dataTables_paginate').css('color', '#fff');
            $('.btn-light').css('color', '#000');


            $('.dt-buttons').css({
                'display': 'inline-block',
                'margin-right': '15px'
            });

            $('.dt-buttons .btn').css({
                'background-color': '#D63031',
                'border-color': '#D63031',
                'color': '#fff',
                'margin-right': '5px'
            });


            $('.dataTables_wrapper .top').css({
                'display': 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
                'margin-bottom': '15px'
            });
        },
        drawCallback: function () {

        }
    });


    const checkAnotherDomainBtn = document.getElementById('checkAnotherDomainBtn');
    if (checkAnotherDomainBtn) {
        checkAnotherDomainBtn.addEventListener('click', function () {
            window.location.href = 'index.html';
        });
    }


    const domain = getUrlParameter('domain');
    if (domain) {
        checkDomain(domain);
    } else {
        window.location.href = 'index.html';
    }
});


function updatePhishingTable(data) {
    if (!data || !data.raw_results || !Array.isArray(data.raw_results) || data.raw_results.length === 0) {
        phishingTable.clear().draw();
        $('#phishingDomainsTable_wrapper').hide();
        return;
    }

    phishingTable.clear();

    const processedData = data.raw_results.map(row => ({
        ...row,

        domain: row.domain || '',
        fuzzer: row.fuzzer || '',
        dns_ns: Array.isArray(row.dns_ns) ? row.dns_ns : [],
        dns_a: Array.isArray(row.dns_a) ? row.dns_a : [],
        dns_mx: Array.isArray(row.dns_mx) ? row.dns_mx : [],
        whois_created: row.whois_created || '',
        whois_registrar: row.whois_registrar || ''
    }));

    phishingTable.rows.add(processedData).draw();

    if (processedData.length > 0) {
        $('#phishingDomainsTable_wrapper').show();
    } else {
        $('#phishingDomainsTable_wrapper').hide();
    }
}

function clearPhishingTable() {
    phishingTable.clear().draw();
    $('#phishingDomainsTable_wrapper').hide();
}

$('#phishingDomainsTable_wrapper').hide();

$(window).off('resize');

$(window).off('resize'); 