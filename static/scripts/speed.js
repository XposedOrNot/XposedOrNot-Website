function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

var stopwatchInterval = null;
var stopwatchStart = 0;
var speedChart = null;
var searchHistory = [];

function updateStopwatch() {
    var elapsed = Date.now() - stopwatchStart;
    var seconds = (elapsed / 1000).toFixed(3);
    $('#stopwatch').text(seconds + 's');
}

function startStopwatch() {
    $('#stopwatch').text('0.000s').addClass('running');
    $('#speed-result').removeClass('show');
    $('#breach-summary').html('').removeClass('safe danger');

    stopwatchStart = Date.now();
    stopwatchInterval = setInterval(updateStopwatch, 10);
}

function getSpeedComparison(ms) {
    if (ms <= 10) {
        return { class: 'fast', text: 'Light travels 3,000 km in this time' };
    } else if (ms <= 20) {
        return { class: 'fast', text: 'Faster than a hummingbird wing flap' };
    } else if (ms <= 30) {
        return { class: 'fast', text: 'Quicker than a camera flash' };
    } else if (ms <= 40) {
        return { class: 'fast', text: 'Faster than a honeybee wing beat' };
    } else if (ms <= 50) {
        return { class: 'fast', text: 'Beats the fastest human reflex' };
    } else if (ms <= 75) {
        return { class: 'fast', text: 'Faster than a blink of an eye' };
    } else if (ms <= 100) {
        return { class: 'fast', text: 'Quick as a eye blink completes' };
    } else if (ms <= 200) {
        return { class: 'fast', text: 'Faster than human reaction time' };
    } else if (ms <= 300) {
        return { class: 'medium', text: 'Duration of a single heartbeat' };
    } else if (ms <= 500) {
        return { class: 'medium', text: 'Time to snap your fingers' };
    } else if (ms <= 1000) {
        return { class: 'medium', text: 'Less than saying "Mississippi"' };
    } else if (ms <= 2000) {
        return { class: 'slow', text: 'About one deep breath' };
    } else if (ms <= 3000) {
        return { class: 'slow', text: 'Time to take a single step' };
    } else if (ms <= 4000) {
        return { class: 'slow', text: 'Duration of a short yawn' };
    } else if (ms <= 5000) {
        return { class: 'slow', text: 'Elevator doors closing time' };
    } else {
        return { class: 'slow', text: 'Slower than a sloth blink' };
    }
}

function stopStopwatch(finalTime) {
    clearInterval(stopwatchInterval);
    $('#stopwatch').removeClass('running');

    var seconds = (finalTime / 1000).toFixed(3);
    $('#stopwatch').text(seconds + 's');

    $('#speed-time').text(finalTime);

    var comparison = getSpeedComparison(finalTime);

    $('#speed-time').removeClass('fast medium slow').addClass(comparison.class);
    $('#speed-status').html('<span class="icon">💡</span><span class="text">' + comparison.text + '</span>');
    $('#speed-result').addClass('show');
}

function showBreachSummary(count) {
    var summary = $('#breach-summary');
    if (count === 0) {
        summary.removeClass('danger').addClass('safe').text('0 breaches');
    } else {
        var label = count === 1 ? ' breach' : ' breaches';
        summary.removeClass('safe').addClass('danger').text(count + label);
    }
}

function showHint() {
    var hints = [
        'Try another email to compare speeds',
        'Run it again to see consistency',
        'Each query is lightning fast',
        'Try a few more to build the graph',
        'Notice the speed pattern?'
    ];
    var idx = Math.min(searchHistory.length - 1, hints.length - 1);
    // Rotate through hints after exhausting the list
    if (searchHistory.length > hints.length) {
        idx = (searchHistory.length - 1) % hints.length;
    }
    $('#speed-hint').text(hints[idx]);
}

