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
    showAuthModal('Authentication required. Please access this page from the main dashboard.');
}

/**
 * Show authentication modal with countdown and redirect
 */
function showAuthModal(message, redirectUrl) {
    redirectUrl = redirectUrl || 'dashboard.html';

    // Wait for DOM to be ready
    $(function() {
        $('#auth-modal-message').text(message);
        $('#auth-modal').show();

        // Reset and start progress bar animation
        var progressBar = $('#auth-progress-bar');
        progressBar.css('animation', 'none');
        progressBar[0].offsetHeight; // Trigger reflow
        progressBar.css('animation', 'progressShrink 5s linear forwards');

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

// Setup loading overlay (same as breach-dashboard)
$.LoadingOverlaySetup({
    background: "rgba(0, 0, 0, 0.5)",
    image: "static/images/shield-alt.svg",
    imageAnimation: "1s fadein",
    imageColor: "#6daae0"
});

// Configuration
var API_BASE_URL = 'https://api.xposedornot.com/v1';

// Store domains list for dropdown
var availableDomains = [];

// DataTable instance
var vipTable = null;

// Custom DataTables sorting for data-sort attribute
$.fn.dataTable.ext.type.order['html-data-sort-pre'] = function(data) {
    var match = data.match(/data-sort="([^"]+)"/);
    return match ? match[1] : data;
};

$(document).ready(function() {
    // Set back to dashboard links with email and token
    var dashboardUrl = 'breach-dashboard.html?email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token);
    $('#back-to-dashboard').attr('href', dashboardUrl);
    $('#headerBackBtn').attr('href', dashboardUrl).on('click', function(e) {
        e.preventDefault();
        window.location.href = dashboardUrl;
    });

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
        order: [[4, 'desc'], [0, 'asc']],  // Sort by breach date (newest first), then domain
        responsive: true,
        scrollX: true,
        autoWidth: false,
        language: {
            emptyTable: "No VIP data available",
            zeroRecords: "No matching records found"
        },
        columnDefs: [
            { targets: 0, width: '120px' },  // Domain
            { targets: 1, width: '200px' },  // Email
            { targets: 2, width: '100px' },  // VIP Level
            { targets: 3, width: '150px' },  // Breach Name
            {
                targets: 4,
                width: '120px',
                type: 'html-data-sort'  // Use data-sort attribute for sorting
            },
            { targets: 5, width: '200px' }   // Exposed Data
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
                var breaches = item.breaches || [];
                if (breaches.length === 0) {
                    // No breaches - still show the person
                    allVipData.push({
                        domain: domainName,
                        email: item.email,
                        seniority: item.seniority,
                        breach_name: null,
                        breach_date: null,
                        xposed_data: []
                    });
                } else {
                    // One row per breach
                    breaches.forEach(function(breach) {
                        allVipData.push({
                            domain: domainName,
                            email: item.email,
                            seniority: item.seniority,
                            breach_name: breach.breach_name,
                            breach_date: breach.breach_date,
                            xposed_data: breach.xposed_data || []
                        });
                    });
                }
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

    // Build table data - one row per breach
    var tableData = [];
    seniorityData.forEach(function(item) {
        var breaches = item.breaches || [];
        if (breaches.length === 0) {
            // No breaches - still show the person
            tableData.push({
                domain: domainName,
                email: item.email,
                seniority: item.seniority,
                breach_name: null,
                breach_date: null,
                xposed_data: []
            });
        } else {
            // One row per breach
            breaches.forEach(function(breach) {
                tableData.push({
                    domain: domainName,
                    email: item.email,
                    seniority: item.seniority,
                    breach_name: breach.breach_name,
                    breach_date: breach.breach_date,
                    xposed_data: breach.xposed_data || []
                });
            });
        }
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
        var breachName = formatBreachName(item.breach_name);
        var breachDate = formatBreachDate(item.breach_date);
        var exposedData = formatExposedData(item.xposed_data);

        vipTable.row.add([
            item.domain,
            item.email,
            vipBadge,
            breachName,
            breachDate,
            exposedData
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
 * Format single breach name with link
 */
function formatBreachName(breachName) {
    if (!breachName) {
        return '<span class="text-muted">No breaches</span>';
    }

    var breachUrl = 'https://xposedornot.com/breach#' + encodeURIComponent(breachName);
    return '<a href="' + breachUrl + '" target="_blank" class="badge badge-danger breach-link">' +
           escapeHtml(breachName) + ' <i class="fas fa-external-link-alt fa-xs"></i></a>';
}

/**
 * Format single breach date with sortable value
 */
function formatBreachDate(breachDate) {
    if (!breachDate) {
        return '<span class="text-muted" data-sort="0">-</span>';
    }

    var sortValue = parseDateToSortable(breachDate);
    return '<span class="badge badge-secondary" data-sort="' + sortValue + '">' + escapeHtml(breachDate) + '</span>';
}

/**
 * Convert date string like "November 2018" to sortable format "201811"
 */
function parseDateToSortable(dateStr) {
    var months = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };

    var parts = dateStr.toLowerCase().split(' ');
    if (parts.length === 2) {
        var month = months[parts[0]] || '01';
        var year = parts[1];
        return year + month;
    }
    return '000000';
}

/**
 * Format exposed data types as HTML badges with emojis
 */
function formatExposedData(xposedData) {
    if (!xposedData || xposedData.length === 0) {
        return '<span class="text-muted">-</span>';
    }

    // Get unique data types
    var uniqueData = [];
    xposedData.forEach(function(dataType) {
        if (uniqueData.indexOf(dataType) === -1) {
            uniqueData.push(dataType);
        }
    });

    var html = '<div class="exposed-data-list">';
    uniqueData.forEach(function(dataType) {
        var emoji = getDataTypeEmoji(dataType);
        html += '<span class="badge badge-exposed mr-1 mb-1">' + emoji + ' ' + escapeHtml(dataType) + '</span>';
    });
    html += '</div>';
    return html;
}

/**
 * Get emoji for exposed data type
 */
function getDataTypeEmoji(dataType) {
    var lowerType = dataType.toLowerCase();

    // Personal Identification
    if (lowerType.includes('name') || lowerType.includes('gender') ||
        lowerType.includes('photo') || lowerType.includes('avatar') ||
        lowerType.includes('nationality') || lowerType.includes('birth')) {
        return '👤';
    }

    // Communication
    if (lowerType.includes('email') || lowerType.includes('phone') ||
        lowerType.includes('messenger') || lowerType.includes('message')) {
        return '📧';
    }

    // Security
    if (lowerType.includes('password') || lowerType.includes('security question') ||
        lowerType.includes('credential')) {
        return '🔒';
    }

    // Financial
    if (lowerType.includes('credit') || lowerType.includes('bank') ||
        lowerType.includes('payment') || lowerType.includes('financial') ||
        lowerType.includes('balance')) {
        return '💳';
    }

    // Geographic/Location
    if (lowerType.includes('address') || lowerType.includes('location') ||
        lowerType.includes('geographic') || lowerType.includes('city') ||
        lowerType.includes('country') || lowerType.includes('zip')) {
        return '📍';
    }

    // Social Media
    if (lowerType.includes('social media') || lowerType.includes('social connection') ||
        lowerType.includes('profile')) {
        return '🌐';
    }

    // Employment/Education
    if (lowerType.includes('employer') || lowerType.includes('occupation') ||
        lowerType.includes('job') || lowerType.includes('education') ||
        lowerType.includes('work')) {
        return '🎓';
    }

    // Device/Network
    if (lowerType.includes('ip address') || lowerType.includes('device') ||
        lowerType.includes('browser') || lowerType.includes('user agent')) {
        return '🖥️';
    }

    // Health
    if (lowerType.includes('health') || lowerType.includes('medical') ||
        lowerType.includes('fitness')) {
        return '🩺';
    }

    // Demographics
    if (lowerType.includes('age') || lowerType.includes('ethnicit') ||
        lowerType.includes('marital')) {
        return '👥';
    }

    // Default
    return '📋';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
            showAuthModal('Your session has expired or is invalid. Please log in again to continue.');
            return;
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
