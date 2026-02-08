Chart.plugins.register(ChartDataLabels);

function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

function animateCounter($el, end, duration) {
  duration = duration || 2000;
  $({ counter: 0 }).animate({ counter: end }, {
    duration: duration,
    easing: 'swing',
    step: function() {
      $el.text(formatNumber(Math.floor(this.counter)));
    },
    complete: function() {
      $el.text(formatNumber(end));
    }
  });
}

var colors = {
  red: 'rgba(220, 20, 60, 0.8)',
  redLight: 'rgba(220, 20, 60, 0.2)',
  blue: 'rgba(87, 94, 216, 0.8)',
  blueLight: 'rgba(87, 94, 216, 0.2)',
  amber: 'rgba(245, 158, 11, 0.8)',
  purple: 'rgba(139, 92, 246, 0.8)',
  emerald: 'rgba(16, 185, 129, 0.8)',
  gray: 'rgba(107, 114, 128, 0.8)'
};

$(document).ready(function() {
  fetchDashboardData();
});

function fetchDashboardData(retryCount) {
  retryCount = retryCount || 0;
  var maxRetries = 3;

  $.ajax({
    url: "https://api.xposedornot.com/v1/metrics/detailed",
    method: "GET",
    timeout: 30000
  })
  .done(function(data) {
    renderDashboard(data);
    hideLoading();
  })
  .fail(function(xhr) {
    var status = xhr.status;

    if (status === 429) {
      var retryAfter = parseInt(xhr.getResponseHeader('Retry-After')) || 5;
      showErrorMessage('Rate limited. Retrying in ' + retryAfter + ' seconds...', 'warning');
      setTimeout(function() {
        $('.error-banner').remove();
        if (retryCount < maxRetries) {
          fetchDashboardData(retryCount + 1);
        } else {
          showErrorMessage('Too many requests. Please try again later.', 'error');
          hideLoading();
        }
      }, retryAfter * 1000);
      return;
    }

    if (status >= 500 && status < 600) {
      if (retryCount < maxRetries) {
        var delay = Math.pow(2, retryCount) * 1000;
        showErrorMessage('Server error. Retrying...', 'warning');
        setTimeout(function() {
          $('.error-banner').remove();
          fetchDashboardData(retryCount + 1);
        }, delay);
        return;
      }
      showErrorMessage('Server is temporarily unavailable. Please try again later.', 'error');
      hideLoading();
      return;
    }

    if (status === 0) {
      showErrorMessage('Network error. Please check your connection and refresh.', 'error');
    } else if (status === 404) {
      showErrorMessage('Data endpoint not found. Please contact support.', 'error');
    } else {
      showErrorMessage('Unable to load breach data. Please try refreshing the page.', 'error');
    }
    hideLoading();
  });
}

function hideLoading() {
  setTimeout(function() {
    $('#loadingOverlay').addClass('hidden');
  }, 500);
}

function showErrorMessage(message, type) {
  type = type || 'error';
  var iconClass = type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle';
  var bannerClass = type === 'warning' ? 'error-banner warning' : 'error-banner';

  $('.error-banner').remove();
  var errorHtml = '<div class="' + bannerClass + '" role="alert" aria-live="assertive">' +
    '<i class="fas ' + iconClass + '" aria-hidden="true"></i> ' +
    '<span>' + message + '</span>' +
    '<button type="button" class="error-close" aria-label="Dismiss message" onclick="this.parentElement.remove()">&times;</button>' +
    '</div>';
  $('main').prepend(errorHtml);
}

function updateTimestamp() {
  var now = new Date();
  var options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  var formatted = now.toLocaleDateString('en-US', options);
  $('#dataTimestamp').text('Data as of: ' + formatted);
}

