const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const validateEmail = (email) => {
    const escapedEmail = escapeHtml(email);
    const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(escapedEmail);
};

(function ($) {
    $.fn.runCounter = function (options) {
        var defaults = {
            start: 0,
            end: 0,
            duration: 1000
        };
        var opt = $.extend(defaults, options);
        return this.each(function () {
            var $this = $(this);
            $({
                counter: opt.start
            }).animate({
                counter: opt.end
            }, {
                duration: opt.duration,
                easing: 'linear',
                step: function () {
                    $this.text(Math.floor(this.counter).toLocaleString());
                },
                complete: function () {
                    $this.text(opt.end.toLocaleString());
                }
            });
        });
    };
})(jQuery);


$('#alertMeModal').on('hidden.bs.modal', (e) => {
    $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
    $("#h2head").attr("class", "modal-header-primary");
    $('#message-text').text("We'll notify you instantly if your email appears in any new data breach. You can unsubscribe anytime. This service is completely free.");
    $("#alertMe").show();
    $("#alertMeClose, #a_succ").hide();
});

$('#alertMeModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    const email = $("#edhu").val().toLowerCase();
    $("#recipient-name").val(email);
    $('#thedudalModal').modal('hide');


    try {
        if (typeof turnstile !== 'undefined') {
            turnstile.reset('#turns');
        }
    } catch (e) {
        console.error('Error resetting Turnstile:', e);
    }
});

const isEmpty = (value) => value == null || (typeof value === "string" && value.trim().length === 0);

let turnstileLoaded = false;
function loadTurnstile() {
    if (turnstileLoaded) return;
    turnstileLoaded = true;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=_turnstileCb';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
}

function _turnstileCb() {
    try {
        const turnstileStatus = turnstile.render('#turns', {
            sitekey: '0x4AAAAAAAA_T_0Qt4kJbXno',
            theme: 'light',
            callback: function (token) {

                $('#alertMe').prop('disabled', false);
            }
        });


        $('#alertMe').prop('disabled', true);
    } catch (error) {
        console.error('Turnstile error:', error);

        $('#alertMe').prop('disabled', false);
    }
}

$(document).ready(function () {

    $('#alertMeModal').on('keydown', (event) => {
        const enterKeyCode = 13;
        if (event.keyCode === enterKeyCode) {
            event.preventDefault();
            $('#alertMe').click();
        }
    });


    $('#alertMeModal').on('show.bs.modal', loadTurnstile);

    $('#alertMeModal').on('shown.bs.modal', function () {
        if (typeof turnstile !== 'undefined' && document.getElementById('turns')) {
            try {
                turnstile.reset('#turns');
            } catch (e) {
                console.error('Failed to reset Turnstile:', e);
            }
        }
    });

    $("#alertMe").click((event) => {
        event.preventDefault();

        const inputValue = $("#recipient-name").val().toLowerCase().trim();

        // Validate email before proceeding
        if (!inputValue || !validateEmail(inputValue)) {
            $('#message-text').text("Please enter a valid email address to receive alerts.");
            $("#h2head").attr("class", "modal-header-danger");
            $("#recipient-name").css("border", "1px solid red").focus();
            return;
        }

        let turnstileResponse = '';

        try {

            if (typeof turnstile !== 'undefined') {
                turnstileResponse = turnstile.getResponse() || '';
            }
        } catch (e) {
            console.error('Error getting Turnstile response:', e);
        }


        $("#alertMe_i1").addClass("fa fa-spinner fa-spin");
        $("#alertMe_i2").removeClass("fa fa-bell ring");


        const apiUrl = 'https://api.xposedornot.com/v1/alertme/' + encodeURIComponent(inputValue);
        const headers = turnstileResponse ? { 'X-Turnstile-Token': turnstileResponse } : {};

        $.ajax({
            url: apiUrl,
            type: 'GET',
            headers: headers
        })
            .done(() => {
                $('#message-text').text(ALERT_MESSAGES.subscribeSuccess);
                $("#h2head").attr("class", "modal-header-success");
                $("#alertMe").hide();
                $("#alertMeClose").show();


                $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
                $("#alertMe_i2").addClass("fa fa-bell ring");
            })
            .fail((jqXHR) => {
                let message = ALERT_MESSAGES.alreadySubscribed;
                let headerClass = "modal-header-success";

                if (jqXHR.status === 0 || jqXHR.status === 429 || jqXHR.status >= 500) {
                    message = ALERT_MESSAGES.signupFailed;
                    headerClass = "modal-header-danger";
                } else {
                    try {
                        const response = jqXHR.responseJSON || JSON.parse(jqXHR.responseText);
                        if (response && response.status === "Error") {
                            message = ALERT_MESSAGES.unableToDeliver;
                            headerClass = "modal-header-danger";
                        }
                    } catch (e) {
                    }
                }

                $('#message-text').text(message);
                $("#h2head").attr("class", headerClass);
                $("#alertMe").hide();
                $("#alertMeClose").show();


                $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
                $("#alertMe_i2").addClass("fa fa-bell ring");
            });
    });

    $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
    $("#alertMe_i2").addClass("fa fa-bell ring");
});

