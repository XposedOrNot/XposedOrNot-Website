/**
 * XposedOrNot - Breach Comparison Tool
 * Compare breach exposure between two emails
 */

'use strict';

// Utility Functions
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function validateEmail(email) {
    // Max length check to prevent DoS
    if (!email || email.length > 254) return false;
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

/**
 * Format data type labels with proper capitalization
 * Handles special cases like IP, DOB, SSN, etc.
 */
function formatDataTypeLabel(type) {
    // Special cases that should be uppercase
    const upperCaseWords = ['ip', 'dob', 'ssn', 'pin', 'url', 'id', 'imei', 'mac'];

    // Replace underscores with spaces and split into words
    const words = type.replace(/_/g, ' ').toLowerCase().split(' ');

    // Capitalize each word, with special handling for acronyms
    const formatted = words.map(word => {
        if (upperCaseWords.includes(word)) {
            return word.toUpperCase();
        }
        // Regular title case
        return word.charAt(0).toUpperCase() + word.slice(1);
    });

    return formatted.join(' ');
}

/**
 * Sanitize value for CSV export to prevent CSV injection
 * Prefixes dangerous characters with single quote
 */
function sanitizeCSV(value) {
    if (typeof value !== 'string') return value;
    // CSV injection prevention: prefix formula characters
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n'];
    let sanitized = value;
    if (dangerousChars.some(char => sanitized.startsWith(char))) {
        sanitized = "'" + sanitized;
    }
    // Escape double quotes by doubling them
    return sanitized.replace(/"/g, '""');
}

// Setup Loading Overlay
$.LoadingOverlaySetup({
    background: "rgba(0, 0, 0, 0.5)",
    image: "/static/images/shield-alt.svg",
    imageAnimation: "1s fadein",
    imageColor: "#6daae0",
    text: "Checking breaches...",
    textColor: "#fff",
    textResizeFactor: 0.2
});

// Register Chart.js plugins
Chart.register(ChartDataLabels);

// Global state
let comparisonData = {
    emailA: null,
    emailB: null,
    dataA: null,
    dataB: null,
    breachesA: new Set(),
    breachesB: new Set(),
    sharedBreaches: new Set(),
    onlyA: new Set(),
    onlyB: new Set(),
    allBreaches: new Map()
};

// Chart instances
let dataTypesChart = null;
let timelineChart = null;

// DataTable instance
let comparisonDataTable = null;

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// Turnstile state
let turnstileToken = null;
let turnstileWidgetId = null;
let turnstileRendered = false;
let pendingComparison = null;
const TURNSTILE_SITE_KEY = '0x4AAAAAAAA_T_0Qt4kJbXno';

/**
 * Initialize Cloudflare Turnstile - called when script loads
 */
function initTurnstile() {
    // Just mark as ready, we'll render when modal opens
    console.log('Turnstile API loaded');
}

/**
 * Show Turnstile error message
 */
function showTurnstileError(message) {
    $('#turnstileLoading').html(`
        <div class="turnstile-spinner">
            <i class="fas fa-exclamation-triangle text-warning"></i>
        </div>
        <p class="text-danger">${escapeHtml(message)}</p>
        <small class="text-muted">Please close and try again</small>
    `).show();
}

/**
 * Render Turnstile widget in the modal
 */
function renderTurnstileInModal() {
    try {
        // Hide loading, show widget
        $('#turnstileLoading').hide();

        if (typeof turnstile === 'undefined') {
            showTurnstileError('Verification unavailable. Please refresh the page.');
            return;
        }

        // Remove existing widget if any
        if (turnstileWidgetId !== null) {
            try {
                turnstile.remove(turnstileWidgetId);
            } catch (e) {
                // Ignore removal errors
            }
        }

        // Clear the container
        $('#turnstileWidget').empty();

        // Render new widget
        turnstileWidgetId = turnstile.render('#turnstileWidget', {
            sitekey: TURNSTILE_SITE_KEY,
            theme: document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
            callback: function(token) {
                turnstileToken = token;
                // Close modal and proceed with comparison
                $('#turnstileModal').modal('hide');
                if (pendingComparison) {
                    executeComparison(pendingComparison.email1, pendingComparison.email2);
                    pendingComparison = null;
                }
            },
            'expired-callback': function() {
                turnstileToken = null;
            },
            'error-callback': function() {
                turnstileToken = null;
                showTurnstileError('Verification failed. Please try again.');
            }
        });

        turnstileRendered = true;
    } catch (e) {
        console.error('Error rendering Turnstile:', e);
        showTurnstileError('Verification error. Please refresh the page.');
    }
}

/**
 * Reset Turnstile widget
 */
function resetTurnstile() {
    turnstileToken = null;
    turnstileRendered = false;
    pendingComparison = null;
}

/**
 * Update compare button state based on email validation only
 */
function updateCompareButtonState() {
    const email1Valid = validateEmail($('#email1').val().trim());
    const email2Valid = validateEmail($('#email2').val().trim());

    $('#btnCompare').prop('disabled', !(email1Valid && email2Valid));
}

/**
 * Trigger confetti celebration
 */
function triggerConfetti() {
    // Check if confetti library is loaded
    if (typeof confetti !== 'function') {
        console.warn('Confetti library not loaded');
        return;
    }

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confetti from both sides
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#27ae60', '#2ecc71', '#417ff9', '#6ca0fc', '#f1c40f']
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#27ae60', '#2ecc71', '#417ff9', '#6ca0fc', '#f1c40f']
        });
    }, 250);
}

