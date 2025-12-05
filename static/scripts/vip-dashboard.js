/**
 * VIP Dashboard JavaScript
 * Handles API calls and data display for executive VIP exposure data
 */

// Get email and token from URL parameters
$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results ? results[1] : 0;
};

var email, token;

try {
    email = decodeURIComponent($.urlParam('email'));
    token = decodeURIComponent($.urlParam('token'));
} catch (e) {
    window.location.replace("https://xposedornot.com");
}

// Validate authentication
if (!email || !token || email === '0' || token === '0') {
    alert('Authentication required. Please access this page from the main dashboard.');
    window.location.href = 'dashboard.html';
}

// Setup loading overlay (same as breach-dashboard)
$.LoadingOverlaySetup({
    background: "rgba(0, 0, 0, 0.5)",
    image: "static/images/shield-alt.svg",
    imageAnimation: "1s fadein",
    imageColor: "#6daae0"
});

// Configuration
var API_BASE_URL = 'https://xon-api-test.xposedornot.com/v1';

// Store domains list for dropdown
var availableDomains = [];

// DataTable instance
var vipTable = null;

$(document).ready(function() {
    // Set back to dashboard link with email and token
    $('#back-to-dashboard').attr('href', 'breach-dashboard.html?email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token));

    // Initialize DataTable
    initDataTable();

    // Setup filter event listeners
    setupFilterListeners();

    // Setup back to top button
    setupBackToTop();

    // Fetch initial data (all domains, all VIP levels)
    fetchVipData();
});

/**
 * Initialize DataTable with export options
 */
function initDataTable() {
    vipTable = $('#vip_table').DataTable({
        dom: '<"top"<"d-flex align-items-center justify-content-between"lB>f>rtip',
        buttons: [{
            extend: 'collection',
            text: 'Export',
            buttons: ['csv', 'excel', 'pdf']
        }],
        pageLength: 25,
        order: [[2, 'asc'], [0, 'asc']],
        responsive: true,
        scrollX: true,
        autoWidth: false,
        language: {
            emptyTable: "No VIP data available",
            zeroRecords: "No matching records found"
        },
        columnDefs: [
            { targets: 2, width: '150px' }
        ]
    });
}

/**
 * Setup event listeners for filter dropdowns
 */
function setupFilterListeners() {
    $('#domain-filter').on('change', function() {
        fetchVipData();
    });

    $('#vip-filter').on('change', function() {
        fetchVipData();
    });
}

/**
 * Setup back to top button
 */
function setupBackToTop() {
    var backToTop = $('.back-to-top');

    $(window).scroll(function() {
        if ($(this).scrollTop() > 300) {
            backToTop.addClass('visible');
        } else {
            backToTop.removeClass('visible');
        }
    });

    backToTop.click(function(e) {
        e.preventDefault();
        $('html, body').animate({ scrollTop: 0 }, 500);
    });
}

/**
 * Build API URL based on current filter selections
 */
function buildApiUrl() {
    var url = API_BASE_URL + '/domain-seniority?email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token);

    var selectedDomain = $('#domain-filter').val();
    var selectedVipLevel = $('#vip-filter').val();

    if (selectedDomain && selectedDomain !== 'all') {
        url += '&domain=' + encodeURIComponent(selectedDomain);
    }

    if (selectedVipLevel && selectedVipLevel !== 'all') {
        url += '&seniority=' + encodeURIComponent(selectedVipLevel);
    }

    return url;
}

/**
 * Fetch VIP data from API
 */
function fetchVipData() {
    $.LoadingOverlay("show");
    var apiUrl = buildApiUrl();

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                processApiResponse(response);
            } else {
                showError(response.message || 'Failed to fetch data');
                showEmptyState();
                updateMetrics({ total: 0, c_suite: 0, vp: 0, director: 0 });
            }
        },
        error: function(xhr, status, error) {
            console.error('API Error:', error);
            handleApiError(xhr);
        },
        complete: function() {
            // Always hide overlay when request completes
            $.LoadingOverlay("hide");
        }
    });
}

/**
 * Process API response based on response structure
 */
function processApiResponse(response) {
    // Check if this is a multi-domain response or single domain response
    if (response.domains) {
        // Multi-domain response (all domains)
        processMultiDomainResponse(response);
    } else if (response.domain && response.seniority_data) {
        // Single domain response
        processSingleDomainResponse(response);
    } else {
        showEmptyState();
        updateMetrics({ total: 0, c_suite: 0, vp: 0, director: 0 });
    }
}

/**
 * Process response when fetching all domains
 */