$(document).ready(function () {

    const apiUrlBase = 'https://api.xposedornot.com/v1/breach-analytics?email=';

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var searchInput = document.getElementById('edhu');
        if (searchInput) searchInput.focus();
    }

    $("#searchMe").click(function (event) {
        event.preventDefault();
        fetchMetrics();
        let email = $("#edhu").val().toLowerCase().trim();
        let apiUrl = apiUrlBase + encodeURIComponent(email);
        $('#recipient-name').val(email);

        $("#hhead").attr("class", "modal-header modal-header-success");
        $("#dismiss").attr("class", "btn btn-success");
        $("#mbody, #warn, #info").hide();
        $("#succ, #spins, #alert_").show();
        $("#ssvisible").html('<h2 id="thedudalModalLabel">Searching ...</h2>');
        renderResultSummary('Checking your email…', 'neutral', email);


        if (!email) {
            updateModalForInvalidEmail(email);
            return;
        }

        $.ajax(apiUrl).done(function (response) {
            processSearchResponse(response, email);
        }).fail(function (error) {
            processSearchError(error, email);
        });

        $('#thedudalModal').modal();
    });

    $('#edhu, #recipient-name').on('input', function () {
        let email = $(this).val();
        let isValid = validateEmail(email);
        let targetButton = $(this).is('#edhu') ? '#searchMe' : '#alertMe';

        $(this).css("border", isValid ? "2px solid green" : "2px solid red");
        $(this).attr('aria-invalid', !isValid);
        $(targetButton).prop('disabled', !isValid);
    });

    handleVideoModal();

    // Focus on detailed report button when modal is fully shown
    $('#thedudalModal').on('shown.bs.modal', function () {
        if ($("#detailedReport").is(":visible")) {
            $("#detailedReport").focus();
        }
    });

    // Return focus to search input when modal closes
    $('#thedudalModal').on('hidden.bs.modal', function () {
        $("#edhu").focus();
        resetResultState();
    });

    $('#thedudalModal').on('mousedown', function (e) {
        if (!$(e.target).closest('.modal-content').length) {
            $(this).modal('hide');
        }
    });

    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            $('#thedudalModal').modal('hide');
            resetResultState();
        }
    });

    $(document).on('click', '#showAllBreaches', function () {
        const list = document.getElementById('allBreachTags');
        if (!list) return;
        const expand = list.hasAttribute('hidden');
        if (expand) {
            list.removeAttribute('hidden');
        } else {
            list.setAttribute('hidden', '');
        }
        $(this).attr('aria-expanded', expand ? 'true' : 'false')
            .text(expand ? 'Hide full list' : this.getAttribute('data-show-label'));
    });

    $("#detailedReport").click(function () {
        let url = "data-breaches-risks.html?email=" + $("#edhu").val().toLowerCase();
        window.open(url, '_blank').opener = null;
    });
});