/**
 * Show celebration for no breaches found
 */
function showCelebration() {
    // Hide results section if visible
    $('#resultsSection').hide();

    // Populate email badges with tooltips for full email
    $('#celebrateEmailA').text(truncateEmail(comparisonData.emailA, 25)).attr('title', comparisonData.emailA);
    $('#celebrateEmailB').text(truncateEmail(comparisonData.emailB, 25)).attr('title', comparisonData.emailB);

    // Show celebration section
    $('#celebrationSection').fadeIn(300);

    // Scroll to celebration
    $('html, body').animate({
        scrollTop: $('#celebrationSection').offset().top - 20
    }, 500);

    // Trigger confetti after a short delay
    setTimeout(triggerConfetti, 300);
}

// DOM Ready
$(document).ready(function() {
    initializeInputValidation();
    initializeCompareButton();
    initializeExportButtons();
    fetchDatabaseMetrics();
    clearUrlParams();
    handlePageState();

    // Focus on first email input
    setTimeout(() => {
        $('#email1').focus();
    }, 100);
});

/**
 * Handle page state on load/back navigation
 * Ensures results are hidden if inputs are empty (e.g., after browser back)
 */
function handlePageState() {
    // Check if inputs have values on page load
    const email1 = $('#email1').val().trim();
    const email2 = $('#email2').val().trim();

    // If results are visible but inputs are empty, hide results
    if ((!email1 || !email2) && ($('#resultsSection').is(':visible') || $('#celebrationSection').is(':visible'))) {
        $('#resultsSection').hide();
        $('#celebrationSection').hide();
    }

    // Handle browser back/forward navigation
    $(window).on('pageshow', function(event) {
        // pageshow fires on back/forward navigation
        if (event.originalEvent.persisted) {
            const email1 = $('#email1').val().trim();
            const email2 = $('#email2').val().trim();

            if (!email1 || !email2) {
                $('#resultsSection').hide();
                $('#celebrationSection').hide();
            }

            // Re-validate inputs
            updateCompareButtonState();
        }
    });
}

/**
 * Fetch and display database metrics
 */
function fetchDatabaseMetrics() {
    $.ajax({
        url: 'https://api.xposedornot.com/v1/metrics/detailed',
        method: 'GET',
        timeout: 5000
    }).done(function(data) {
        if (data && data.Breaches_Count && data.Breaches_Records) {
            const breachCount = parseInt(data.Breaches_Count, 10).toLocaleString();
            const recordCount = parseInt(data.Breaches_Records, 10).toLocaleString();
            $('#breachCount').text(breachCount);
            $('#recordCount').text(recordCount);
        }
    }).fail(function() {
        // Hide stats line on error
        $('#databaseStats').hide();
    });
}

/**
 * Initialize input validation
 */
function initializeInputValidation() {
    const $email1 = $('#email1');
    const $email2 = $('#email2');
    const $btnCompare = $('#btnCompare');

    function validateInputs() {
        const email1Valid = validateEmail($email1.val().trim());
        const email2Valid = validateEmail($email2.val().trim());

        $email1.css('border-color', $email1.val() ? (email1Valid ? '#27ae60' : '#e74c3c') : '');
        $email2.css('border-color', $email2.val() ? (email2Valid ? '#27ae60' : '#e74c3c') : '');

        // Use the centralized button state function
        updateCompareButtonState();
    }

    $email1.on('input', validateInputs);
    $email2.on('input', validateInputs);

    // Handle Enter key
    $email1.on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            const email1Valid = validateEmail($email1.val().trim());
            const email2Val = $email2.val().trim();

            if (email1Valid && !email2Val) {
                // Email1 valid but email2 empty - move to email2
                $email2.focus();
            } else if (!$btnCompare.prop('disabled')) {
                // Both valid - trigger compare
                $btnCompare.click();
            }
        }
    });

    $email2.on('keypress', function(e) {
        if (e.which === 13 && !$btnCompare.prop('disabled')) {
            e.preventDefault();
            $btnCompare.click();
        }
    });
}

/**
 * Initialize compare button
 */
