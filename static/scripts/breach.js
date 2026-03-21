function getBreachId() {
    if (window.location.hash) {
        return window.location.hash.substring(1);
    }
    return null;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateCard(dateString) {
    var date = new Date(dateString);
    var month = date.toLocaleDateString('en-US', { month: 'short' });
    var year = date.getFullYear();
    return month + ' ' + year;
}

function getTimeAgo(dateString) {
    var breachDate = new Date(dateString);
    var now = new Date();
    var diffTime = Math.abs(now - breachDate);
    var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    var diffMonths = Math.floor(diffDays / 30);
    var diffYears = Math.floor(diffMonths / 12);

    if (diffYears > 0) {
        var remainingMonths = diffMonths % 12;
        if (remainingMonths > 0) {
            return diffYears + ' year' + (diffYears > 1 ? 's' : '') + ' and ' + remainingMonths + ' month' + (remainingMonths > 1 ? 's' : '') + ' ago';
        }
        return diffYears + ' year' + (diffYears > 1 ? 's' : '') + ' ago';
    } else if (diffMonths > 0) {
        return diffMonths + ' month' + (diffMonths > 1 ? 's' : '') + ' ago';
    } else if (diffDays > 0) {
        return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
    } else {
        return 'Today';
    }
}

function getIndustryImage(industry) {
    var industryFormatted = industry.replace(/\s+/g, ' ').trim();
    return '/static/logos/industry/' + industryFormatted + '.png';
}

function getDataIcon(dataType) {
    var icons = {
        'email': 'fas fa-envelope',
        'password': 'fas fa-key',
        'username': 'fas fa-user',
        'user name': 'fas fa-user',
        'nickname': 'fas fa-user-tag',
        'name': 'fas fa-id-card',
        'avatar': 'fas fa-user-circle',
        'profile photo': 'fas fa-user-circle',
        'phone': 'fas fa-phone',
        'physical address': 'fas fa-map-marker-alt',
        'address': 'fas fa-map-marker-alt',
        'credit card': 'fas fa-credit-card',
        'bank account': 'fas fa-university',
        'account balance': 'fas fa-wallet',
        'income level': 'fas fa-money-bill-wave',
        'partial credit card': 'fas fa-credit-card',
        'date of birth': 'fas fa-birthday-cake',
        'years of birth': 'fas fa-birthday-cake',
        'place of birth': 'fas fa-baby',
        'gender': 'fas fa-venus-mars',
        'marital status': 'fas fa-ring',
        'spouse': 'fas fa-ring',
        'mother': 'fas fa-female',
        'nationality': 'fas fa-flag',
        'ethnicit': 'fas fa-users',
        'religion': 'fas fa-pray',
        'language': 'fas fa-language',
        'spoken language': 'fas fa-language',
        'education level': 'fas fa-graduation-cap',
        'occupation': 'fas fa-briefcase',
        'employer': 'fas fa-building',
        'job application': 'fas fa-file-alt',
        'geographic location': 'fas fa-map-marked-alt',
        'ip address': 'fas fa-network-wired',
        'social security': 'fas fa-id-card-alt',
        'government': 'fas fa-landmark',
        'passport': 'fas fa-passport',
        'licence plate': 'fas fa-car',
        'vehicle': 'fas fa-car',
        'device information': 'fas fa-mobile-alt',
        'browser': 'fas fa-globe',
        'user agent': 'fas fa-globe',
        'website activity': 'fas fa-mouse-pointer',
        'social media': 'fas fa-share-alt',
        'social connection': 'fas fa-user-friends',
        'instant messenger': 'fas fa-comment-dots',
        'private message': 'fas fa-envelope-open-text',
        'security question': 'fas fa-question-circle',
        'historical password': 'fas fa-history',
        'passwords history': 'fas fa-history',
        'sexual preference': 'fas fa-heart',
        'drug habit': 'fas fa-pills',
        'drink habit': 'fas fa-wine-glass-alt'
    };

    var lower = dataType.toLowerCase();
    for (var key in icons) {
        if (lower.includes(key)) {
            return icons[key];
        }
    }
    return 'fas fa-database';
}

function getDataRiskClass(dataType) {
    var lower = dataType.toLowerCase();
    var highRisk = ['password', 'credit card', 'bank account', 'social security',
        'government', 'passport', 'historical password', 'passwords history',
        'security question', 'partial credit card'];
    var mediumRisk = ['phone', 'physical address', 'date of birth', 'ip address',
        'income level', 'account balance', 'private message', 'sexual preference',
        'drug habit', 'drink habit'];

    for (var i = 0; i < highRisk.length; i++) {
        if (lower.includes(highRisk[i])) return 'data-badge-danger';
    }
    for (var j = 0; j < mediumRisk.length; j++) {
        if (lower.includes(mediumRisk[j])) return 'data-badge-warning';
    }
    return '';
}

function formatPasswordRisk(risk) {
    var riskLevels = {
        'plaintext': { text: 'Plain Text', cls: 'badge-danger', icon: 'fas fa-exclamation-triangle' },
        'easytocrack': { text: 'Easy to Crack', cls: 'badge-danger', icon: 'fas fa-exclamation-circle' },
        'hardtocrack': { text: 'Hard to Crack', cls: 'badge-success', icon: 'fas fa-shield-alt' },
        'unknown': { text: 'Unknown', cls: 'badge-warning', icon: 'fas fa-question-circle' }
    };

    var level = riskLevels[risk] || riskLevels['unknown'];
    return '<span class="badge-status ' + level.cls + '"><i class="' + level.icon + '"></i> ' + level.text + '</span>';
}

function formatStatus(value) {
    return value
        ? '<span class="badge-status badge-success"><i class="fas fa-check-circle"></i> Yes</span>'
        : '<span class="badge-status badge-danger"><i class="fas fa-times-circle"></i> No</span>';
}

function formatSensitiveStatus(value) {
    return value
        ? '<span class="badge-status badge-danger"><i class="fas fa-exclamation-triangle"></i> Yes</span>'
        : '<span class="badge-status badge-success"><i class="fas fa-check-circle"></i> No</span>';
}

function updateMetaTags(breach) {
    var title = 'XposedOrNot - ' + breach.breachID + ' Data Breach Details';
    var description = breach.exposureDescription || 'Learn about the ' + breach.breachID + ' data breach that exposed ' + formatNumber(breach.exposedRecords) + ' records.';
    var logo = breach.logo || 'https://xposedornot.com/static/images/xon.png';

    document.title = title;
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-description').setAttribute('content', description);

    document.getElementById('og-title').setAttribute('content', title);
    document.getElementById('og-description').setAttribute('content', description);
    document.getElementById('og-image').setAttribute('content', logo);
    document.getElementById('og-url').setAttribute('content', window.location.href);

    document.getElementById('twitter-title').setAttribute('content', title);
    document.getElementById('twitter-description').setAttribute('content', description);
    document.getElementById('twitter-image').setAttribute('content', logo);
}

function generateActionCards(exposedData) {
    var lower = exposedData.map(function(d) { return d.toLowerCase(); }).join(' ');
    var has = function(keyword) { return lower.includes(keyword); };

    var cards = [];

    if (has('password')) {
        cards.push({ priority: 'urgent', cls: 'urgent', icon: 'fas fa-key', title: 'Change Your Passwords', text: 'Update your password immediately \u2014 use 12+ characters with numbers and symbols.' });
    }

    if (has('email') || has('password') || has('username')) {
        cards.push({ priority: 'High Priority', cls: 'high', icon: 'fas fa-shield-alt', title: 'Enable Two-Factor Authentication', text: 'Add 2FA on all supported accounts using an authenticator app like Google Authenticator or Authy.' });
    }

    if (has('credit card') || has('bank account') || has('account balance') || has('income')) {
        cards.push({ priority: 'Urgent', cls: 'urgent', icon: 'fas fa-university', title: 'Alert Your Bank', text: 'Contact your bank immediately and monitor statements for unauthorized transactions.' });
    }

    if (has('social security') || has('government') || has('passport')) {
        cards.push({ priority: 'Urgent', cls: 'urgent', icon: 'fas fa-landmark', title: 'Place a Fraud Alert', text: 'Contact credit bureaus to place a fraud alert or credit freeze to prevent identity theft.' });
    }

    if (has('phone')) {
        cards.push({ priority: 'Recommended', cls: 'medium', icon: 'fas fa-phone', title: 'Watch for Phishing Calls & SMS', text: 'Be cautious of unexpected calls or texts asking for personal information.' });
    }

    if (has('physical address')) {
        cards.push({ priority: 'Recommended', cls: 'medium', icon: 'fas fa-mail-bulk', title: 'Beware of Scam Mail', text: 'Be skeptical of unexpected correspondence requesting personal details.' });
    }

    if (has('ip address') || has('device') || has('browser') || has('user agent')) {
        cards.push({ priority: 'Recommended', cls: 'medium', icon: 'fas fa-desktop', title: 'Review Device Security', text: 'Update your devices and browsers, and check for unauthorized logins.' });
    }

    cards.push({ priority: 'Recommended', cls: 'medium', icon: 'fas fa-eye', title: 'Monitor Your Accounts', text: 'Set up login alerts and review account activity regularly for suspicious access.' });

    if (has('password')) {
        cards.push({ priority: 'Best Practice', cls: 'info', icon: 'fas fa-lock', title: 'Use a Password Manager', text: 'Never reuse passwords \u2014 use a password manager to generate unique ones for each account.' });
    }

    return cards.map(function(c) {
        return '<div class="action-card ' + c.cls + '">' +
            '<div class="action-card-header">' +
            '<div class="action-card-icon"><i class="' + c.icon + '"></i></div>' +
            '<span class="action-priority">' + c.priority + '</span>' +
            '</div>' +
            '<h4>' + c.title + '</h4>' +
            '<p>' + c.text + '</p>' +
            '</div>';
    }).join('');
}

async function loadBreachData() {
    var breachId = getBreachId();

    if (!breachId) {
        showError('notfound');
        return;
    }

    try {
        var apiUrl = 'https://api.xposedornot.com/v1/breaches?breach_id=' + breachId;
        var response = await fetch(apiUrl);

        if (response.status === 429) {
            showError('ratelimit');
            return;
        }

        if (!response.ok) {
            showError('notfound');
            return;
        }

        var data = await response.json();

        if (data.status !== 'success' || !data.exposedBreaches || data.exposedBreaches.length === 0) {
            showError('notfound');
            return;
        }

        var breach = data.exposedBreaches[0];
        displayBreachData(breach);
        updateMetaTags(breach);

    } catch (error) {
        console.error('Error loading breach data:', error);
        showError('error');
    }
}

function displayBreachData(breach) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    document.getElementById('breach-logo').src = breach.logo || '/static/images/xon.png';
    document.getElementById('breach-logo').alt = breach.breachID + ' logo';
    document.getElementById('breach-name').innerHTML = breach.breachID + (!breach.searchable ? ' <span style="font-size: 0.7em;" title="Sensitive Breach">\uD83D\uDD25</span>' : '');
    document.getElementById('breach-domain').innerHTML = '<i class="fas fa-globe" style="font-size: 0.8em; margin-right: 8px; opacity: 0.7;"></i>' + breach.domain;

    document.getElementById('exposed-records').textContent = formatNumber(breach.exposedRecords);
    document.getElementById('breach-date-card').textContent = formatDateCard(breach.breachedDate);
    document.getElementById('time-ago').textContent = getTimeAgo(breach.breachedDate);
    document.getElementById('password-risk').innerHTML = formatPasswordRisk(breach.passwordRisk);

    document.getElementById('industry').textContent = breach.industry;
    var industryImg = document.getElementById('industry-image');
    var industryPath = getIndustryImage(breach.industry);
    industryImg.src = industryPath;
    industryImg.style.display = 'block';

    if (breach.addedDate) {
        document.getElementById('added-date-line').textContent = 'Added to XposedOrNot on ' + formatDate(breach.addedDate);
    }

    document.getElementById('breach-description').textContent = breach.exposureDescription;

    var exposedDataContainer = document.getElementById('exposed-data');
    exposedDataContainer.innerHTML = '';
    breach.exposedData.forEach(function(dataType) {
        var badge = document.createElement('div');
        var riskClass = getDataRiskClass(dataType);
        badge.className = 'data-badge' + (riskClass ? ' ' + riskClass : '');
        badge.innerHTML = '<i class="' + getDataIcon(dataType) + '"></i> ' + dataType;
        exposedDataContainer.appendChild(badge);
    });

    document.getElementById('searchable').innerHTML = formatStatus(breach.searchable) + (!breach.searchable ? ' <span class="badge-status badge-danger" style="margin-left: 8px;"><i class="fas fa-fire"></i> Sensitive</span>' : '');
    document.getElementById('verified').innerHTML = formatStatus(breach.verified);
    document.getElementById('sensitive').innerHTML = formatSensitiveStatus(breach.sensitive);
    var referenceCell = document.getElementById('reference');
    if (breach.referenceURL) {
        referenceCell.innerHTML = '<a href="' + breach.referenceURL + '" target="_blank" rel="noopener" class="reference-link">' + breach.referenceURL + '</a>';
    } else {
        referenceCell.textContent = 'No reference available';
    }

    document.getElementById('action-grid').innerHTML = generateActionCards(breach.exposedData);
}

function showError(errorType) {
    errorType = errorType || 'notfound';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';

    var errorIcon = document.querySelector('.error-icon i');
    var errorTitle = document.querySelector('.error-title');
    var errorMessage = document.querySelector('.error-message');

    if (errorType === 'ratelimit') {
        errorIcon.className = 'fas fa-hourglass-half';
        errorTitle.textContent = 'Slow Down!';
        errorMessage.textContent = 'You\'re making too many requests. Please wait a moment and try again.';
    } else if (errorType === 'error') {
        errorIcon.className = 'fas fa-exclamation-circle';
        errorTitle.textContent = 'Something Went Wrong';
        errorMessage.textContent = 'An unexpected error occurred while loading the breach information. Please try again later.';
    } else {
        errorIcon.className = 'fas fa-exclamation-triangle';
        errorTitle.textContent = 'Breach Not Found';
        errorMessage.textContent = 'The requested breach information could not be found or does not exist.';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    loadBreachData();
});