function renderResultSummary(headline, tone, email) {
    $('#data_breach').attr('class', 'result-headline result-' + tone).text(headline);
    $('#data_email').attr('class', 'result-emailline').text(email ? 'Checked: ' + email : '');
}

function resetResultState() {
    $('#warn, #succ, #info').hide().empty();
    $('#data_breach').attr('class', 'result-headline').empty();
    $('#data_email').attr('class', 'result-emailline').empty();
    $(".modal-content").css({ 'background-color': '', 'border': '' });
}

function breachTagLink(name, year) {
    const yearPart = year ? ' <span class="breach-tag-year">· ' + escapeHtml(String(year)) + '</span>' : '';
    return '<a class="breach-tag" rel="noopener" target="_blank" href="/breach/' + encodeURIComponent(name) + '">' + escapeHtml(name) + yearPart + '<span class="sr-only"> (opens in new tab)</span></a>';
}



function updateModalForInvalidEmail(email) {
    $("#hhead").attr("class", "modal-header modal-header-danger");
    $("#dismiss").attr("class", "btn btn-primary");
    renderResultSummary('Enter a valid email address', 'neutral', email);
    $("#succ, #spins, #warn, #alert_").hide();
    $("#info").html(STATUS_MESSAGES.invalidEmail).show();
    $("#mbody").show();
}

const STATUS_MESSAGES = {
    searching: "Checking your email against our breach database...",
    success: "🎉 Good news! Your email isn't in any of the data breaches we've indexed. New breaches surface all the time, so free alerts are worth setting up.",
    invalidEmail: "Please enter a valid email address to check",
    throttled: "Please wait a moment before trying again",
    serverError: "We're experiencing technical difficulties. Please try again in a few minutes."
};

function successMessage() {
    const count = metricsData ? parseInt(metricsData.Breaches_Count, 10) : 0;
    if (count > 0) {
        return "🎉 Good news! Your email isn't in any of the " + count.toLocaleString() + " data breaches we've indexed. New breaches surface all the time, so free alerts are worth setting up.";
    }
    return STATUS_MESSAGES.success;
}

const ALERT_MESSAGES = {
    subscribe: "Get instant notifications if your email appears in future data breaches",
    subscribeSuccess: "Verification email sent! Check your inbox to activate free breach monitoring.",
    alreadySubscribed: "You're already protected! This email is registered for breach alerts.",
    unableToDeliver: "Unable to send email to this address. Please check and try again.",
    signupFailed: "We couldn't set up alerts right now. Please try again in a few minutes."
};

// Lazy-load confetti library
let confettiLoading = false;
function loadConfetti() {
    return new Promise((resolve, reject) => {
        if (typeof confetti === 'function') {
            resolve();
            return;
        }
        if (confettiLoading) {
            // Wait for existing load to complete
            const checkLoaded = setInterval(() => {
                if (typeof confetti === 'function') {
                    clearInterval(checkLoaded);
                    resolve();
                }
            }, 50);
            return;
        }
        confettiLoading = true;
        const script = document.createElement('script');
        script.src = '/static/scripts/libs/confetti.browser.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function fireConfetti() {
    // Lazy-load confetti library then fire
    loadConfetti().then(() => {
        // Vibrant color palette
        const colors = [
            '#FF6B6B',  // Coral red
            '#4ECDC4',  // Turquoise
            '#45B7D1',  // Sky blue
            '#96CEB4',  // Sage green
            '#FFEEAD',  // Cream yellow
            '#FFD93D',  // Golden yellow
            '#FF9EAA',  // Pink
            '#A06CD5'   // Purple
        ];

        // First burst from left
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { x: 0.2, y: 0.8 },
            colors: colors,
            ticks: 200,
            gravity: 1.2,
            scalar: 1.2,
            shapes: ['square', 'circle']
        });

        // Second burst from right after a small delay
        setTimeout(() => {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { x: 0.8, y: 0.8 },
                colors: colors,
                ticks: 200,
                gravity: 1.2,
                scalar: 1.2,
                shapes: ['square', 'circle']
            });
        }, 250);

        // Add a final smaller burst from the center for extra flair
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 100,
                origin: { x: 0.5, y: 0.9 },
                colors: colors,
                ticks: 150,
                gravity: 1,
                scalar: 1,
                shapes: ['square', 'circle']
            });
        }, 500);
    }).catch(() => {
        console.warn('Failed to load confetti library');
    });
}

