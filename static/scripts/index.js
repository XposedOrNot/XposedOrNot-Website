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
    $('#message-text').val("To ensure you don't miss any crucial alerts about potential data breaches, kindly verify your email address and activate your subscription by clicking 'Alert Me'.");
    $("#alertMe").show();
    $("#alertMeClose, #a_succ").hide();
});

$('#alertMeModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    const modal = $(this);
    const email = $("#edhu").val().toLowerCase();
    modal.find('.modal-body input').val(email);
    $('#thedudalModal').modal('hide');
});

const isEmpty = (value) => value == null || (typeof value === "string" && value.trim().length === 0);

function _turnstileCb() {
    const turnstileStatus = turnstile.render('#turns', {
        sitekey: '0x4AAAAAAAA_T_0Qt4kJbXno',
        theme: 'light',
    });

    let timerId = setInterval(() => {
        $('#alertMe').prop('disabled', true);
        const turnstileResponse = turnstile.getResponse(turnstileStatus);
        if (!isEmpty(turnstileResponse)) {
            $('#alertMe').prop('disabled', false);
            clearInterval(timerId);
        }
    }, 1000);
}

$(document).ready(function () {

    $('#alertMeModal').on('keydown', (event) => {
        const enterKeyCode = 13;
        if (event.keyCode === enterKeyCode) {
            event.preventDefault();
            $('#alertMe').click();
        }
    });

    $("#alertMe").click((event) => {
        event.preventDefault();

        const inputValue = $("#recipient-name").val().toLowerCase();

        const apiUrl = 'https://api.xposedornot.com/v1/alertme/' + encodeURIComponent(inputValue);

        $.ajax(apiUrl)
            .done(() => {
                $('#message-text').val(ALERT_MESSAGES.subscribeSuccess);
                $("#h2head").attr("class", "modal-header-success");
                $("#alertMe").hide();
                $("#alertMeClose").show();
            })
            .fail(() => {
                $('#message-text').val(ALERT_MESSAGES.alreadySubscribed);
                $("#h2head").attr("class", "modal-header-success");
                $("#alertMe").hide();
                $("#alertMeClose").show();
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

        $("#hhead").addClass("modal-header-success");
        $("#dismiss").addClass("btn-primary btn-success");
        $("#mbody, #warn, #info").hide();
        $("#succ, #spins, #alert_").show();
        $("#ssvisible").html("<h2>Searching ...</h2>");
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
        $(targetButton).prop('disabled', !isValid);
    });

    handleVideoModal();

    $("#detailedReport").click(function () {
        let url = "data-breaches-risks.html?email=" + $("#edhu").val().toLowerCase();
        window.open(url, '_blank').opener = null;
    });
});


function updateEmailBadge(email) {
    $('#data_email').html('<b>Searched Email </b> <span class="badge" style="float:right">' + email + '</span>');
}

function updateBreachBadge(text) {
    $('#data_breach').html('<b>Exposed Breaches </b> <span class="badge" style="float:right">' + text + '</span>');
}



function updateModalForInvalidEmail(email) {
    $("#hhead").addClass("modal-header-danger");
    $("#dismiss").addClass("btn btn-primary");
    updateEmailBadge(email);
    updateBreachBadge('Not a valid email to check!');
    $("#succ, #spins, #warn, #alert_").hide();
    $("#info").addClass("modal-header-danger").show();
    $("#mbody").show();
}

const STATUS_MESSAGES = {
    searching: "Searching for your email in our database...",
    success: "🎉 Good news! Your email hasn't been found in any public data breaches.",
    invalidEmail: "Please enter a valid email address to check",
    throttled: "Please wait a moment before trying again",
    serverError: "We're experiencing technical difficulties. Please try again in a few minutes.",
    breachFound: "Important: Your email was found in the following data breaches:"
};

const ALERT_MESSAGES = {
    subscribe: "Get instant notifications if your email appears in future data breaches",
    subscribeSuccess: "Email verification sent! Please check your inbox to confirm alerts",
    alreadySubscribed: "You're already protected! This email is registered for breach alerts"
};

function processSearchResponse(response, email) {
    const jsonResponse = response;

    const breachSummary = jsonResponse.BreachesSummary.site;
    const pasteSummaryCount = jsonResponse.PastesSummary.cnt;

    let warningMessage = "";
    if (breachSummary.toString().length < 0) {

        $('#data_breach').html('<b>Exposed Breaches </b> <span class="badge" style="float:right">No breaches found!</span>')
    } else {

        $("#hhead").attr("class", "modal-header-danger");
        $("#dismiss").attr("class", "btn-danger btn");
        $("#mbody").show();
        $("#ssvisible").html("<h2>Email Security Check Results</h2>");
        $("#warn").show();
        $("#succ").hide();
        $("#spins").hide();
        $("#info").hide();
        $("#alert_").show();
        $('#data_email').html('<b>Searched Email </b> <span class="badge" style="float:right">' + email + '</span>');

        if (breachSummary.length > 0) {
            $("#detailedReport").show();
            $('#data_breach').html('Exposed Breaches <span class="badge" style="float:right">' + breachSummary.split(";").length + '</span>');
            warningMessage = 'Below shown are the data breaches in which this email was exposed:   <br><br>';

            const breaches = breachSummary.split(";")
            for (let i = 0; i < breaches.length; i++) {
                warningMessage += '<a rel="noopener" target="_blank" title="Pls click here for more details..." href=xposed.html#' + breaches[i] + '>' + breaches[i] + '</a>';
                if (i !== breaches.length - 1) {
                    warningMessage += ', ';
                }
            }
        }

        if (pasteSummaryCount.toString() == 0 && breachSummary.length < 1) {
            $("#hhead").attr("class", "modal-header-success");
            $("#dismiss").attr("class", "btn btn-success");
            $('#paste_breach').html('<b>Exposed Pastes </b> <span class="badge" style="float:right">No pastes found!</span>');
            $("#detailedReport").hide();
            $("#warn").hide();
            $("#succ").show();
            $("#succ").html(STATUS_MESSAGES.success);
        }

        const pasteCount = jsonResponse.PastesSummary.cnt;
        if (pasteCount > 0) {
            $("#detailedReport").show();
            $('#paste_breach').html('<b>Exposed Pastes </b> <span class="badge" style="float:right">' + pasteCount + '</span>');
            warningMessage += '<br><br>' + ' </b>Searched email has been exposed in public pastes shown below <br>';

            const pastes = jsonResponse.PastesSummary.tweet_id.split(";")
            for (let i = 0; i < pastes.length; i++) {
                warningMessage += '<a  rel="noopener" target="_blank" title="Pls click here to open" href=https://pastebin.com/' + pastes[i] + '>' + pastes[i] + '</a>' + ' ; ';
            }
        }

        if (warningMessage.length > 0) {
            $("#warn").html(warningMessage);
            $("#warn").show();
        }
    }

    if (response.status === 429) {
        $("#mbody").show();
        $("#spins").hide();
        $("#succ").html("You are currently being throttled. Please slow down and try again !")
        $('#data_email').html('<b>Searched Email </b> <span class="badge" style="float:right">' + email + '</span>')
    }
}


function processSearchError(error, email) {
    if (error.status === 429) {
        $("#mbody").show();
        $("#spins").hide();
        $("#succ").html("You are currently being throttled. Please slow down and try again !");
        $('#data_email').html(`<b>Searched Email </b> <span class="badge" style="float:right">${email}</span>`);
    } else if (error.status === 502) {
        $("#hhead").addClass("modal-header-primary");
        $("#dismiss").addClass("btn btn-primary");
        $("#mbody, #info").show();
        $("#spins, #succ").hide();
        $("#hhead").addClass("modal-header-danger");
        $("#ssvisible").html("<h2>Oops unexpected error...</h2>");
        $("#info").html("Embarassing and looks like something is not right at server end. I have notified the right person to check on this. Please try again after some time.");
        $('#data_email').html(`<b>Searched Email </b> <span class="badge" style="float:right">${email}</span>`);
    } else {
        $("#hhead").attr("class", "modal-header-success");
        $("#dismiss").attr("class", "btn btn-success");
        $("#detailedReport").hide();
        $("#mbody").show();
        $("#ssvisible").html("<h2>Search results for you</h2>");
        $("#spins, #warn").hide();
        $('#data_email').html(`<b>Searched Email </b> <span class="badge" style="float:right">${email}</span>`);
        $('#data_breach').html('<b>Exposed Breaches </b> <span class="badge" style="float:right">No breaches found!</span>');
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
$.ajax(apiUrl)
    .done(function (response) {
        let pastesCount = parseInt(response.Pastes_Count.replace(/,/g, ''), 10);
        let pastesRecords = parseInt(response.Pastes_Records, 10);
        let breachesCount = parseInt(response.Breaches_Count, 10);
        let breachesRecords = parseInt(response.Breaches_Records, 10);

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
    });

function runCounter(element, endValue, duration) {
    element.runCounter({
        start: 0,
        end: endValue,
        duration: duration
    });
}

const headingElement = $("#heading");
const colors = ["#FFC0CB"];
const replacementWords = ["private", "confidential", "sensitive"];
let currentIndex = 0;
let iterationCount = 0;
let intervalId;

intervalId = setInterval(() => {
    const currentWord = replacementWords[currentIndex];
    const nextWord = replacementWords[(currentIndex + 1) % replacementWords.length];
    headingElement.html(headingElement.html().replace(currentWord, `<span style="color:${colors[0]}">${nextWord}</span>`));

    currentIndex = (currentIndex + 1) % replacementWords.length;
    iterationCount++;

    if (iterationCount >= 9) {
        clearInterval(intervalId);
    }
}, 2000);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let circles = [];
const maxCircles = 20;
const maxDistance = 300;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    circles.forEach(circle => {
        circle.update();
    });

    connectCircles();
}

animate();

function resizeCanvas() {
    var container = document.getElementById('banner');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
