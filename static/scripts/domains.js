$(document).ready(function () {
    $('#domainModal').modal('show');
    $('.overlay').show();

    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)?[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

    $('#domainForm').on('submit', function (e) {
        e.preventDefault();
        var domainName = $('#domainInput').val();

        if (domainRegex.test(domainName)) {
            $('#submitButton').attr("disabled", true);
            $('#spinner').show();

            $('#domain-display').text(domainName);
            var logoSrc = "https://logo.clearbit.com/" + domainName;
            $("#logo").attr("src", logoSrc).show();

            var breachApiUrl = 'https://api.xposedornot.com/v1/domain-breach-summary?d=' + domainName;
            $.ajax(breachApiUrl)
                .done(function (data) {
                    var breaches = data.sendDomains.breaches_details;
                    var totalBreaches = 0;
                    var totalRecords = 0;
                    var totalEmails = 0;

                    breaches.forEach(function (breach) {
                        totalBreaches++;
                        totalRecords += parseInt(breach.breach_pastes);
                        totalEmails += parseInt(breach.breach_emails);
                    });

                    $('#breach-count').text(totalBreaches);
                    $('#record-count').text(totalRecords >= 50 ? "50+" : totalRecords);
                    $('#email-count').text(totalEmails >= 50 ? "50+" : totalEmails);

                    var lastExposure = breaches.length > 0 ? breaches[0].last_exposure : "--";
                    $('#last-exposure').text(lastExposure);

                    $('#domainModal').modal('hide');
                    $('.overlay').hide();
                    $('#content').removeClass('blurred');
                })
                .fail(function (jqXHR) {
                    if (jqXHR.status === 404) {
                        $('#searchedDomain').text(domainName);
                        $('#domainForm').hide();
                        $('#domainModalLabel').hide();
                        $('#noBreachMessage').show();
                        triggerConfetti();
                    } else if (jqXHR.status === 429) {
                        var retryAfter = JSON.parse(jqXHR.responseText).retry_after_seconds;
                        $('#errorMessage').text(`Rate limit exceeded. Please try again after ${retryAfter} seconds.`).show();
                    } else {
                        $("#alertMe").text("An error occurred. Please try again later.");
                    }
                    $('#breach-count').text('-');
                    $('#record-count').text('-');
                    $('#email-count').text('-');
                    $('#last-exposure').text('--');
                })
                .always(function () {
                    $('#submitButton').attr("disabled", false);
                    $('#spinner').hide();
                });
        } else {
            $('#domainInput').addClass('is-invalid');
        }
    });

    $('#checkAnotherDomain').on('click', function () {
        $('#noBreachMessage').hide();
        $('#domainForm').show();
        $('#domainModalLabel').show();
        $('#domainInput').val('').removeClass('is-invalid');
        $('#domainModal').modal('show');
        $('.overlay').show();
    });

    $('#checkAnotherDomainBtn').on('click', function () {
        $('#domainModal').modal('show');
        $('.overlay').show();
    });

    $('#domainInput').on('input', function () {
        $(this).removeClass('is-invalid');
        $('#errorMessage').hide();
    });

    function triggerConfetti() {
        var end = Date.now() + 5 * 1000;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
});

