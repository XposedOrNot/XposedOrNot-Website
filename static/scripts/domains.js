$(document).ready(function () {
    $('#domainModal').modal({
        show: true,
        backdrop: 'static',
        keyboard: false
    });
    $('.overlay').show();

    $('#domainModal').on('shown.bs.modal', function () {
        $('#domainInput').focus();
        setTimeout(function () {
            if (document.activeElement !== document.getElementById('domainInput')) {
                $('#domainInput').focus();
            }
        }, 100);
    });

    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)?[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

    $('#domainForm').on('submit', function (e) {
        e.preventDefault();
        var domainName = $('#domainInput').val().trim();

        if (domainRegex.test(domainName)) {
            $('#submitButton').attr("disabled", true);
            $('#spinner').show();

            $('#domain-display').text(domainName);
            var logoSrc = "https://img.logo.dev/" + domainName + "?size=200&token=pk_SfmfJZb2RYiEgGDl2nxd3Q";
            $("#logo").attr("src", logoSrc).hide();

            $("#logo").on('error', function () {
                $(this).hide();
            }).on('load', function () {
                $(this).show();
            });

            var breachApiUrl = 'https://api.xposedornot.com/v1/domain-breach-summary?d=' + domainName;

            $.ajax(breachApiUrl)
                .done(function (data) {
                    if (data.SearchStatus === "Success") {
                        if (data.sendDomains.breaches_details.length > 0 &&
                            data.sendDomains.breaches_details[0].breach_emails > 0) {
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
                            $('#record-count').text(totalRecords >= 10000 ? "10000+" : totalRecords);
                            $('#email-count').text(totalEmails >= 10000 ? "10000+" : totalEmails);
                            $('#last-exposure').text(lastExposure);

                            if (totalRecords >= 10000 || totalEmails >= 10000) {
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
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        const duration = 3000;

        // First burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors,
            shapes: ['square', 'circle'],
            ticks: 200
        });

        // Second burst after 500ms
        setTimeout(() => {
            confetti({
                particleCount: 80,
                angle: 60,
                spread: 80,
                origin: { x: 0, y: 0.6 },
                colors: colors,
                shapes: ['square', 'circle'],
                ticks: 200
            });
            confetti({
                particleCount: 80,
                angle: 120,
                spread: 80,
                origin: { x: 1, y: 0.6 },
                colors: colors,
                shapes: ['square', 'circle'],
                ticks: 200
            });
        }, 500);

        // Third burst after 1000ms
        setTimeout(() => {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.7 },
                colors: colors,
                shapes: ['square', 'circle'],
                ticks: 200,
                gravity: 1.2
            });
        }, 1000);
    }

    google.charts.load('current', {
        'packages': ['gauge']
    });
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