function processSearchResponse(response, email) {
    const jsonResponse = response;
    const breachSummary = jsonResponse.BreachesSummary.site;
    const pasteSummaryCount = jsonResponse.PastesSummary.cnt;

    // Reset modal styling first
    $(".modal-content").css({
        'background-color': '',
        'border': ''
    });

    // Always stop spinning and show mbody
    $("#spins").hide();
    $("#mbody").show();

    var isDark = document.body.getAttribute('data-theme') === 'dark';
    let warningMessage = '';

    // Check if no breaches found (either empty or length < 1)
    if (!breachSummary || breachSummary.length < 1) {
        // Success state - No breaches
        $(".modal-content").css({
            'background-color': isDark ? '#131c15' : '#f8fff8',
            'border': isDark ? '2px solid #1b5e20' : '2px solid #28a745'
        });

        $("#hhead").attr("class", "modal-header modal-header-success");
        $("#dismiss").attr("class", "btn btn-success");
        $("#ssvisible").html('<h2 id="thedudalModalLabel"><i class="fas fa-smile-beam fa-2x text-success" style="background-color: white; border-radius: 50%; padding: 5px;" aria-hidden="true"></i>&nbsp;&nbsp;Yay! No Breaches Found</h2>');

        renderResultSummary('No breaches found', 'success', email);

        $("#detailedReport").hide();
        $("#warn").hide();
        $("#info").hide();
        $("#succ").show();
        $("#alert_").show();
        $("#succ").html(successMessage());

        // Fire confetti animation
        setTimeout(fireConfetti, 100);

    } else {
        // Danger state - Breaches found
        $(".modal-content").css({
            'background-color': isDark ? '#1c1517' : '#fff5f5',
            'border': isDark ? '2px solid #b71c1c' : '2px solid #dc3545'
        });

        $("#hhead").attr("class", "modal-header modal-header-danger");
        $("#dismiss").attr("class", "btn-danger btn");
        $("#ssvisible").html('<h2 id="thedudalModalLabel"><i class="fas fa-exclamation-triangle fa-2x text-white" aria-hidden="true"></i>&nbsp;&nbsp;Your Email Appeared in a Breach</h2>');
        $("#warn").show();
        $("#succ").hide();
        $("#info").hide();
        $("#alert_").show();
        $("#detailedReport").show();

        const breaches = breachSummary.split(";").filter(Boolean);
        const total = breaches.length;
        renderResultSummary('Found in ' + total + (total === 1 ? ' breach' : ' breaches'), 'danger', email);

        const details = (jsonResponse.ExposedBreaches && jsonResponse.ExposedBreaches.breaches_details) || [];
        warningMessage = '';

        if (details.length > 0) {
            const sorted = details.slice().sort(function (a, b) {
                const yearDiff = (parseInt(b.xposed_date, 10) || 0) - (parseInt(a.xposed_date, 10) || 0);
                if (yearDiff !== 0) return yearDiff;
                return (b.xposed_records || 0) - (a.xposed_records || 0);
            });

            warningMessage += '<p class="breach-intro">Your email appeared in these data breaches, newest first:</p><div class="breach-tags">';
            sorted.slice(0, 10).forEach(function (b) {
                warningMessage += breachTagLink(b.breach, b.xposed_date);
            });
            warningMessage += '</div>';

            const rest = sorted.slice(10);
            if (rest.length > 0) {
                const showLabel = 'Show all ' + total + ' breaches';
                warningMessage += '<button type="button" id="showAllBreaches" class="breach-showall" aria-expanded="false" aria-controls="allBreachTags" data-show-label="' + showLabel + '">' + showLabel + '</button>';
                warningMessage += '<div id="allBreachTags" class="breach-tags" hidden>';
                rest.forEach(function (b) {
                    warningMessage += breachTagLink(b.breach, b.xposed_date);
                });
                warningMessage += '</div>';
            }
        } else {
            warningMessage += '<p class="breach-intro">Your email appeared in these data breaches:</p><div class="breach-tags">';
            breaches.forEach(function (name) {
                warningMessage += breachTagLink(name);
            });
            warningMessage += '</div>';
        }

        $("#warn").html(warningMessage);
        $("#warn").show();
    }

    // Handle paste summary if needed
    const pasteCount = jsonResponse.PastesSummary.cnt;
    if (pasteCount > 0) {
        $("#detailedReport").show();
        warningMessage += '<p class="breach-intro" style="margin-top:16px">Also found in public pastes:</p><div class="breach-tags">';
        const pastes = jsonResponse.PastesSummary.tweet_id.split(";");
        for (let i = 0; i < pastes.length; i++) {
            warningMessage += '<a class="breach-tag" rel="noopener" target="_blank" title="Click to open" href="https://pastebin.com/' + encodeURIComponent(pastes[i]) + '">' + escapeHtml(pastes[i]) + '<span class="sr-only"> (opens in new tab)</span></a>';
        }
        warningMessage += '</div>';
        $("#warn").html(warningMessage);
        $("#warn").show();
    }

    if (breachSummary && breachSummary.length > 0) {
        warningMessage += '<p class="breach-intro" style="margin-top:16px">Do this now:</p>' +
            '<ol style="text-align: left; display: inline-block; margin: 0; padding-left: 1.4em">' +
            '<li>Change your password on the breached sites above.</li>' +
            '<li>Turn on two-factor authentication on your email account.</li>' +
            '<li>Set up free alerts so you know the moment a new breach hits.</li>' +
            '</ol>';
        $("#warn").html(warningMessage);
    }

}


