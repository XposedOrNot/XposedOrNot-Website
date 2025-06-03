let phishingTable;

// Initialize Google Charts with gauge package
google.charts.load('current', { 'packages': ['gauge'] });

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z');
}

function calculateRiskScore(data) {
    // Risk factors:
    // 1. Number of live domains (higher = more risk)
    // 2. Ratio of live domains to total scanned (higher ratio = more risk)

    const liveDomains = data.total_live;
    const totalScanned = data.total_scanned;

    // Calculate base risk from live domains (0-70 points)
    const domainRisk = Math.min((liveDomains / 10) * 10, 70);

    // Calculate risk from live ratio (0-30 points)
    const liveRatio = liveDomains / totalScanned;
    const ratioRisk = Math.min(liveRatio * 30, 30);

    // Total risk score (0-100)
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

    // Add risk level text below the chart
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

    // Clear previous elements if they exist
    const existingElements = chartDiv.parentElement.querySelectorAll('.risk-level, .risk-score');
    existingElements.forEach(el => el.remove());

    riskLevelDiv.className = 'risk-level';
    chartDiv.parentElement.appendChild(riskLevelDiv);
}

// Utility to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

async function checkDomain(domain) {
    const API_ENDPOINT = 'https://xon-api-test-325858668484.us-west1.run.app/v1/domain-phishing/';
    try {
        // Get email and token from URL
        const email = getUrlParameter('email');
        const token = getUrlParameter('token');

        // Build API URL with query params
        let apiUrl = API_ENDPOINT + encodeURIComponent(domain);
        const params = [];
        if (email) params.push('email=' + encodeURIComponent(email));
        if (token) params.push('token=' + encodeURIComponent(token));
        if (params.length > 0) {
            apiUrl += '?' + params.join('&');
        }

        const response = await fetch(apiUrl);

        // Handle specific HTTP status codes
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
        if (!response.ok) {
            alert('An error occurred while checking the domain. Please try again.');
            $.LoadingOverlay("hide");
            return;
        }

        const data = await response.json();

        if (data.status === 'success') {
            // Update domain display
            document.getElementById('domain-display').textContent = domain;
            document.getElementById('last-exposure').textContent = formatDate(data.last_checked);

            // Update logo
            const logoImg = document.getElementById('logo');
            if (logoImg) {
                logoImg.src = `https://logo.clearbit.com/${domain}`;
                logoImg.onerror = function () {
                    // If logo fails to load, try alternative logo service
                    this.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                    this.onerror = function () {
                        // If both fail, hide the logo
                        this.style.display = 'none';
                    };
                };
                logoImg.style.display = 'inline-block';
            }

            // Update statistics
            document.getElementById('breach-count').textContent = data.total_scanned;
            document.getElementById('record-count').textContent = data.total_live;
            document.getElementById('email-count').textContent = data.unique_fuzzers || '-';

            // Calculate and display risk score
            const riskScore = calculateRiskScore(data);
            google.charts.setOnLoadCallback(() => {
                drawRiskMeter(riskScore);
                $.LoadingOverlay("hide"); // Hide loading overlay after chart is drawn
            });

            // Show results
            document.getElementById('content').classList.remove('blurred');
            document.getElementById('note').style.display = 'block';

            // Store domain data for detailed view
            window.domainData = data;
            // Update phishing table
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
    // Initialize DataTable with default options
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
            // Add custom styling for dark mode
            $('.dataTables_wrapper').css('color', '#fff');
            $('.dataTables_length').css('color', '#fff');
            $('.dataTables_filter').css({
                'color': '#fff',
                'margin-left': 'auto'
            });
            $('.dataTables_paginate').css('color', '#fff');
            $('.btn-light').css('color', '#000');

            // Style the export button
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

            // Style the top row
            $('.dataTables_wrapper .top').css({
                'display': 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
                'margin-bottom': '15px'
            });
        },
        drawCallback: function () {
            // Remove show more initialization
        }
    });

    // Handle "Check Another Domain" button
    const checkAnotherDomainBtn = document.getElementById('checkAnotherDomainBtn');
    if (checkAnotherDomainBtn) {
        checkAnotherDomainBtn.addEventListener('click', function () {
            window.location.href = 'index.html';
        });
    }

    // Get domain from URL and start check
    const domain = getUrlParameter('domain');
    if (domain) {
        checkDomain(domain);
    } else {
        window.location.href = 'index.html';
    }
});

// Function to update table with new data
function updatePhishingTable(data) {
    if (!data || !data.raw_results || !Array.isArray(data.raw_results) || data.raw_results.length === 0) {
        phishingTable.clear().draw();
        $('#phishingDomainsTable_wrapper').hide();
        return;
    }

    // Clear existing data
    phishingTable.clear();

    // Process and validate data before adding
    const processedData = data.raw_results.map(row => ({
        ...row,
        // Ensure all required fields exist
        domain: row.domain || '',
        fuzzer: row.fuzzer || '',
        dns_ns: Array.isArray(row.dns_ns) ? row.dns_ns : [],
        dns_a: Array.isArray(row.dns_a) ? row.dns_a : [],
        dns_mx: Array.isArray(row.dns_mx) ? row.dns_mx : [],
        whois_created: row.whois_created || '',
        whois_registrar: row.whois_registrar || ''
    }));

    // Add new data
    phishingTable.rows.add(processedData).draw();

    // Show/hide table based on data availability
    if (processedData.length > 0) {
        $('#phishingDomainsTable_wrapper').show();
    } else {
        $('#phishingDomainsTable_wrapper').hide();
    }
}

// Function to clear table
function clearPhishingTable() {
    phishingTable.clear().draw();
    $('#phishingDomainsTable_wrapper').hide();
}

// Initially hide the table wrapper
$('#phishingDomainsTable_wrapper').hide();

// Remove the show more related functions
// Remove createExpandableCell and initializeShowMore functions

// Remove the window resize handler for show more
$(window).off('resize');

// Remove the show more related functions
// Remove createExpandableCell and initializeShowMore functions

// Remove the window resize handler for show more
$(window).off('resize'); 