function processMultiDomainResponse(response) {
    var domains = response.domains;
    var domainNames = Object.keys(domains);

    // Populate domain dropdown (only on first load or if empty)
    if (availableDomains.length === 0) {
        availableDomains = domainNames;
        populateDomainDropdown(domainNames);
    }

    // Aggregate all VIP data
    var allVipData = [];
    var totalCounts = {
        c_suite: 0,
        vp: 0,
        director: 0,
        total: 0
    };

    domainNames.forEach(function(domainName) {
        var domainData = domains[domainName];
        if (domainData.seniority_data && domainData.seniority_data.length > 0) {
            domainData.seniority_data.forEach(function(item) {
                allVipData.push({
                    domain: domainName,
                    email: item.email,
                    seniority: item.seniority
                });
            });
        }

        // Aggregate counts
        if (domainData.counts) {
            totalCounts.c_suite += domainData.counts.c_suite || 0;
            totalCounts.vp += domainData.counts.vp || 0;
            totalCounts.director += domainData.counts.director || 0;
            totalCounts.total += domainData.counts.total || 0;
        }
    });

    // Update metrics
    updateMetrics(totalCounts);

    // Update table
    updateTable(allVipData);
}

/**
 * Process response for a single domain
 */
function processSingleDomainResponse(response) {
    var domainName = response.domain;
    var seniorityData = response.seniority_data || [];
    var counts = response.counts || {};

    // Build table data
    var tableData = seniorityData.map(function(item) {
        return {
            domain: domainName,
            email: item.email,
            seniority: item.seniority
        };
    });

    // Update metrics
    updateMetrics({
        c_suite: counts.c_suite || 0,
        vp: counts.vp || 0,
        director: counts.director || 0,
        total: counts.total || 0
    });

    // Update table
    updateTable(tableData);
}

/**
 * Populate domain dropdown with available domains
 */
function populateDomainDropdown(domains) {
    var $dropdown = $('#domain-filter');

    // Clear existing options except "All Domains"
    $dropdown.find('option:not(:first)').remove();

    // Add domain options
    domains.forEach(function(domain) {
        $dropdown.append('<option value="' + domain + '">' + domain + '</option>');
    });
}

/**
 * Update metrics display
 */
function updateMetrics(counts) {
    $('#metric-total').text(counts.total || 0);
    $('#metric-csuite').text(counts.c_suite || 0);
    $('#metric-vp').text(counts.vp || 0);
    $('#metric-director').text(counts.director || 0);
}

/**
 * Update table with VIP data
 */
function updateTable(data) {
    // Clear existing data
    vipTable.clear();

    if (data.length === 0) {
        showEmptyState();
        vipTable.draw();
        return;
    }

    // Hide empty state
    hideEmptyState();

    // Add rows to table
    data.forEach(function(item) {
        var vipBadge = getVipBadge(item.seniority);
        vipTable.row.add([
            item.domain,
            item.email,
            vipBadge
        ]);
    });

    // Redraw table
    vipTable.draw();
}

/**
 * Get HTML badge for VIP level
 */
function getVipBadge(seniority) {
    var vipLabels = {
        'c_suite': 'C-Suite',
        'vp': 'VP',
        'director': 'Director'
    };

    var label = vipLabels[seniority] || seniority;
    return '<span class="badge badge-vip-level badge-' + seniority + '">' + label + '</span>';
}

/**
 * Show empty state message
 */
function showEmptyState() {
    $('#empty-state').show();
    $('.table-responsive-wrapper').hide();
}

/**
 * Hide empty state message
 */
function hideEmptyState() {
    $('#empty-state').hide();
    $('.table-responsive-wrapper').show();
}

/**
 * Handle API errors
 */
function handleApiError(xhr) {
    var errorMessage = 'An error occurred while fetching data.';

    switch (xhr.status) {
        case 400:
        case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 2000);
            break;
        case 404:
            errorMessage = 'No data found for the selected filters.';
            showEmptyState();
            updateMetrics({ total: 0, c_suite: 0, vp: 0, director: 0 });
            return;
        case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
        case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
    }

    showError(errorMessage);
}

/**
 * Show error message
 */
function showError(message) {
    // Create toast notification
    var toast = $('<div class="toast-notification" style="' +
        'position: fixed;' +
        'top: 20px;' +
        'right: 20px;' +
        'background: #e74c3c;' +
        'color: white;' +
        'padding: 15px 25px;' +
        'border-radius: 8px;' +
        'box-shadow: 0 4px 15px rgba(0,0,0,0.2);' +
        'z-index: 9999;' +
        'font-weight: 500;' +
        '">' +
        '<i class="fas fa-exclamation-circle mr-2"></i>' + message +
        '</div>');

    $('body').append(toast);

    // Remove after 5 seconds
    setTimeout(function() {
        toast.fadeOut(300, function() {
            $(this).remove();
        });
    }, 5000);
}