function initChart() {
    var ctx = document.getElementById('speedChart').getContext('2d');
    Chart.register(ChartDataLabels);
    speedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Response Time (ms)',
                data: [],
                backgroundColor: [],
                borderColor: [],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            var idx = context[0].dataIndex;
                            return searchHistory[idx] ? searchHistory[idx].email : '';
                        },
                        afterLabel: function(context) {
                            var idx = context.dataIndex;
                            return searchHistory[idx] ? searchHistory[idx].time : '';
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#fff',
                    font: { weight: 'bold', size: 12 },
                    formatter: function(value) {
                        return value + 'ms';
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'ms', color: 'rgba(255,255,255,0.7)' },
                    ticks: { color: 'rgba(255,255,255,0.7)' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: 'rgba(255,255,255,0.7)', maxRotation: 45 },
                    grid: { display: false }
                }
            }
        }
    });
}

function addToChart(email, responseTime) {
    // Show chart, hide image on first search
    if (searchHistory.length === 0) {
        $('#banner-img').hide();
        $('#chart-container').addClass('show');
        initChart();
    }

    // Truncate email for label
    var label = email.length > 15 ? email.substring(0, 12) + '...' : email;
    var timestamp = new Date().toLocaleTimeString();

    // Store full data
    searchHistory.push({
        email: email,
        time: timestamp,
        ms: responseTime
    });

    // Determine bar color based on speed
    var color = responseTime < 500 ? 'rgba(46, 204, 113, 0.8)' :
                (responseTime < 1000 ? 'rgba(241, 196, 15, 0.8)' : 'rgba(231, 76, 60, 0.8)');
    var borderColor = responseTime < 500 ? 'rgb(46, 204, 113)' :
                      (responseTime < 1000 ? 'rgb(241, 196, 15)' : 'rgb(231, 76, 60)');

    // Add to chart
    speedChart.data.labels.push(label);
    speedChart.data.datasets[0].data.push(responseTime);
    speedChart.data.datasets[0].backgroundColor.push(color);
    speedChart.data.datasets[0].borderColor.push(borderColor);
    speedChart.update();
}

window.onload = function () {
    setTimeout(function () {
        var t = performance.timing;
        var pageLoadTime = t.loadEventEnd - t.responseEnd;
        $('#stopwatch').text((pageLoadTime / 1000).toFixed(3) + 's');
        $('#speed-time').text(pageLoadTime);

        var comparison = getSpeedComparison(pageLoadTime);
        $('#speed-time').addClass(comparison.class);
        $('#speed-status').html('<span class="icon">💡</span><span class="text">' + comparison.text + '</span>');
        $('#speed-result').addClass('show');
    }, 0);
}

$(document).ready(function () {
    $("#searchMe").click(function (e) {
        e.preventDefault();
        var str = document.getElementById("edhu").value.toLowerCase().trim();

        if (!str) return;

        var url = 'https://api.xposedornot.com/v1/check-email/' + encodeURIComponent(str);

        startStopwatch();
        var startTime = Date.now();

        $.ajax(url).done(function (data) {
            var elapsed = Date.now() - startTime;
            stopStopwatch(elapsed);

            // Get count - API returns {"breaches": [["name1", "name2", ..."]]}
            var breachCount = 0;
            if (Array.isArray(data.breaches) && Array.isArray(data.breaches[0])) {
                breachCount = data.breaches[0].length;
            } else if (Array.isArray(data.breaches)) {
                breachCount = data.breaches.length;
            } else if (typeof data.breaches === 'number') {
                breachCount = data.breaches;
            }
            showBreachSummary(breachCount);
            addToChart(str, elapsed);
            showHint();

        }).fail(function (xhr) {
            var elapsed = Date.now() - startTime;
            stopStopwatch(elapsed);
            addToChart(str, elapsed);

            if (xhr.status === 404) {
                showBreachSummary(0);
            } else if (xhr.status === 429) {
                $('#breach-summary').removeClass('safe').addClass('danger').text('Rate limited');
            } else {
                $('#breach-summary').removeClass('safe').addClass('danger').text('Error');
            }
            showHint();
        });
    });
});
