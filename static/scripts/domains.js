$(document).ready(function () {
    $('#domainModal').modal('show');
    $('.overlay').show();

    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)?[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

    $('#domainForm').on('submit', function (e) {
        e.preventDefault();
        var domainName = $('#domainInput').val().trim(); 

        if (domainRegex.test(domainName)) {
            $('#submitButton').attr("disabled", true);
            $('#spinner').show();

            $('#domain-display').text(domainName);
            var logoSrc = "https://logo.clearbit.com/" + domainName;
            $("#logo").attr("src", logoSrc).show();

            $("#logo").on('error', function() {
                $(this).hide();
            }).on('load', function() {
                $(this).show();
            });

            var breachApiUrl = 'https://api.xposedornot.com/v1/domain-breach-summary?d=' + domainName;
            $.ajax(breachApiUrl)
                .done(function (data) {
                    if (data.SearchStatus === "Success" && data.sendDomains.breaches_details.length > 0) {
                        var breaches = data.sendDomains.breaches_details;
                        var totalBreaches = 0;
                        var totalRecords = 0;
                        var totalEmails = 0;
                        var lastExposure = "--";

                        breaches.forEach(function (breach) {
                            totalBreaches += breach.breach_count;
                            totalRecords += breach.breach_total;
                            totalEmails += breach.breach_emails;
                            lastExposure = breach.breach_last_seen;
                        });

                        $('#breach-count').text(totalBreaches);
                        $('#record-count').text(totalRecords >= 1000 ? "1000+" : totalRecords);
                        $('#email-count').text(totalEmails >= 1000 ? "1000+" : totalEmails);
                        $('#last-exposure').text(lastExposure);

                        if (totalRecords >= 1000 || totalEmails >= 1000) {
                            $('#note').show();
                        } else {
                            $('#note').hide();
                        }

                        updateGaugeChart(totalBreaches);

                        $('#domainModal').modal('hide');
                        $('.overlay').hide();
                        $('#content').removeClass('blurred');
                    } else {
                        handleNoBreach(domainName);
                    }
                })
                .fail(function (jqXHR) {
                    handleFail(jqXHR, domainName);
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
        resetForm();
    });

    $('#checkAnotherDomainBtn').on('click', function () {
        $('#domainModal').modal('show');
        $('.overlay').show();
    });

    $('#domainInput').on('input', function () {
        $(this).removeClass('is-invalid');
        $('#errorMessage').hide();
    });

    $('#checkAnotherDomainBtnInModal').on('click', function () {
        resetForm();
    });

    function handleNoBreach(domainName) {
        $('#searchedDomain').text(domainName);
        $('#domainForm').hide();
        $('#domainModalLabel').hide();
        $('#noBreachMessage').show();
        $('#checkAnotherDomainBtnInModal').show();
        triggerConfetti();
        resetCounts();
    }

    function handleFail(jqXHR, domainName) {
        if (jqXHR.status === 404) {
            handleNoBreach(domainName);
        } else if (jqXHR.status === 429) {
            var retryAfter = JSON.parse(jqXHR.responseText).retry_after_seconds;
            $('#errorMessage').text(`Rate limit exceeded. Please try again after ${retryAfter} seconds.`).show();
        } else {
            $("#alertMe").text("An error occurred. Please try again later.");
        }
        resetCounts();
    }

    function resetCounts() {
        $('#breach-count').text('-');
        $('#record-count').text('-');
        $('#email-count').text('-');
        $('#last-exposure').text('--');
        $('#note').hide();
    }

    function resetForm() {
        $('#noBreachMessage').hide();
        $('#domainForm').show();
        $('#domainModalLabel').show();
        $('#domainInput').val('').removeClass('is-invalid');
        $('#checkAnotherDomainBtnInModal').hide();
        $('#domainModal').modal('show');
        $('.overlay').show();
    }

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

    google.charts.load('current', { 'packages': ['gauge'] });
    google.charts.setOnLoadCallback(drawChart);

    var gaugeChart;
    var data;
    var options;

    function drawChart() {
        data = google.visualization.arrayToDataTable([
            ['Label', 'Value'],
            ['Risk Score', 0]
        ]);

        options = {
            width: 150,
            height: 150,
            greenFrom: 0,
            greenTo: 40,
            yellowFrom: 41,
            yellowTo: 100,
            redFrom: 101,
            redTo: 200,
            minorTicks: 10,
            max: 200
        };

        gaugeChart = new google.visualization.Gauge(document.getElementById('chart_div'));
        gaugeChart.draw(data, options);
    }

    function updateGaugeChart(value) {
        if (gaugeChart && data) {
            data.setValue(0, 1, Math.round(value));
            gaugeChart.draw(data, options);
        }
    }
});

