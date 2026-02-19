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
                    $this.text(Math.floor(this.counter));
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
    $('#message-text').val("We'll notify you instantly if your email appears in any new data breach. You can unsubscribe anytime. This service is completely free.");
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
            $('#message-text').val("Please enter a valid email address to receive alerts.");
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
                $('#message-text').val(ALERT_MESSAGES.subscribeSuccess);
                $("#h2head").attr("class", "modal-header-success");
                $("#alertMe").hide();
                $("#alertMeClose").show();


                $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
                $("#alertMe_i2").addClass("fa fa-bell ring");
            })
            .fail((jqXHR) => {
                let message = ALERT_MESSAGES.alreadySubscribed;
                let headerClass = "modal-header-success";

                // Check if response indicates email delivery failure
                try {
                    const response = jqXHR.responseJSON || JSON.parse(jqXHR.responseText);
                    if (response && response.status === "Error") {
                        message = ALERT_MESSAGES.unableToDeliver;
                        headerClass = "modal-header-danger";
                    }
                } catch (e) {
                    // If parsing fails, use default (already subscribed)
                }

                $('#message-text').val(message);
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

    $("#searchMe").click(function (event) {
        event.preventDefault();
        let email = $("#edhu").val().toLowerCase().trim();
        let apiUrl = apiUrlBase + encodeURIComponent(email);
        $('#recipient-name').val(email);

        $("#hhead").attr("class", "modal-header modal-header-success");
        $("#dismiss").attr("class", "btn btn-success");
        $("#mbody, #warn, #info").hide();
        $("#succ, #spins, #alert_").show();
        $("#ssvisible").html('<h2 id="thedudalModalLabel">Searching ...</h2>');
        updateEmailBadge(email);
        updateBreachBadge('No breaches found!');


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

        $(this).css("border", isValid ? "2px solid green" : "1px solid red");
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
    });

    $("#detailedReport").click(function () {
        let url = "data-breaches-risks.html?email=" + $("#edhu").val().toLowerCase();
        window.open(url, '_blank').opener = null;
    });
});


function updateEmailBadge(email) {
    $('#data_email').html('<b>Email Checked </b> <span class="badge">' + escapeHtml(email) + '</span>');
}

function updateBreachBadge(text) {
    $('#data_breach').html('<b>Breaches Found </b> <span class="badge">' + escapeHtml(text) + '</span>');
}



function updateModalForInvalidEmail(email) {
    $("#hhead").attr("class", "modal-header modal-header-danger");
    $("#dismiss").attr("class", "btn btn-primary");
    updateEmailBadge(email);
    updateBreachBadge('Not a valid email to check!');
    $("#succ, #spins, #warn, #alert_").hide();
    $("#info").addClass("modal-header-danger").show();
    $("#mbody").show();
}

const STATUS_MESSAGES = {
    searching: "Checking your email against our breach database...",
    success: "🎉 Great news! Your email wasn't found in any known data breaches. Stay protected by setting up free alerts.",
    invalidEmail: "Please enter a valid email address to check",
    throttled: "Please wait a moment before trying again",
    serverError: "We're experiencing technical difficulties. Please try again in a few minutes.",
    breachFound: "Your email was found in the following data breaches. We recommend changing your passwords immediately:"
};

const ALERT_MESSAGES = {
    subscribe: "Get instant notifications if your email appears in future data breaches",
    subscribeSuccess: "Verification email sent! Check your inbox to activate free breach monitoring.",
    alreadySubscribed: "You're already protected! This email is registered for breach alerts.",
    unableToDeliver: "Unable to send email to this address. Please check and try again."
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
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
        script.integrity = 'sha512-GVZQ4XLMDgRy6Wb1kvhJkV9rkKwncP77Xou+v9merH3+/Lcj9AnsbU2UHDvhg6NzVFQP03gvAhVAE47BvO6w/A==';
        script.crossOrigin = 'anonymous';
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
    $("#data_email, #data_breach").removeClass('alert-danger alert-success').addClass('alert-primary');

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

        $('#data_email')
            .removeClass('alert-primary alert-danger')
            .addClass('alert-success')
            .html('<b>Searched Email </b> <span class="badge bg-success text-white">' + escapeHtml(email) + '</span>');

        $('#data_breach')
            .removeClass('alert-primary alert-danger')
            .addClass('alert-success')
            .html('<b>Breaches Found </b> <span class="badge bg-success text-white">No breaches found!</span>');

        $("#detailedReport").hide();
        $("#warn").hide();
        $("#info").hide();
        $("#succ").show();
        $("#alert_").show();
        $("#succ").html(STATUS_MESSAGES.success);

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

        $('#data_email')
            .removeClass('alert-primary alert-success')
            .addClass('alert-danger')
            .html('<b>Searched Email </b> <span class="badge bg-danger text-white">' + escapeHtml(email) + '</span>');

        warningMessage = '<p class="breach-intro">Your email appeared in these data breaches:</p><div class="breach-tags">';
        $("#detailedReport").show();
        $('#data_breach')
            .removeClass('alert-primary alert-success')
            .addClass('alert-danger')
            .html('<b>Breaches Found </b> <span class="badge bg-danger text-white">' + breachSummary.split(";").length + '</span>');

        const breaches = breachSummary.split(";");
        for (let i = 0; i < breaches.length; i++) {
            warningMessage += '<a class="breach-tag" rel="noopener" target="_blank" title="Click for details" href="breach.html#' + encodeURIComponent(breaches[i]) + '">' + escapeHtml(breaches[i]) + '<span class="sr-only"> (opens in new tab)</span></a>';
        }
        warningMessage += '</div>';

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

}