function processSearchError(error, email) {
    var isDark = document.body.getAttribute('data-theme') === 'dark';
    if (error.status === 429) {
        $("#mbody").show();
        $("#spins").hide();
        $("#succ").html(STATUS_MESSAGES.throttled);
        renderResultSummary('Check not completed', 'neutral', email);
    } else if (error.status === 404) {
        $(".modal-content").css({
            'background-color': isDark ? '#131c15' : '#f8fff8',
            'border': isDark ? '2px solid #1b5e20' : '2px solid #28a745'
        });

        $("#hhead").attr("class", "modal-header modal-header-success");
        $("#dismiss").attr("class", "btn btn-success");
        $("#ssvisible").html('<h2 id="thedudalModalLabel"><i class="fas fa-smile-beam fa-2x text-success" style="background-color: white; border-radius: 50%; padding: 5px;" aria-hidden="true"></i>&nbsp;&nbsp;Yay! No Breaches Found</h2>');

        renderResultSummary('No breaches found', 'success', email);

        $("#detailedReport").hide();
        $("#warn").hide();
        $("#spins").hide();
        $("#mbody").show();
        $("#succ").show();
        $("#alert_").show();
        $("#succ").html(successMessage());

        setTimeout(fireConfetti, 100);
    } else {
        $(".modal-content").css({
            'background-color': '',
            'border': ''
        });

        $("#hhead").attr("class", "modal-header modal-header-danger");
        $("#dismiss").attr("class", "btn btn-primary");
        $("#ssvisible").html('<h2 id="thedudalModalLabel"><i class="fas fa-exclamation-triangle fa-2x text-white" aria-hidden="true"></i>&nbsp;&nbsp;We Couldn\'t Check Right Now</h2>');

        renderResultSummary('Check not completed', 'neutral', email);

        $("#detailedReport").hide();
        $("#spins, #succ, #warn").hide();
        $("#mbody, #info").show();
        $("#info").html(STATUS_MESSAGES.serverError);
    }
}