function initializeCompareButton() {
    $('#btnCompare').on('click', function() {
        const email1 = $('#email1').val().trim().toLowerCase();
        const email2 = $('#email2').val().trim().toLowerCase();

        // Validate both emails are provided
        if (!email1 || !email2) {
            showError('Please enter both email addresses to compare.');
            return;
        }

        // Validate email formats
        if (!validateEmail(email1)) {
            showError('Please enter a valid first email address.');
            $('#email1').focus();
            return;
        }

        if (!validateEmail(email2)) {
            showError('Please enter a valid second email address.');
            $('#email2').focus();
            return;
        }

        if (email1 === email2) {
            showError('Please enter two different email addresses to compare.');
            return;
        }

        compareBreaches(email1, email2);
    });
}

/**
 * Clear any URL parameters for privacy - emails should not persist in URL
 */
function clearUrlParams() {
    // If URL has any parameters, clear them for privacy
    if (window.location.search) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
    }
}

/**
 * Show error message
 */
function showError(message) {
    const $error = $('#errorMessage');
    $error.html('<i class="fas fa-exclamation-circle"></i> ' + escapeHtml(message)).show();

    // Keep rate limit errors visible longer
    const timeout = message.includes('Too many requests') ? 15000 : 5000;
    setTimeout(() => $error.fadeOut(), timeout);
}

/**
 * Main comparison function - shows Turnstile modal first
 */
function compareBreaches(email1, email2) {
    // Client-side rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        showError('Please wait a moment before comparing again.');
        return;
    }

    // Store pending comparison details
    pendingComparison = { email1, email2 };

    // Show loading indicator and reset widget container
    $('#turnstileLoading').html(`
        <div class="turnstile-spinner">
            <i class="fas fa-shield-alt"></i>
        </div>
        <p>Loading security verification...</p>
        <small class="text-muted">This usually takes a few seconds</small>
    `).show();
    $('#turnstileWidget').empty();

    // Show the Turnstile modal
    $('#turnstileModal').modal('show');

    // Render Turnstile when modal is shown
    $('#turnstileModal').off('shown.bs.modal').on('shown.bs.modal', function() {
        renderTurnstileInModal();
    });

    // Handle modal close without verification
    $('#turnstileModal').off('hidden.bs.modal').on('hidden.bs.modal', function() {
        if (!turnstileToken && pendingComparison) {
            // User closed modal without verifying - show feedback
            pendingComparison = null;
            showCancelledMessage();
        }
    });
}

/**
 * Show message when user cancels verification
 */
function showCancelledMessage() {
    const $error = $('#errorMessage');
    $error.html('<i class="fas fa-info-circle"></i> Verification cancelled. Click "Compare Breaches" to try again.').show();
    setTimeout(() => $error.fadeOut(), 5000);
}

/**
 * Execute the actual comparison after Turnstile verification
 */
async function executeComparison(email1, email2) {
    lastRequestTime = Date.now();

    $.LoadingOverlay("show");
    $('#errorMessage').hide();

    comparisonData.emailA = email1;
    comparisonData.emailB = email2;

    try {
        // Fetch both emails in parallel
        const [responseA, responseB] = await Promise.all([
            fetchBreachData(email1),
            fetchBreachData(email2)
        ]);

        comparisonData.dataA = responseA;
        comparisonData.dataB = responseB;

        // Process breach data
        processBreachData();

        // Check if BOTH emails have no breaches
        if (comparisonData.breachesA.size === 0 && comparisonData.breachesB.size === 0) {
            // Show celebration instead of analysis
            showCelebration();
        } else {
            // Hide celebration section if it was shown before
            $('#celebrationSection').hide();

            // Render all sections
            renderSummaryCards();
            renderVennDiagram();
            renderRiskComparison();
            renderComparisonTable();
            renderDataTypesChart();
            renderTimelineChart();
            renderInsights();

            // Show results
            $('#resultsSection').slideDown();

            // Scroll to results
            $('html, body').animate({
                scrollTop: $('#resultsSection').offset().top - 20
            }, 500);
        }

    } catch (error) {
        console.error('Comparison error:', error);
        showError(error.message || 'An error occurred while comparing breaches. Please try again.');
        // Hide any previous results on error
        $('#celebrationSection').hide();
        $('#resultsSection').hide();
    } finally {
        $.LoadingOverlay("hide");
        // Reset Turnstile for next comparison
        resetTurnstile();
    }
}

/**
 * Fetch breach data for an email with timeout
 */
