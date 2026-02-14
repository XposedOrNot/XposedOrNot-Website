// Global variables
var breachesTable;
var allBreaches = [];
var defaultLogo = 'https://xposedornot.com/static/logos/combolist.png';

// Format number with commas
function formatWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    var date = new Date(dateStr);
    var options = { year: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

// Get risk badge HTML
function getRiskBadge(risk) {
    var riskClass = risk || 'unknown';
    var riskLabels = {
        'plaintext': 'Plain Text',
        'easytocrack': 'Easy to Crack',
        'hardtocrack': 'Hard to Crack',
        'unknown': 'Unknown'
    };
    return '<span class="risk-badge ' + riskClass + '">' + (riskLabels[riskClass] || 'Unknown') + '</span>';
}

// Get status badges HTML
function getStatusBadges(breach) {
    var badges = '';
    if (breach.verified) {
        badges += '<span class="status-badge verified"><i class="fas fa-check"></i> Verified</span>';
    } else {
        badges += '<span class="status-badge not-verified"><i class="fas fa-times"></i> Not Verified</span>';
    }
    if (breach.searchable) {
        badges += '<span class="status-badge searchable"><i class="fas fa-search"></i> Searchable</span>';
    } else {
        badges += '<span class="status-badge sensitive"><i class="fas fa-exclamation-triangle"></i> Sensitive</span>';
    }
    return '<div class="status-badges">' + badges + '</div>';
}

// Update stats
function updateStats(breaches) {
    var totalBreaches = breaches.length;
    var totalRecords = breaches.reduce(function(sum, b) { return sum + (b.exposedRecords || 0); }, 0);

    // Get unique industries
    var industries = {};
    breaches.forEach(function(b) {
        if (b.industry) industries[b.industry] = true;
    });
    var totalIndustries = Object.keys(industries).length;

    // Get recent breaches (this year)
    var currentYear = new Date().getFullYear();
    var recentBreaches = breaches.filter(function(b) {
        if (!b.breachedDate) return false;
        return new Date(b.breachedDate).getFullYear() === currentYear;
    }).length;

    $('#stat-total').text(formatWithCommas(totalBreaches));
    $('#stat-records').text(formatWithCommas(totalRecords));
    $('#stat-industries').text(totalIndustries);
    $('#stat-recent').text(recentBreaches);
    $('#total-count').text(formatWithCommas(totalBreaches));
}

// Populate industry filter
function populateIndustryFilter(breaches) {
    var industries = {};
    breaches.forEach(function(b) {
        if (b.industry) industries[b.industry] = true;
    });

    var sortedIndustries = Object.keys(industries).sort();
    var $select = $('#filter-industry');

    sortedIndustries.forEach(function(industry) {
        $select.append('<option value="' + industry + '">' + industry + '</option>');
    });
}

// Populate year filter
function populateYearFilter(breaches) {
    var years = {};
    breaches.forEach(function(b) {
        if (b.breachedDate) {
            var year = new Date(b.breachedDate).getFullYear();
            years[year] = true;
        }
    });

    var sortedYears = Object.keys(years).sort().reverse();
    var $select = $('#filter-year');

    sortedYears.forEach(function(year) {
        $select.append('<option value="' + year + '">' + year + '</option>');
    });
}

// Initialize DataTable
function initDataTable(breaches) {
    var tableData = breaches.map(function(breach) {
        var logoSrc = breach.logo || defaultLogo;
        var logoHtml = '<img src="' + defaultLogo + '" data-src="' + logoSrc + '" ' +
                       'alt="' + breach.breachID + '" class="breach-logo lazy-logo">';

        var nameHtml = '<a href="breach.html#' + breach.breachID + '" target="_blank" rel="noopener noreferrer" class="breach-name-link">' +
                       '<div class="breach-name">' + breach.breachID +
                       '<i class="fas fa-chevron-right breach-chevron" aria-hidden="true"></i></div>' +
                       '<div class="breach-domain">' + (breach.domain || '-') + '</div>' +
                       '<span class="sr-only">(opens in new tab)</span>' +
                       '</a>';

        var industryHtml = '<span class="industry-badge">' + (breach.industry || 'Unknown') + '</span>';

        var recordsHtml = '<span class="records-count">' + formatWithCommas(breach.exposedRecords || 0) + '</span>';

        var dateHtml = '<span class="breach-date">' + formatDate(breach.breachedDate) + '</span>';

        var riskHtml = getRiskBadge(breach.passwordRisk);

        var statusHtml = getStatusBadges(breach);

        var actionsHtml = '<a href="breach.html#' + breach.breachID + '" target="_blank" rel="noopener noreferrer" class="btn-details">' +
                          '<i class="fas fa-eye" aria-hidden="true"></i> Details<span class="sr-only">(opens in new tab)</span></a>';

        // Hidden data for filtering
        var breachYear = breach.breachedDate ? new Date(breach.breachedDate).getFullYear().toString() : '';

        return {
            logo: logoHtml,
            name: nameHtml,
            industry: industryHtml,
            records: recordsHtml,
            date: dateHtml,
            risk: riskHtml,
            status: statusHtml,
            action: actionsHtml,
            // Hidden data for filtering
            _industry: breach.industry || '',
            _year: breachYear,
            _risk: breach.passwordRisk || '',
            _records: breach.exposedRecords || 0,
            _dateSort: breach.breachedDate || ''
        };
    });

    breachesTable = $('#breachesTable').DataTable({
        data: tableData,
        columns: [
            { data: 'logo', title: "Logo", width: "50px", orderable: false },
            { data: 'name', title: "Breach", width: "180px" },
            { data: 'industry', title: "Industry", width: "120px" },
            { data: 'records', title: "Records", width: "100px", orderData: 11 },
            { data: 'date', title: "Date", width: "90px", orderData: 12 },
            { data: 'risk', title: "Password Risk", width: "110px" },
            { data: 'status', title: "Status", width: "150px", orderable: false },
            { data: 'action', title: "Action", width: "90px", orderable: false },
            { data: '_industry', visible: false },
            { data: '_year', visible: false },
            { data: '_risk', visible: false },
            { data: '_records', visible: false },
            { data: '_dateSort', visible: false }
        ],
        order: [[4, 'desc']], // Sort by date descending
        pageLength: -1,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        language: {
            lengthMenu: "Show _MENU_ breaches",
            info: "Showing _START_ to _END_ of _TOTAL_ breaches",
            infoEmpty: "No breaches found",
            infoFiltered: "(filtered from _MAX_ total)",
            paginate: {
                first: '<i class="fas fa-angle-double-left"></i>',
                last: '<i class="fas fa-angle-double-right"></i>',
                next: '<i class="fas fa-angle-right"></i>',
                previous: '<i class="fas fa-angle-left"></i>'
            }
        },
        dom: '<"top"l>rt<"bottom"ip>',
        drawCallback: function() {
            // Lazy load logos after draw
            loadVisibleLogos();
        }
    });
}

// Lazy load logos to prevent flickering
function loadVisibleLogos() {
    $('.lazy-logo').each(function() {
        var $img = $(this);
        var src = $img.data('src');
        if (src && src !== defaultLogo && !$img.data('loaded')) {
            var img = new Image();
            img.onload = function() {
                $img.attr('src', src);
                $img.data('loaded', true);
            };
            img.onerror = function() {
                $img.data('loaded', true); // Keep default
            };
            img.src = src;
        }
    });
}

// Escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Apply filters using DataTable's built-in search
function applyFilters() {
    if (!breachesTable) return;

    var searchText = $('#filter-search').val();
    var industry = $('#filter-industry').val();
    var year = $('#filter-year').val();
    var risk = $('#filter-risk').val();

    // Clear all column searches first
    breachesTable.columns().search('');

    // Apply global search
    breachesTable.search(searchText);

    // Apply column-specific filters (using hidden columns)
    if (industry) {
        breachesTable.column(8).search('^' + escapeRegex(industry) + '$', true, false);
    }
    if (year) {
        breachesTable.column(9).search('^' + escapeRegex(year) + '$', true, false);
    }
    if (risk) {
        breachesTable.column(10).search('^' + escapeRegex(risk) + '$', true, false);
    }

    // Redraw table
    breachesTable.draw();

    // Update count
    var filteredCount = breachesTable.rows({ search: 'applied' }).count();
    $('#total-count').text(formatWithCommas(filteredCount));
}

// Reset filters
function resetFilters() {
    $('#filter-search').val('');
    $('#filter-industry').val('');
    $('#filter-year').val('');
    $('#filter-risk').val('');

    if (breachesTable) {
        breachesTable.search('').columns().search('').draw();
        $('#total-count').text(formatWithCommas(allBreaches.length));
    }
}

// Fetch and display breaches
$(document).ready(function() {
    $.ajax({
        url: 'https://api.xposedornot.com/v1/breaches',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.exposedBreaches) {
                allBreaches = response.exposedBreaches;

                // Update stats
                updateStats(allBreaches);

                // Populate filters
                populateIndustryFilter(allBreaches);
                populateYearFilter(allBreaches);

                // Hide loading, show table
                $('#loading-overlay').hide();
                $('#table-container').show();

                // Initialize DataTable
                initDataTable(allBreaches);
            }
        },
        error: function(xhr, status, error) {
            console.error('Failed to fetch breaches:', error);
            $('#loading-overlay').html(
                '<div class="text-center">' +
                '<i class="fas fa-exclamation-circle fa-3x" style="color: var(--danger-color);"></i>' +
                '<p class="mt-3" style="color: var(--text-secondary);">Failed to load breaches. Please try again later.</p>' +
                '</div>'
            );
        }
    });

    // Filter event listeners
    $('#filter-search').on('keyup', function() {
        clearTimeout($.data(this, 'timer'));
        var wait = setTimeout(applyFilters, 300);
        $(this).data('timer', wait);
    });

    $('#filter-industry, #filter-year, #filter-risk').on('change', applyFilters);

    $('#btn-reset').on('click', resetFilters);
});