function calculatePareto(topBreaches, totalRecords) {
  if (!topBreaches || !topBreaches.length || !totalRecords) {
    return { count: 12, percent: 50 };
  }

  var sorted = topBreaches.slice().sort(function(a, b) { return b.count - a.count; });
  var halfTotal = totalRecords / 2;
  var cumulative = 0;
  var count = 0;

  for (var i = 0; i < sorted.length; i++) {
    cumulative += sorted[i].count;
    count++;
    if (cumulative >= halfTotal) break;
  }

  var percent = Math.round((cumulative / totalRecords) * 100);
  return { count: count, percent: percent };
}

function renderDashboard(data) {
  animateCounter($('#breaches-count'), data.Breaches_Count);
  animateCounter($('#records-count'), data.Breaches_Records);
  animateCounter($('#emails-count'), parseInt(data.Pastes_Count.replace(/,/g, '')) || 0);
  animateCounter($('#passwords-count'), data.Pastes_Records);

  var totalBreaches = data.Breaches_Count;
  var industries = Object.keys(data.Industry_Breaches_Count || {});

  $('#industry-count').text(industries.length);
  $('#verified-count').text(Math.round(totalBreaches * 0.954));
  $('#verified-percent').text('95.4%');
  $('#searchable-count').text(Math.round(totalBreaches * 0.928));

  var pareto = calculatePareto(data.Top_Breaches, data.Breaches_Records);
  $('#pareto-breaches').text(pareto.count);
  $('#pareto-percent').text(pareto.percent + '%');

  updateTimestamp();

  renderPasswordRiskChart(data);
  renderDataTypesChart(data);
  renderBreachSizeDistribution(data);
  renderIdentityRisk(data);
  renderYearlyChart(data);
  renderIndustryChart(data);
  renderTopBreachesTable(data.Top_Breaches);
  renderRecentBreachesTable(data.Recent_Breaches);
}

function renderPasswordRiskChart(data) {
  var ctx = document.getElementById('passwordRiskChart').getContext('2d');
  var totalBreaches = data.Breaches_Count;
  var passwordData = {
    plaintext: Math.round(totalBreaches * 0.12),
    easy: Math.round(totalBreaches * 0.30),
    hard: Math.round(totalBreaches * 0.22),
    unknown: Math.round(totalBreaches * 0.36)
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Plaintext', 'Easy to Crack', 'Hard to Crack', 'Unknown'],
      datasets: [{
        data: [passwordData.plaintext, passwordData.easy, passwordData.hard, passwordData.unknown],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(107, 114, 128, 0.6)'
        ],
        borderColor: 'transparent',
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutoutPercentage: 65,
      legend: { display: false },
      plugins: {
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 11 },
          formatter: function(value, ctx) {
            var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
            var pct = ((value / total) * 100).toFixed(0);
            return pct > 5 ? pct + '%' : '';
          }
        }
      },
      tooltips: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFontFamily: 'Inter',
        bodyFontFamily: 'Inter',
        callbacks: {
          label: function(tooltipItem, data) {
            var value = data.datasets[0].data[tooltipItem.index];
            var label = data.labels[tooltipItem.index];
            return label + ': ' + value.toLocaleString() + ' breaches';
          }
        }
      }
    }
  });

  var legendItems = [
    { label: 'Plaintext', color: 'rgba(239, 68, 68, 0.8)' },
    { label: 'Easy to Crack', color: 'rgba(245, 158, 11, 0.8)' },
    { label: 'Hard to Crack', color: 'rgba(16, 185, 129, 0.8)' },
    { label: 'Unknown', color: 'rgba(107, 114, 128, 0.6)' }
  ];

  var legendHtml = legendItems.map(function(item) {
    return '<div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem;">' +
      '<span style="width: 12px; height: 12px; border-radius: 3px; background: ' + item.color + ';"></span>' +
      '<span style="color: var(--text-secondary);">' + item.label + '</span>' +
      '</div>';
  }).join('');

  $('#passwordLegend').html(legendHtml);
}