async function fetchBreachData(email) {
    const url = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
        response = await fetch(url, { signal: controller.signal });
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw new Error('Network error. Please check your connection and try again.');
    }
    clearTimeout(timeoutId);

    if (response.status === 404) {
        // No breaches found - return empty structure
        return {
            BreachesSummary: { site: '' },
            BreachMetrics: {
                risk: [{ risk_score: 0, risk_label: 'None' }],
                yearwise_details: [{}],
                passwords_strength: [{ PlainText: 0, EasyToCrack: 0, StrongHash: 0, Unknown: 0 }],
                xposed_data: [{ children: [] }]
            },
            ExposedBreaches: { breaches_details: [] }
        };
    }

    if (response.status === 429) {
        throw new Error('Too many requests. Please wait 30 seconds and try again. Our API has rate limits to ensure fair usage for everyone.');
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch data for ${email}`);
    }

    return await response.json();
}

/**
 * Process breach data to find overlaps
 */
function processBreachData() {
    // Extract breach names
    const sitesA = comparisonData.dataA.BreachesSummary.site || '';
    const sitesB = comparisonData.dataB.BreachesSummary.site || '';

    comparisonData.breachesA = new Set(sitesA ? sitesA.split(';').filter(b => b) : []);
    comparisonData.breachesB = new Set(sitesB ? sitesB.split(';').filter(b => b) : []);

    // Calculate overlaps
    comparisonData.sharedBreaches = new Set(
        [...comparisonData.breachesA].filter(b => comparisonData.breachesB.has(b))
    );
    comparisonData.onlyA = new Set(
        [...comparisonData.breachesA].filter(b => !comparisonData.breachesB.has(b))
    );
    comparisonData.onlyB = new Set(
        [...comparisonData.breachesB].filter(b => !comparisonData.breachesA.has(b))
    );

    // Build breach details map
    comparisonData.allBreaches = new Map();

    const breachesDetailsA = comparisonData.dataA.ExposedBreaches?.breaches_details || [];
    const breachesDetailsB = comparisonData.dataB.ExposedBreaches?.breaches_details || [];

    breachesDetailsA.forEach(breach => {
        comparisonData.allBreaches.set(breach.breach, { ...breach, inA: true, inB: false });
    });

    breachesDetailsB.forEach(breach => {
        if (comparisonData.allBreaches.has(breach.breach)) {
            comparisonData.allBreaches.get(breach.breach).inB = true;
        } else {
            comparisonData.allBreaches.set(breach.breach, { ...breach, inA: false, inB: true });
        }
    });
}

/**
 * Truncate email for display with consistent length
 */
function truncateEmail(email, maxLength = 20) {
    if (email.length <= maxLength) return email;
    return email.substring(0, maxLength - 3) + '...';
}

/**
 * Render summary cards
 */
function renderSummaryCards() {
    const totalA = comparisonData.breachesA.size;
    const totalB = comparisonData.breachesB.size;
    const shared = comparisonData.sharedBreaches.size;

    $('#countA').text(totalA);
    $('#countB').text(totalB);
    $('#countShared').text(shared);

    // Truncate email for display with tooltip for full email
    $('#labelA').text(truncateEmail(comparisonData.emailA)).attr('title', comparisonData.emailA);
    $('#labelB').text(truncateEmail(comparisonData.emailB)).attr('title', comparisonData.emailB);
}

/**
 * Render Venn diagram
 */
function renderVennDiagram() {
    const onlyA = comparisonData.onlyA.size;
    const onlyB = comparisonData.onlyB.size;
    const shared = comparisonData.sharedBreaches.size;
    const totalA = comparisonData.breachesA.size;
    const totalB = comparisonData.breachesB.size;

    $('#vennCountA').text(onlyA);
    $('#vennCountB').text(onlyB);
    $('#vennCountShared').text(shared);

    // Update Venn labels - keep simple "Email 1" / "Email 2" for clarity
    $('#vennLabelA').text('Only Email 1');
    $('#vennLabelB').text('Only Email 2');

    // Add full email as tooltip
    $('#vennLeft').attr('title', comparisonData.emailA);
    $('#vennRight').attr('title', comparisonData.emailB);

    // Calculate overlap in plain language
    const totalBreaches = new Set([...comparisonData.breachesA, ...comparisonData.breachesB]).size;

    let overlapText = '';
    if (shared === 0) {
        overlapText = '<strong>No shared breaches.</strong> These emails were exposed in completely different breaches.';
    } else if (shared === 1) {
        overlapText = `<strong>1 breach affects both emails.</strong> Out of ${totalBreaches} total breaches, both emails appear in the same one.`;
    } else {
        overlapText = `<strong>${shared} breaches affect both emails.</strong> Out of ${totalBreaches} total breaches, both emails appear in ${shared} of them.`;
    }
    $('#overlapStats').html(overlapText);

    // Update Venn labels with breach list tooltip
    if (comparisonData.onlyA.size > 0) {
        $('#vennLeft').attr('title', 'Only in ' + comparisonData.emailA + ':\n' + [...comparisonData.onlyA].join('\n'));
    }
    if (comparisonData.onlyB.size > 0) {
        $('#vennRight').attr('title', 'Only in ' + comparisonData.emailB + ':\n' + [...comparisonData.onlyB].join('\n'));
    }
    if (shared > 0) {
        $('#vennOverlap').attr('title', 'Shared breaches:\n' + [...comparisonData.sharedBreaches].join('\n'));
    }
}

/**
 * Render risk comparison meters
 */
function renderRiskComparison() {
    const riskA = comparisonData.dataA.BreachMetrics?.risk?.[0] || { risk_score: 0, risk_label: 'None' };
    const riskB = comparisonData.dataB.BreachMetrics?.risk?.[0] || { risk_score: 0, risk_label: 'None' };

    // Calculate combined risk (higher of the two + bonus for shared breaches)
    const sharedBonus = Math.min(comparisonData.sharedBreaches.size * 2, 15);
    const combinedScore = Math.min(Math.max(riskA.risk_score, riskB.risk_score) + sharedBonus, 100);
    const combinedLabel = combinedScore >= 67 ? 'High' : (combinedScore >= 34 ? 'Medium' : 'Low');

    const getRiskClass = (score) => {
        if (score >= 67) return 'risk-high';
        if (score >= 34) return 'risk-medium';
        return 'risk-low';
    };

    const metersHtml = `
        <div class="risk-meter">
            <div class="label">
                <span title="${escapeHtml(comparisonData.emailA)}">${escapeHtml(truncateEmail(comparisonData.emailA, 25))}</span>
                <span>${escapeHtml(riskA.risk_label)} (${Math.round(riskA.risk_score)}/100)</span>
            </div>
            <div class="progress">
                <div class="progress-bar ${getRiskClass(riskA.risk_score)}" style="width: ${riskA.risk_score}%">
                    ${Math.round(riskA.risk_score)}%
                </div>
            </div>
        </div>
        <div class="risk-meter">
            <div class="label">
                <span title="${escapeHtml(comparisonData.emailB)}">${escapeHtml(truncateEmail(comparisonData.emailB, 25))}</span>
                <span>${escapeHtml(riskB.risk_label)} (${Math.round(riskB.risk_score)}/100)</span>
            </div>
            <div class="progress">
                <div class="progress-bar ${getRiskClass(riskB.risk_score)}" style="width: ${riskB.risk_score}%">
                    ${Math.round(riskB.risk_score)}%
                </div>
            </div>
        </div>
        <div class="risk-meter">
            <div class="label">
                <span><strong>Combined Risk</strong></span>
                <span><strong>${combinedLabel} (${Math.round(combinedScore)}/100)</strong></span>
            </div>
            <div class="progress">
                <div class="progress-bar ${getRiskClass(combinedScore)}" style="width: ${combinedScore}%">
                    ${Math.round(combinedScore)}%
                </div>
            </div>
        </div>
    `;

    $('#riskMeters').html(metersHtml);

    // Show combined risk alert if shared breaches exist
    if (comparisonData.sharedBreaches.size > 0 && combinedScore > Math.max(riskA.risk_score, riskB.risk_score)) {
        $('#combinedRiskAlert').show();
        $('#combinedRiskText').text(
            `Combined risk is HIGHER than individual - ${comparisonData.sharedBreaches.size} shared breach(es) mean potential password reuse across both accounts.`
        );
    } else {
        $('#combinedRiskAlert').hide();
    }
}

/**
 * Render comparison table
 */
function renderComparisonTable() {
    // Set table headers with tooltips for full email
    $('#thEmailA').text(truncateEmail(comparisonData.emailA, 15)).attr('title', comparisonData.emailA);
    $('#thEmailB').text(truncateEmail(comparisonData.emailB, 15)).attr('title', comparisonData.emailB);

    // Destroy existing DataTable if present - with safety check
    if (comparisonDataTable) {
        try {
            if ($.fn.DataTable.isDataTable('#comparisonTable')) {
                comparisonDataTable.destroy();
            }
        } catch (e) {
            console.warn('Error destroying DataTable:', e);
        }
        comparisonDataTable = null;
    }

    // Sort breaches: shared first, then by date
    const sortedBreaches = [...comparisonData.allBreaches.entries()].sort((a, b) => {
        const aShared = a[1].inA && a[1].inB;
        const bShared = b[1].inA && b[1].inB;
        if (aShared !== bShared) return bShared - aShared;
        return new Date(b[1].xposed_date || 0) - new Date(a[1].xposed_date || 0);
    });

    let tableHtml = '';
    sortedBreaches.forEach(([name, breach]) => {
        const isShared = breach.inA && breach.inB;
        const dataExposed = breach.xposed_data ? breach.xposed_data.replace(/;/g, ', ') : 'N/A';
        const truncatedData = dataExposed.length > 50 ? dataExposed.substring(0, 47) + '...' : dataExposed;

        // Extract year from date
        let year = 'Unknown';
        if (breach.xposed_date) {
            const dateMatch = breach.xposed_date.match(/\d{4}/);
            year = dateMatch ? dateMatch[0] : breach.xposed_date;
        }

        tableHtml += `
            <tr class="${isShared ? 'shared-row' : ''}">
                <td class="breach-name">
                    <a href="breach.html#${encodeURIComponent(name)}" target="_blank" class="breach-link">
                        ${escapeHtml(name)}
                        <i class="fas fa-external-link-alt breach-link-icon"></i>
                        ${isShared ? '<span class="badge badge-danger ml-2">Shared</span>' : ''}
                    </a>
                </td>
                <td>${breach.inA ? '<i class="fas fa-check check-icon"></i>' : '<i class="fas fa-times cross-icon"></i>'}</td>
                <td>${breach.inB ? '<i class="fas fa-check check-icon"></i>' : '<i class="fas fa-times cross-icon"></i>'}</td>
                <td class="data-exposed" title="${escapeHtml(dataExposed)}">${escapeHtml(truncatedData)}</td>
                <td>${year}</td>
            </tr>
        `;
    });

    if (sortedBreaches.length === 0) {
        tableHtml = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-check-circle text-success" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-0">Neither email has been found in any data breaches!</p>
                </td>
            </tr>
        `;
    }

    $('#comparisonTableBody').html(tableHtml);

    // Initialize DataTables if there are breaches
    if (sortedBreaches.length > 0) {
        comparisonDataTable = $('#comparisonTable').DataTable({
            paging: sortedBreaches.length > 10,
            pageLength: 10,
            searching: true,
            ordering: true,
            info: true,
            order: [], // Keep the pre-sorted order (shared first, then by date)
            language: {
                search: "Filter breaches:",
                lengthMenu: "Show _MENU_ breaches",
                info: "Showing _START_ to _END_ of _TOTAL_ breaches",
                infoEmpty: "No breaches found",
                emptyTable: "No breaches to display"
            },
            columnDefs: [
                { orderable: true, targets: [0, 4] },
                { orderable: false, targets: [1, 2, 3] }
            ]
        });
    }
}