function handleVideoModal() {
    const videoModal = $('#vidModal');
    const videoElement = $('#video');
    let videoSrc;

    $('.video-btn').click(function () {
        videoSrc = $(this).data("src");
    });

    videoModal.on('shown.bs.modal', function (event) {
        videoElement.attr('src', videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
    });

    videoModal.on('hide.bs.modal', function (event) {
        videoElement.attr('src', videoSrc);
    });
}

const apiUrl = 'https://api.xposedornot.com/v1/metrics';

const pastesCountElement = $("#p1");
const pastesRecordsElement = $("#p2");
const breachesCountElement = $("#b1");
const breachesRecordsElement = $("#b2");

// Viewport-triggered counter animation with lazy API loading
let metricsData = null;
let countersStarted = false;
let metricsFetched = false;

function startCounters() {
    if (countersStarted || !metricsData) return;
    countersStarted = true;

    let pastesCount = parseInt(metricsData.Pastes_Count.replace(/,/g, ''), 10);
    let pastesRecords = parseInt(metricsData.Pastes_Records, 10);
    let breachesCount = parseInt(metricsData.Breaches_Count, 10);
    let breachesRecords = parseInt(metricsData.Breaches_Records, 10);

    runCounter(pastesCountElement, pastesCount, 10000, function () {
        $(pastesCountElement).text(pastesCount.toLocaleString());
    });
    runCounter(pastesRecordsElement, pastesRecords, 10000, function () {
        $(pastesRecordsElement).text(pastesRecords.toLocaleString());
    });
    runCounter(breachesCountElement, breachesCount, 10000, function () {
        $(breachesCountElement).text(breachesCount.toLocaleString());
    });
    runCounter(breachesRecordsElement, breachesRecords, 10000, function () {
        $(breachesRecordsElement).text(breachesRecords.toLocaleString());
    });
}

function fetchMetrics() {
    if (metricsFetched) return;
    metricsFetched = true;

    $.ajax(apiUrl)
        .done(function (response) {
            metricsData = response;
            startCounters();
            renderLastBreachAdded();
        });
}

function renderLastBreachAdded() {
    var wrap = document.getElementById('stats-freshness');
    var dateEl = document.getElementById('last-breach-added');
    if (!wrap || !dateEl || !metricsData || !metricsData.Last_Breach_Added) return;
    var added = new Date(metricsData.Last_Breach_Added);
    if (isNaN(added.getTime())) return;
    var lang = document.documentElement.lang || 'en';
    var formatted;
    try {
        formatted = added.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        formatted = added.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    dateEl.textContent = formatted;
    wrap.hidden = false;
}

// Set up Intersection Observer for the stats section
const statsSection = document.querySelector('.follow');
if (statsSection) {
    const observerOptions = {
        root: null, // viewport
        rootMargin: '100px', // start fetching slightly before section is visible
        threshold: 0.1 // trigger early for smoother experience
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                fetchMetrics(); // Now API call happens only when section is near viewport
                statsObserver.disconnect();
            }
        });
    }, observerOptions);

    statsObserver.observe(statsSection);

    // Fallback: check if section is already in viewport on page load
    requestAnimationFrame(() => {
        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            fetchMetrics();
        }
    });
}