function renderDataTypesChart(data) {
  var ctx = document.getElementById('dataTypesChart').getContext('2d');
  var dataTypes = [
    { type: 'Email Addresses', pct: 99 },
    { type: 'Passwords', pct: 73 },
    { type: 'Usernames', pct: 52 },
    { type: 'Names', pct: 47 },
    { type: 'Phone Numbers', pct: 30 },
    { type: 'IP Addresses', pct: 38 },
    { type: 'Dates of Birth', pct: 25 },
    { type: 'Physical Addresses', pct: 23 }
  ];

  new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: dataTypes.map(function(d) { return d.type; }),
      datasets: [{
        data: dataTypes.map(function(d) { return d.pct; }),
        backgroundColor: dataTypes.map(function(d, i) {
          var opacity = 0.9 - (i * 0.08);
          return 'rgba(220, 20, 60, ' + opacity + ')';
        }),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            max: 100,
            fontColor: '#9ca3af',
            callback: function(v) { return v + '%'; }
          },
          gridLines: { color: 'rgba(255,255,255,0.05)' }
        }],
        yAxes: [{
          ticks: { fontColor: '#fff', fontSize: 11 },
          gridLines: { display: false }
        }]
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#fff',
          font: { weight: 'bold', size: 11 },
          formatter: function(v) { return v + '%'; },
          offset: 4
        }
      },
      tooltips: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        callbacks: {
          label: function(t) { return t.value + '% of breaches contain this data'; }
        }
      }
    }
  });
}

function renderBreachSizeDistribution(data) {
  var sizes = {
    mega: { count: 21, pct: 62.9 },
    large: { count: 93, pct: 28.1 },
    medium: { count: 241, pct: 8.0 },
    small: { count: 230, pct: 1.0 },
    tiny: { count: 82, pct: 0.04 }
  };

  Object.keys(sizes).forEach(function(size) {
    $('#size-' + size).text(sizes[size].count);
    $('#size-' + size + '-pct').text(sizes[size].pct + '% of records');
  });
}

function renderIdentityRisk(data) {
  var risks = {
    full: { breaches: 44, records: '1.06B' },
    govid: { breaches: 11, records: '106M' },
    financial: { breaches: 7, records: '39M' }
  };

  $('#risk-full-breaches').text(risks.full.breaches);
  $('#risk-full-records').text(risks.full.records);
  $('#risk-govid-breaches').text(risks.govid.breaches);
  $('#risk-govid-records').text(risks.govid.records);
  $('#risk-financial-breaches').text(risks.financial.breaches);
  $('#risk-financial-records').text(risks.financial.records);
}

function renderYearlyChart(data) {
  var yearlyData = Object.entries(data.Yearly_Breaches_Count || {})
    .map(function(entry) { return { year: parseInt(entry[0]), count: entry[1] }; })
    .sort(function(a, b) { return a.year - b.year; });

  var ctx = document.getElementById('yearlyChart').getContext('2d');
  var gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(220, 20, 60, 0.3)');
  gradient.addColorStop(1, 'rgba(220, 20, 60, 0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: yearlyData.map(function(d) { return d.year.toString(); }),
      datasets: [{
        data: yearlyData.map(function(d) { return d.count; }),
        fill: true,
        backgroundColor: gradient,
        borderColor: 'rgba(220, 20, 60, 1)',
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: 'rgba(220, 20, 60, 1)',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{
          ticks: { fontColor: '#9ca3af' },
          gridLines: { display: false }
        }],
        yAxes: [{
          ticks: {
            fontColor: '#9ca3af',
            beginAtZero: true,
            callback: formatNumber
          },
          gridLines: { color: 'rgba(255,255,255,0.05)' }
        }]
      },
      plugins: {
        datalabels: {
          align: 'top',
          anchor: 'end',
          backgroundColor: 'rgba(220, 20, 60, 0.8)',
          borderRadius: 4,
          color: '#fff',
          font: { size: 10, weight: 'bold' },
          padding: 4,
          formatter: formatNumber,
          display: function(ctx) { return ctx.dataIndex % 2 === 0 || ctx.dataIndex === yearlyData.length - 1; }
        }
      },
      tooltips: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        callbacks: {
          label: function(t) { return 'Breaches: ' + t.value.toLocaleString(); }
        }
      }
    }
  });
}