/**
 * Render data types comparison chart
 */
function renderDataTypesChart() {
    try {
        const dataTypesA = extractDataTypes(comparisonData.dataA);
        const dataTypesB = extractDataTypes(comparisonData.dataB);

        // Combine all unique data types
        const allTypes = new Set([...Object.keys(dataTypesA), ...Object.keys(dataTypesB)]);
        const sortedTypes = [...allTypes].sort();

        const labels = sortedTypes.map(type => formatDataTypeLabel(type));
        const dataA = sortedTypes.map(type => dataTypesA[type] || 0);
        const dataB = sortedTypes.map(type => dataTypesB[type] || 0);

        const ctx = document.getElementById('dataTypesChart');
        if (!ctx) {
            console.error('Data types chart canvas not found');
            return;
        }

        if (dataTypesChart) {
            dataTypesChart.destroy();
            dataTypesChart = null;
        }

        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';

        dataTypesChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: comparisonData.emailA.substring(0, 20),
                    data: dataA,
                    backgroundColor: 'rgba(65, 127, 249, 0.7)',
                    borderColor: 'rgba(65, 127, 249, 1)',
                    borderWidth: 1
                },
                {
                    label: comparisonData.emailB.substring(0, 20),
                    data: dataB,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isDarkMode ? '#FFFFFF' : '#666666',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        return context.dataset.data[context.dataIndex] > 0;
                    },
                    color: isDarkMode ? '#FFFFFF' : '#666666',
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: function(value) {
                        return value;
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isDarkMode ? '#FFFFFF' : '#666666',
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDarkMode ? '#FFFFFF' : '#666666',
                        precision: 0,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: isDarkMode ? '#2a2d40' : '#e0e0e0'
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error rendering data types chart:', error);
        // Hide the chart section on error
        $('.data-types-section').hide();
    }
}

