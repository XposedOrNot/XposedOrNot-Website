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
  primary: 'rgba(63, 113, 243, 0.8)',
  primaryLight: 'rgba(63, 113, 243, 0.2)',
  secondary: 'rgba(66, 132, 251, 0.8)',
  secondaryLight: 'rgba(66, 132, 251, 0.2)',
  amber: 'rgba(245, 158, 11, 0.8)',
  purple: 'rgba(139, 92, 246, 0.8)',
  emerald: 'rgba(16, 185, 129, 0.8)',
  gray: 'rgba(107, 114, 128, 0.8)'
};

function isDarkMode() {
  return document.body.getAttribute('data-theme') === 'dark';
}

function getTextColor() {
  return isDarkMode() ? '#e2e8f0' : '#2d3748';
}

function getSubTextColor() {
  return isDarkMode() ? '#9fc0e0' : '#4a5568';
}

function getMutedColor() {
  return isDarkMode() ? '#6daae0' : '#718096';
}

function getGridColor() {
  return isDarkMode() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
}

function getTooltipBg() {
  return isDarkMode() ? 'rgba(0, 0, 0, 0.9)' : 'rgba(45, 55, 72, 0.95)';
}

var dashboardData = null;
var breachStats = null;
var loadsPending = 2;

$(document).ready(function() {
  fetchWithRetry('https://api.xposedornot.com/v1/metrics/detailed', renderDashboard, 0);
  fetchWithRetry('https://api.xposedornot.com/v1/breaches', handleBreachesResponse, 0);

  $('#darkSwitch').on('change', function() {
    setTimeout(function() {
      Chart.helpers.each(Chart.instances, function(instance) {
        instance.chart.destroy();
      });
      if (breachStats) {
        renderPasswordRiskChart(breachStats);
        renderDataTypesChart(breachStats);
      }
      if (dashboardData) {
        renderYearlyChart(dashboardData);
        renderIndustryChart(dashboardData);
      }
    }, 50);
  });
});

function fetchWithRetry(url, onData, retryCount) {
  var maxRetries = 3;

  $.ajax({
    url: url,
    method: "GET",
    timeout: 30000
  })
  .done(function(data) {
    onData(data);
    settleLoad();
  })
  .fail(function(xhr) {
    var status = xhr.status;

    if (status === 429) {
      var retryAfter = parseInt(xhr.getResponseHeader('Retry-After')) || 5;
      showErrorMessage('Rate limited. Retrying in ' + retryAfter + ' seconds...', 'warning');
      setTimeout(function() {
        $('.error-banner').remove();
        if (retryCount < maxRetries) {
          fetchWithRetry(url, onData, retryCount + 1);
        } else {
          showErrorMessage('Too many requests. Please try again later.', 'error');
          settleLoad();
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
          fetchWithRetry(url, onData, retryCount + 1);
        }, delay);
        return;
      }
      showErrorMessage('Server is temporarily unavailable. Please try again later.', 'error');
      settleLoad();
      return;
    }

    if (status === 0) {
      showErrorMessage('Network error. Please check your connection and refresh.', 'error');
    } else if (status === 404) {
      showErrorMessage('Data endpoint not found. Please contact support.', 'error');
    } else {
      showErrorMessage('Unable to load breach data. Please try refreshing the page.', 'error');
    }
    settleLoad();
  });
}