function runCounter(element, endValue, duration) {
    element.runCounter({
        start: 0,
        end: endValue,
        duration: duration
    });
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let circles = [];
const maxCircles = window.innerWidth <= 768 ? 8 : 20;
const maxDistance = window.innerWidth <= 768 ? 200 : 300;

// Initialize canvas size before creating circles
const bannerContainer = document.getElementById('banner');
canvas.width = bannerContainer.clientWidth;
canvas.height = bannerContainer.clientHeight;
const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
    }
});
resizeObserver.observe(bannerContainer);

function Circle() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.velocity = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
    };
    this.radius = Math.random() * 5 + 2;
}

Circle.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = 'rgba(0, 76, 153, 0.5)';
    ctx.fill();
};

Circle.prototype.update = function () {
    if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
        this.velocity.x = -this.velocity.x;
    }
    if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
        this.velocity.y = -this.velocity.y;
    }
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.draw();
};

for (let i = 0; i < maxCircles; i++) {
    circles.push(new Circle());
}

function connectCircles() {
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const dx = circles[i].x - circles[j].x;
            const dy = circles[i].y - circles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < maxDistance) {
                ctx.beginPath();
                ctx.moveTo(circles[i].x, circles[i].y);
                ctx.lineTo(circles[j].x, circles[j].y);
                ctx.strokeStyle = 'rgba(0, 76, 153, 0.3)';
                ctx.stroke();
            }
        }
    }
}

// Throttle animation to 30fps for better performance
let lastFrameTime = 0;
const frameInterval = 1000 / 30; // 30fps = ~33ms per frame

function animate(currentTime) {
    requestAnimationFrame(animate);

    // Skip frame if not enough time has passed
    if (currentTime - lastFrameTime < frameInterval) return;
    lastFrameTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    circles.forEach(circle => {
        circle.update();
    });

    connectCircles();
}

requestAnimationFrame(animate);

// Footer accordion for mobile
document.addEventListener('DOMContentLoaded', function() {
    var footerGroups = document.querySelectorAll('.footer-group h3');
    footerGroups.forEach(function(header) {
        header.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                var group = this.parentElement;
                group.classList.toggle('active');
            }
        });
    });
});

// V2: Populate hero metrics from API on page load
function populateHeroMetrics() {
    var heroBreachCount = document.getElementById('hero-breach-count');
    var heroRecordCount = document.getElementById('hero-record-count');
    var benefitBreachCount = document.getElementById('benefit-breach-count');
    var heroDirectoryCount = document.getElementById('hero-directory-count');
    var toolsBreachCount = document.getElementById('tools-breach-count');
    if (!heroBreachCount && !heroRecordCount && !benefitBreachCount && !heroDirectoryCount && !toolsBreachCount) return;

    $.ajax(apiUrl)
        .done(function (response) {
            if (!metricsData) {
                metricsData = response;
            }
            renderLastBreachAdded();

            var breachCount = parseInt(response.Breaches_Count, 10);
            if (!isNaN(breachCount)) {
                var breachCountLabel = breachCount.toLocaleString() + '+';
                if (heroBreachCount) {
                    heroBreachCount.textContent = breachCountLabel;
                }
                if (benefitBreachCount) {
                    benefitBreachCount.textContent = breachCountLabel;
                }
                if (heroDirectoryCount) {
                    heroDirectoryCount.textContent = breachCountLabel;
                }
                if (toolsBreachCount) {
                    toolsBreachCount.textContent = breachCountLabel;
                }
            }
            if (heroRecordCount) {
                var breachRecords = parseInt(response.Breaches_Records, 10);
                var billions = (breachRecords / 1000000000).toFixed(1);
                heroRecordCount.textContent = billions + ' billion';
            }
        });
}

document.addEventListener('DOMContentLoaded', populateHeroMetrics);

// V2: Smooth scroll to top for CTA buttons
document.addEventListener('DOMContentLoaded', function() {
    var scrollBtns = document.querySelectorAll('.scroll-to-top');
    scrollBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var searchInput = document.getElementById('edhu');
            if (searchInput) {
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(function() { searchInput.focus(); }, 600);
            }
        });
    });
});
