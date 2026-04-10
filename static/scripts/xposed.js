var breachesTable;
var allBreaches = [];
var defaultLogo = 'https://xposedornot.com/static/logos/combolist.png';

function formatWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    var date = new Date(dateStr);
    var options = { year: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

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

function getStatusBadges(breach) {
    var badges = '';
    if (!breach.verified) {
        badges += '<span class="status-badge not-verified"><i class="fas fa-times"></i> Not Verified</span>';
    }
    if (!breach.searchable) {
        badges += '<span class="status-badge sensitive"><i class="fas fa-exclamation-triangle"></i> Sensitive</span>';
    }
    if (!badges) {
        badges = '<span class="status-badge verified"><i class="fas fa-check"></i> Verified</span>';
    }
    return '<div class="status-badges">' + badges + '</div>';
}

function getLatestAddedDate(breaches) {
    var latest = '';
    breaches.forEach(function(b) {
        if (b.addedDate && b.addedDate > latest) latest = b.addedDate;
    });
    return latest;
}

function updateStats(breaches) {
    var totalBreaches = breaches.length;
    var totalRecords = breaches.reduce(function(sum, b) { return sum + (b.exposedRecords || 0); }, 0);

    var industries = {};
    breaches.forEach(function(b) {
        if (b.industry) industries[b.industry] = true;
    });
    var totalIndustries = Object.keys(industries).length;

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

    updateSEO(totalBreaches, totalIndustries, getLatestAddedDate(breaches));
}

function updateSEO(totalBreaches, totalIndustries, latestDate) {
    var count = formatWithCommas(totalBreaches);
    var countPlus = totalBreaches + '+';

    document.title = 'Data Breach Directory & Database: Browse ' + countPlus + ' Known Breaches | XposedOrNot';

    var descText = 'Browse our complete directory of ' + countPlus + ' data breaches across ' + totalIndustries +
        ' industries. Search by company, date, or data type exposed. Free breach database with record counts, risk levels, and details.';
    $('meta[name="description"]').attr('content', descText);
    $('meta[property="og:title"]').attr('content', document.title);
    $('meta[property="og:description"]').attr('content', descText);
    $('meta[name="twitter:title"]').attr('content', document.title);
    $('meta[name="twitter:description"]').attr('content', descText);

    $('#seo-breach-count').text(count);
    $('#seo-industry-count').text(totalIndustries);

    if (latestDate) {
        var d = new Date(latestDate);
        var isoDate = d.toISOString().split('T')[0];
        var displayDate = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

        $('#seo-last-updated').html(
            '<i class="far fa-calendar-alt" aria-hidden="true"></i> Last updated: ' +
            '<time datetime="' + isoDate + '">' + displayDate + '</time>'
        );

        var wpSchema = document.getElementById('webpage-schema');
        if (wpSchema) {
            try {
                var data = JSON.parse(wpSchema.textContent);
                data.dateModified = isoDate;
                wpSchema.textContent = JSON.stringify(data);
            } catch (e) {}
        }
    }
}

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
            { data: 'date', title: "Breach Date", width: "90px", orderData: 12 },
            { data: 'risk', title: "Password Risk", width: "110px" },
            { data: 'status', title: "Status", width: "150px", orderable: false },
            { data: 'action', title: "Action", width: "90px", orderable: false },
            { data: '_industry', visible: false },
            { data: '_year', visible: false },
            { data: '_risk', visible: false },
            { data: '_records', visible: false },
            { data: '_dateSort', visible: false }
        ],
        order: [[4, 'desc']],
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
            loadVisibleLogos();
        }
    });
}

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
                $img.data('loaded', true);
            };
            img.src = src;
        }
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyFilters() {
    if (!breachesTable) return;

    var searchText = $('#filter-search').val();
    var industry = $('#filter-industry').val();
    var year = $('#filter-year').val();
    var risk = $('#filter-risk').val();

    breachesTable.columns().search('');

    breachesTable.search(searchText);

    if (industry) {
        breachesTable.column(8).search('^' + escapeRegex(industry) + '$', true, false);
    }
    if (year) {
        breachesTable.column(9).search('^' + escapeRegex(year) + '$', true, false);
    }
    if (risk) {
        breachesTable.column(10).search('^' + escapeRegex(risk) + '$', true, false);
    }

    breachesTable.draw();

    var filteredCount = breachesTable.rows({ search: 'applied' }).count();
    $('#total-count').text(formatWithCommas(filteredCount));
}

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

$(document).ready(function() {
    $.ajax({
        url: 'https://api.xposedornot.com/v1/breaches',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.exposedBreaches) {
                allBreaches = response.exposedBreaches;

                updateStats(allBreaches);

                populateIndustryFilter(allBreaches);
                populateYearFilter(allBreaches);

                $('#loading-overlay').hide();
                $('#table-container').show();

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

    $('#filter-search').on('keyup', function() {
        clearTimeout($.data(this, 'timer'));
        var wait = setTimeout(applyFilters, 300);
        $(this).data('timer', wait);
    });

    $('#filter-industry, #filter-year, #filter-risk').on('change', applyFilters);

    $('#btn-reset').on('click', resetFilters);
});