/**
 * Extract data types from breach data
 */
function extractDataTypes(data) {
    const types = {};
    const breaches = data.ExposedBreaches?.breaches_details || [];

    breaches.forEach(breach => {
        if (breach.xposed_data) {
            breach.xposed_data.split(';').forEach(type => {
                const normalizedType = type.trim().toLowerCase();
                if (normalizedType) {
                    types[normalizedType] = (types[normalizedType] || 0) + 1;
                }
            });
        }
    });

    return types;
}

/**
 * Render timeline chart
 */
function renderTimelineChart() {
    try {
        const yearsA = comparisonData.dataA.BreachMetrics?.yearwise_details?.[0] || {};
        const yearsB = comparisonData.dataB.BreachMetrics?.yearwise_details?.[0] || {};

        // Get all years from 2007 to current year
        const currentYear = new Date().getFullYear();
        const labels = [];
        const dataA = [];
        const dataB = [];

        for (let year = 2007; year <= currentYear; year++) {
            labels.push(year.toString());
            dataA.push(yearsA[`y${year}`] || 0);
            dataB.push(yearsB[`y${year}`] || 0);
        }

        const ctx = document.getElementById('timelineChart');
        if (!ctx) {
            console.error('Timeline chart canvas not found');
            return;
        }

        if (timelineChart) {
            timelineChart.destroy();
            timelineChart = null;
        }

        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';

        timelineChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: comparisonData.emailA.substring(0, 20),
                    data: dataA,
                    borderColor: 'rgba(65, 127, 249, 1)',
                    backgroundColor: 'rgba(65, 127, 249, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: comparisonData.emailB.substring(0, 20),
                    data: dataB,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isDarkMode ? '#FFFFFF' : '#666666',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        return context.dataset.data[context.dataIndex] > 0;
                    },
                    color: function(context) {
                        return context.dataset.borderColor;
                    },
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    formatter: function(value) {
                        return value;
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isDarkMode ? '#FFFFFF' : '#666666',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDarkMode ? '#FFFFFF' : '#666666',
                        precision: 0,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: isDarkMode ? '#2a2d40' : '#e0e0e0'
                    },
                    title: {
                        display: true,
                        text: 'Number of Breaches',
                        color: isDarkMode ? '#FFFFFF' : '#666666',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error rendering timeline chart:', error);
        // Hide the chart section on error
        $('.timeline-section').hide();
    }
}