function processSearchError(error, email) {
    var isDark = document.body.getAttribute('data-theme') === 'dark';
    if (error.status === 429) {
        $("#mbody").show();
        $("#spins").hide();
        $("#succ").html("You are currently being throttled. Please slow down and try again !");
        $('#data_email').html(`<b>Email Checked </b> <span class="badge">${escapeHtml(email)}</span>`);
    } else if (error.status === 502) {
        $("#hhead").attr("class", "modal-header modal-header-danger");
        $("#dismiss").attr("class", "btn btn-primary");
        $("#mbody, #info").show();
        $("#spins, #succ").hide();
        $("#ssvisible").html('<h2 id="thedudalModalLabel">Oops unexpected error...</h2>');
        $("#info").html("Embarassing and looks like something is not right at server end. I have notified the right person to check on this. Please try again after some time.");
        $('#data_email').html(`<b>Email Checked </b> <span class="badge">${escapeHtml(email)}</span>`);
    } else {
        // No breaches found - show same celebration as processSearchResponse
        $(".modal-content").css({
            'background-color': isDark ? '#131c15' : '#f8fff8',
            'border': isDark ? '2px solid #1b5e20' : '2px solid #28a745'
        });

        $("#hhead").attr("class", "modal-header modal-header-success");
        $("#dismiss").attr("class", "btn btn-success");
        $("#ssvisible").html('<h2 id="thedudalModalLabel"><i class="fas fa-smile-beam fa-2x text-success" style="background-color: white; border-radius: 50%; padding: 5px;" aria-hidden="true"></i>&nbsp;&nbsp;Yay! No Breaches Found</h2>');

        $('#data_email')
            .removeClass('alert-primary alert-danger')
            .addClass('alert-success')
            .html('<b>Searched Email </b> <span class="badge bg-success text-white">' + escapeHtml(email) + '</span>');

        $('#data_breach')
            .removeClass('alert-primary alert-danger')
            .addClass('alert-success')
            .html('<b>Breaches Found </b> <span class="badge bg-success text-white">No breaches found!</span>');

        $("#detailedReport").hide();
        $("#warn").hide();
        $("#spins").hide();
        $("#mbody").show();
        $("#succ").show();
        $("#alert_").show();
        $("#succ").html(STATUS_MESSAGES.success);

        // Fire confetti animation
        setTimeout(fireConfetti, 100);
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
        });
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
    const rect = statsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
        fetchMetrics();
    }
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
function resizeCanvas() {
    var container = document.getElementById('banner');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

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
    if (!heroBreachCount && !heroRecordCount) return;

    $.ajax('https://api.xposedornot.com/v1/metrics')
        .done(function (response) {
            // Cache for stats section
            if (!metricsData) {
                metricsData = response;
            }

            var breachCount = parseInt(response.Breaches_Count, 10);
            if (heroBreachCount) {
                heroBreachCount.textContent = breachCount.toLocaleString() + '+';
            }
            var benefitBreachCount = document.getElementById('benefit-breach-count');
            if (benefitBreachCount) {
                benefitBreachCount.textContent = breachCount.toLocaleString() + '+';
            }
            if (heroRecordCount) {
                var breachRecords = parseInt(response.Breaches_Records, 10);
                // Convert to billions for readability
                var billions = (breachRecords / 1000000000).toFixed(1);
                heroRecordCount.textContent = billions + ' billion';
            }
        })
        .fail(function () {
            // Keep fallback values in HTML
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