function settleLoad() {
  loadsPending--;
  if (loadsPending <= 0) hideLoading();
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

var TYPE_LABELS = {
  'email addresses': 'Email Addresses',
  'passwords': 'Passwords',
  'usernames': 'Usernames',
  'names': 'Names',
  'ip addresses': 'IP Addresses',
  'phone numbers': 'Phone Numbers',
  'dates of birth': 'Dates of Birth',
  'physical addresses': 'Physical Addresses',
  'genders': 'Genders',
  'geographic locations': 'Geographic Locations',
  'social media profiles': 'Social Media Profiles'
};

function typeLabel(type) {
  if (TYPE_LABELS[type]) return TYPE_LABELS[type];
  return type.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function normalizeExposedTypes(exposedData) {
  var seen = {};
  var types = [];
  (exposedData || []).forEach(function(raw) {
    String(raw).split(',').forEach(function(part) {
      var t = part.trim().toLowerCase();
      if (!t) return;
      if (t === 'email' || t === 'email addresse' || t === 'mail addresses') t = 'email addresses';
      if (t === 'name') t = 'names';
      if (t === 'username' || t === 'user names') t = 'usernames';
      if (!seen[t]) {
        seen[t] = true;
        types.push(t);
      }
    });
  });
  return types;
}

function matchesAny(types, patterns) {
  return types.some(function(t) {
    return patterns.some(function(p) { return t.indexOf(p) !== -1; });
  });
}

function computeBreachStats(breaches) {
  var total = breaches.length;
  var totalRecords = 0;
  var typeCounts = {};
  var risk = { plaintext: 0, easy: 0, hard: 0, unknown: 0 };
  var verified = 0;
  var searchable = 0;
  var sizes = {
    mega: { count: 0, records: 0 },
    large: { count: 0, records: 0 },
    medium: { count: 0, records: 0 },
    small: { count: 0, records: 0 },
    tiny: { count: 0, records: 0 }
  };
  var risks = {
    full: { breaches: 0, records: 0 },
    govid: { breaches: 0, records: 0 },
    financial: { breaches: 0, records: 0 }
  };
  var govPatterns = ['government', 'national id', 'passport', 'social security'];
  var finPatterns = ['credit card', 'bank account', 'financial', 'account balance'];
  var recordCounts = [];

  breaches.forEach(function(b) {
    var records = b.exposedRecords || 0;
    totalRecords += records;
    recordCounts.push(records);

    var types = normalizeExposedTypes(b.exposedData);
    types.forEach(function(t) {
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    var pr = String(b.passwordRisk || '').toLowerCase();
    if (pr === 'plaintext') risk.plaintext++;
    else if (pr === 'easytocrack') risk.easy++;
    else if (pr === 'hardtocrack') risk.hard++;
    else risk.unknown++;

    if (b.verified) verified++;
    if (b.searchable) searchable++;

    var band = records >= 1e8 ? 'mega' : records >= 1e7 ? 'large' : records >= 1e6 ? 'medium' : records >= 1e5 ? 'small' : 'tiny';
    sizes[band].count++;
    sizes[band].records += records;

    var hasEmail = types.indexOf('email addresses') !== -1;
    if (types.indexOf('names') !== -1 && types.indexOf('dates of birth') !== -1 &&
        types.indexOf('physical addresses') !== -1 && types.indexOf('phone numbers') !== -1) {
      risks.full.breaches++;
      risks.full.records += records;
    }
    if (hasEmail && matchesAny(types, govPatterns)) {
      risks.govid.breaches++;
      risks.govid.records += records;
    }
    if (hasEmail && matchesAny(types, finPatterns)) {
      risks.financial.breaches++;
      risks.financial.records += records;
    }
  });

  var dataTypes = Object.keys(typeCounts)
    .map(function(t) { return { type: t, count: typeCounts[t] }; })
    .sort(function(a, b) { return b.count - a.count; })
    .slice(0, 8)
    .map(function(d) {
      return { type: typeLabel(d.type), pct: Math.round((d.count / total) * 100) };
    });

  recordCounts.sort(function(a, b) { return b - a; });
  var halfTotal = totalRecords / 2;
  var cumulative = 0;
  var paretoCount = 0;
  for (var i = 0; i < recordCounts.length; i++) {
    cumulative += recordCounts[i];
    paretoCount++;
    if (cumulative >= halfTotal) break;
  }

  return {
    total: total,
    totalRecords: totalRecords,
    dataTypes: dataTypes,
    risk: risk,
    verified: verified,
    searchable: searchable,
    sizes: sizes,
    risks: risks,
    pareto: {
      count: paretoCount,
      percent: totalRecords ? Math.round((cumulative / totalRecords) * 100) : 0
    }
  };
}

function handleBreachesResponse(data) {
  var breaches = (data && data.exposedBreaches) || [];
  if (!breaches.length) {
    showErrorMessage('Unable to load breach data. Please try refreshing the page.', 'error');
    return;
  }
  breachStats = computeBreachStats(breaches);
  renderBreachInsights(breachStats);
  renderPasswordRiskChart(breachStats);
  renderDataTypesChart(breachStats);
}

function renderBreachInsights(stats) {
  var total = stats.total;

  $('#verified-count').text(stats.verified.toLocaleString());
  $('#verified-percent').text(((stats.verified / total) * 100).toFixed(1) + '%');
  $('#searchable-count').text(stats.searchable.toLocaleString());

  $('#pareto-breaches').text(stats.pareto.count);
  $('#pareto-percent').text(stats.pareto.percent + '%');

  Object.keys(stats.sizes).forEach(function(size) {
    var band = stats.sizes[size];
    var pct = stats.totalRecords ? (band.records / stats.totalRecords) * 100 : 0;
    var pctText = pct >= 0.1 ? pct.toFixed(1) : pct.toFixed(2);
    $('#size-' + size).text(band.count.toLocaleString());
    $('#size-' + size + '-pct').text(pctText + '% of records');
  });

  $('#risk-full-breaches').text(stats.risks.full.breaches);
  $('#risk-full-records').text(formatNumber(stats.risks.full.records));
  $('#risk-govid-breaches').text(stats.risks.govid.breaches);
  $('#risk-govid-records').text(formatNumber(stats.risks.govid.records));
  $('#risk-financial-breaches').text(stats.risks.financial.breaches);
  $('#risk-financial-records').text(formatNumber(stats.risks.financial.records));
}

function renderDashboard(data) {
  dashboardData = data;
  animateCounter($('#breaches-count'), data.Breaches_Count);
  animateCounter($('#records-count'), data.Breaches_Records);
  animateCounter($('#emails-count'), parseInt(String(data.Pastes_Count).replace(/,/g, '')) || 0);
  animateCounter($('#passwords-count'), data.Pastes_Records);

  var industries = Object.keys(data.Industry_Breaches_Count || {});
  $('#industry-count').text(industries.length);

  updateTimestamp();

  renderYearlyChart(data);
  renderIndustryChart(data);
  renderTopBreachesTable(data.Top_Breaches);
  renderRecentBreachesTable(data.Recent_Breaches);
}

function renderPasswordRiskChart(stats) {
  var ctx = document.getElementById('passwordRiskChart').getContext('2d');
  var risk = stats.risk;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Plaintext', 'Easy to Crack', 'Hard to Crack', 'Unknown'],
      datasets: [{
        data: [risk.plaintext, risk.easy, risk.hard, risk.unknown],
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
        backgroundColor: getTooltipBg(),
        titleFontFamily: 'Poppins',
        bodyFontFamily: 'Poppins',
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

function renderDataTypesChart(stats) {
  var ctx = document.getElementById('dataTypesChart').getContext('2d');
  var dataTypes = stats.dataTypes;

  new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: dataTypes.map(function(d) { return d.type; }),
      datasets: [{
        data: dataTypes.map(function(d) { return d.pct; }),
        backgroundColor: dataTypes.map(function(d, i) {
          var opacity = 0.9 - (i * 0.07);
          return 'rgba(63, 113, 243, ' + opacity + ')';
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
            fontColor: getMutedColor(),
            callback: function(v) { return v + '%'; }
          },
          gridLines: { color: getGridColor() }
        }],
        yAxes: [{
          ticks: { fontColor: getTextColor(), fontSize: 11 },
          gridLines: { display: false }
        }]
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: getTextColor(),
          font: { weight: 'bold', size: 11 },
          formatter: function(v) { return v + '%'; },
          offset: 4
        }
      },
      tooltips: {
        backgroundColor: getTooltipBg(),
        callbacks: {
          label: function(t) { return t.value + '% of breaches contain this data'; }
        }
      }
    }
  });
}

function renderYearlyChart(data) {
  var yearlyData = Object.entries(data.Yearly_Breaches_Count || {})
    .map(function(entry) { return { year: parseInt(entry[0]), count: entry[1] }; })
    .sort(function(a, b) { return a.year - b.year; });

  var ctx = document.getElementById('yearlyChart').getContext('2d');
  var gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(63, 113, 243, 0.25)');
  gradient.addColorStop(1, 'rgba(63, 113, 243, 0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: yearlyData.map(function(d) { return d.year.toString(); }),
      datasets: [{
        data: yearlyData.map(function(d) { return d.count; }),
        fill: true,
        backgroundColor: gradient,
        borderColor: 'rgba(63, 113, 243, 1)',
        borderWidth: 3,
        pointBackgroundColor: isDarkMode() ? '#1a1f3a' : '#fff',
        pointBorderColor: 'rgba(63, 113, 243, 1)',
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
          ticks: { fontColor: getMutedColor() },
          gridLines: { display: false }
        }],
        yAxes: [{
          ticks: {
            fontColor: getMutedColor(),
            beginAtZero: true,
            callback: formatNumber
          },
          gridLines: { color: getGridColor() }
        }]
      },
      plugins: {
        datalabels: {
          align: 'top',
          anchor: 'end',
          backgroundColor: 'rgba(63, 113, 243, 0.85)',
          borderRadius: 4,
          color: '#fff',
          font: { size: 10, weight: 'bold' },
          padding: 4,
          formatter: formatNumber,
          display: true
        }
      },
      tooltips: {
        backgroundColor: getTooltipBg(),
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
          return 'rgba(66, 132, 251, ' + opacity + ')';
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
            fontColor: getMutedColor(),
            beginAtZero: true,
            callback: formatNumber
          },
          gridLines: { color: getGridColor() }
        }],
        yAxes: [{
          ticks: { fontColor: getTextColor(), fontSize: 11 },
          gridLines: { display: false }
        }]
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: getTextColor(),
          font: { size: 10, weight: 'bold' },
          formatter: formatNumber,
          offset: 4
        }
      },
      tooltips: {
        backgroundColor: getTooltipBg(),
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