/**
 * Render actionable insights
 */
function renderInsights() {
    const insights = [];
    const sharedCount = comparisonData.sharedBreaches.size;

    // Check for shared password breaches
    const sharedPasswordBreaches = [...comparisonData.sharedBreaches].filter(b => {
        const breach = comparisonData.allBreaches.get(b);
        return breach && breach.xposed_data && breach.xposed_data.toLowerCase().includes('password');
    });

    if (sharedPasswordBreaches.length > 0) {
        insights.push({
            type: 'critical',
            icon: 'fa-exclamation-circle',
            title: 'CRITICAL - Shared Password Risk',
            content: `
                <p>Both emails appear in <strong>${sharedPasswordBreaches.length} breach(es)</strong> where passwords were stolen.</p>
                <p><strong>What this means:</strong> If you used the same password for both emails on any of these sites, hackers may already have access to your accounts.</p>
                <div class="action-checklist">
                    <p><strong>Action checklist:</strong></p>
                    <ol>
                        <li><strong>Change passwords immediately</strong> on these services: ${sharedPasswordBreaches.slice(0, 3).map(b => escapeHtml(b)).join(', ')}${sharedPasswordBreaches.length > 3 ? ` and ${sharedPasswordBreaches.length - 3} more` : ''}</li>
                        <li><strong>Use different passwords</strong> for each site (a password manager like Bitwarden or 1Password helps)</li>
                        <li><strong>Check your accounts</strong> for any suspicious activity or unauthorized logins</li>
                    </ol>
                </div>
            `
        });
    }

    // Check for shared phone exposure
    const sharedPhoneBreaches = [...comparisonData.sharedBreaches].filter(b => {
        const breach = comparisonData.allBreaches.get(b);
        return breach && breach.xposed_data && breach.xposed_data.toLowerCase().includes('phone');
    });

    if (sharedPhoneBreaches.length > 0) {
        insights.push({
            type: 'warning',
            icon: 'fa-phone',
            title: 'WARNING - Shared Phone Number',
            content: `
                <p>Both accounts have phone numbers exposed in <strong>${sharedPhoneBreaches.length} breach(es)</strong>.</p>
                <p><strong>What this means:</strong> Scammers may call or text you pretending to be your bank or a company you trust.</p>
                <div class="action-checklist">
                    <p><strong>Action checklist:</strong></p>
                    <ol>
                        <li><strong>Use an authenticator app</strong> (like Google Authenticator) instead of SMS for two-factor authentication</li>
                        <li><strong>Be suspicious of unexpected calls</strong> asking for personal info or passwords</li>
                        <li><strong>Contact your phone carrier</strong> to add a PIN to prevent SIM-swap fraud</li>
                    </ol>
                </div>
            `
        });
    }

    // Check for high-risk breaches
    const highRiskBreaches = [...comparisonData.sharedBreaches].filter(b => {
        const breach = comparisonData.allBreaches.get(b);
        return breach && breach.password_risk &&
               (breach.password_risk === 'plaintext' || breach.password_risk === 'easytocrack');
    });

    if (highRiskBreaches.length > 0) {
        insights.push({
            type: 'critical',
            icon: 'fa-unlock-alt',
            title: 'CRITICAL - Weak Password Storage',
            content: `
                <p><strong>${highRiskBreaches.length} shared breach(es)</strong> stored passwords without proper protection.</p>
                <p><strong>What this means:</strong> Your exact passwords from these sites are likely known to hackers: ${highRiskBreaches.map(b => escapeHtml(b)).join(', ')}</p>
                <div class="action-checklist">
                    <p><strong>Action checklist:</strong></p>
                    <ol>
                        <li><strong>Change these passwords immediately</strong> and anywhere else you used the same password</li>
                        <li><strong>Check for unauthorized access</strong> to your accounts on these services</li>
                        <li><strong>Never reuse passwords</strong> from these breaches anywhere</li>
                    </ol>
                </div>
            `
        });
    }

    // Check for no shared breaches (positive)
    if (sharedCount === 0 && (comparisonData.breachesA.size > 0 || comparisonData.breachesB.size > 0)) {
        insights.push({
            type: 'positive',
            icon: 'fa-shield-alt',
            title: 'POSITIVE - No Shared Breaches',
            content: `
                <p>Good news! These emails were not found in any of the same data breaches.</p>
                <p>This suggests the accounts have been used on different services or one has better security practices.</p>
            `
        });
    }

    // Check for no breaches at all
    if (comparisonData.breachesA.size === 0 && comparisonData.breachesB.size === 0) {
        insights.push({
            type: 'positive',
            icon: 'fa-check-circle',
            title: 'EXCELLENT - No Breaches Found',
            content: `
                <p>Neither email appears in any known data breaches.</p>
                <p>Keep up the good security practices!</p>
            `
        });
    }

    // General recommendation
    if (sharedCount > 0) {
        insights.push({
            type: 'warning',
            icon: 'fa-key',
            title: 'RECOMMENDATION - Protect Your Accounts',
            content: `
                <p>Since these emails share <strong>${sharedCount} breach(es)</strong>, here is how to stay safe:</p>
                <div class="action-checklist">
                    <ol>
                        <li><strong>Use unique passwords</strong> for every account (never reuse passwords)</li>
                        <li><strong>Get a password manager</strong> like Bitwarden (free) or 1Password to create and remember strong passwords</li>
                        <li><strong>Turn on two-factor authentication (2FA)</strong> wherever available. This sends a code to your phone when logging in, so hackers cannot access your account with just your password</li>
                        <li><strong>Consider using separate emails</strong> for important accounts like banking</li>
                    </ol>
                </div>
            `
        });
    }

    // Render insights
    let insightsHtml = '';
    insights.forEach(insight => {
        insightsHtml += `
            <div class="insight-card ${insight.type}">
                <h5><i class="fas ${insight.icon}"></i> ${insight.title}</h5>
                ${insight.content}
            </div>
        `;
    });

    if (insights.length === 0) {
        insightsHtml = `
            <div class="insight-card positive">
                <h5><i class="fas fa-info-circle"></i> Analysis Complete</h5>
                <p>No specific security concerns identified from this comparison.</p>
            </div>
        `;
    }

    $('#insightsContainer').html(insightsHtml);
}