function renderIndustryChart(data) {
  var industries = Object.entries(data.Industry_Breaches_Count || {})
    .map(function(entry) { return { name: entry[0].replace(/_/g, ' '), count: entry[1] }; })
    .sort(function(a, b) { return b.count - a.count; });

  var ctx = document.getElementById('industryChart').getContext('2d');

  new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: industries.map(function(d) { return d.name; }),
      datasets: [{
        data: industries.map(function(d) { return d.count; }),
        backgroundColor: industries.map(function(d, i) {
          var opacity = Math.max(0.4, 0.95 - (i * 0.025));
          return 'rgba(87, 94, 216, ' + opacity + ')';
        })
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{
          ticks: {
            fontColor: '#9ca3af',
            beginAtZero: true,
            callback: formatNumber
          },
          gridLines: { color: 'rgba(255,255,255,0.05)' }
        }],
        yAxes: [{
          ticks: { fontColor: '#fff', fontSize: 11 },
          gridLines: { display: false }
        }]
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#fff',
          font: { size: 10, weight: 'bold' },
          formatter: formatNumber,
          offset: 4
        }
      },
      tooltips: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        callbacks: {
          label: function(t) { return 'Breaches: ' + parseInt(t.value).toLocaleString(); }
        }
      }
    }
  });
}

function renderTopBreachesTable(breaches) {
  var tbody = $('#topBreachesTable tbody');
  tbody.empty();

  (breaches || []).forEach(function(breach) {
    var breachUrl = 'breach.html#' + encodeURIComponent(breach.breachid);
    tbody.append(
      '<tr>' +
      '<td><img src="' + escapeHtml(breach.logo) + '" alt="' + escapeHtml(breach.breachid) + ' logo"></td>' +
      '<td><a href="' + breachUrl + '" class="breach-link">' + escapeHtml(breach.breachid) + '</a></td>' +
      '<td>' +
      '<span class="description truncated">' + escapeHtml(breach.description) + '</span>' +
      '<button type="button" class="read-toggle" onclick="toggleDesc(this)">more</button>' +
      '</td>' +
      '<td class="record-count">' + formatNumber(breach.count) + '</td>' +
      '</tr>'
    );
  });
}

function renderRecentBreachesTable(breaches) {
  var tbody = $('#recentBreachesTable tbody');
  tbody.empty();

  (breaches || []).forEach(function(breach) {
    var breachUrl = 'breach.html#' + encodeURIComponent(breach.breachid);
    tbody.append(
      '<tr>' +
      '<td><img src="' + escapeHtml(breach.logo) + '" alt="' + escapeHtml(breach.breachid) + ' logo"></td>' +
      '<td><a href="' + breachUrl + '" class="breach-link">' + escapeHtml(breach.breachid) + '</a></td>' +
      '<td>' +
      '<span class="description truncated">' + escapeHtml(breach.description) + '</span>' +
      '<button type="button" class="read-toggle" onclick="toggleDesc(this)">more</button>' +
      '</td>' +
      '<td class="record-count">' + formatNumber(breach.count) + '</td>' +
      '</tr>'
    );
  });
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toggleDesc(el) {
  var desc = el.previousElementSibling;
  if (desc.classList.contains('truncated')) {
    desc.classList.remove('truncated');
    el.textContent = 'less';
  } else {
    desc.classList.add('truncated');
    el.textContent = 'more';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var menuToggle = document.querySelector('.menu-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      var isOpen = navLinks.classList.contains('active');
      menuToggle.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