/**
 * Initialize export buttons
 */
function initializeExportButtons() {
    $('#btnExportCSV').on('click', exportToCSV);
    $('#btnPrint').on('click', () => window.print());
    $('#btnNewComparison').on('click', startNewComparison);
}

/**
 * Start a new comparison - clear results and scroll to top
 */
function startNewComparison() {
    // Hide results and celebration sections
    $('#resultsSection').slideUp();
    $('#celebrationSection').slideUp();

    // Clear input fields
    $('#email1').val('').css('border-color', '');
    $('#email2').val('').css('border-color', '');

    // Disable compare button
    $('#btnCompare').prop('disabled', true);

    // Reset Turnstile for new comparison
    resetTurnstile();

    // Scroll to top of page and focus on first input
    $('html, body').animate({
        scrollTop: 0
    }, 500, function() {
        $('#email1').focus();
    });
}

/**
 * Export to CSV
 */
function exportToCSV() {
    if (!comparisonData.emailA || !comparisonData.emailB) {
        showError('Please run a comparison first.');
        return;
    }

    // Sanitize emails for CSV header (prevent CSV injection)
    const safeEmailA = sanitizeCSV(comparisonData.emailA);
    const safeEmailB = sanitizeCSV(comparisonData.emailB);

    let csv = `Breach Name,Email A (${safeEmailA}),Email B (${safeEmailB}),Shared,Data Exposed,Date\n`;

    comparisonData.allBreaches.forEach((breach, name) => {
        const isShared = breach.inA && breach.inB;
        const dataExposed = (breach.xposed_data || '').replace(/;/g, ' | ').replace(/,/g, ' ');
        // Sanitize all values to prevent CSV injection
        const safeName = sanitizeCSV(name);
        const safeDataExposed = sanitizeCSV(dataExposed);
        const safeDate = sanitizeCSV(breach.xposed_date || 'Unknown');
        csv += `"${safeName}","${breach.inA ? 'Yes' : 'No'}","${breach.inB ? 'Yes' : 'No'}","${isShared ? 'Yes' : 'No'}","${safeDataExposed}","${safeDate}"\n`;
    });

    // Add summary
    csv += '\nSummary\n';
    csv += `"Total Breaches (${safeEmailA})",${comparisonData.breachesA.size}\n`;
    csv += `"Total Breaches (${safeEmailB})",${comparisonData.breachesB.size}\n`;
    csv += `Shared Breaches,${comparisonData.sharedBreaches.size}\n`;

    downloadFile(csv, 'breach-comparison.csv', 'text/csv');
}

/**
 * Download file helper
 */
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Theme change observer - re-render charts when theme changes
 */
const themeObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            // Only re-render charts if they exist (comparison has been done)
            if (dataTypesChart || timelineChart) {
                renderDataTypesChart();
                renderTimelineChart();
            }
        }
    });
});

// Start observing theme changes on body
themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-theme']
});
