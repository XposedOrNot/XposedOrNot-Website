document.addEventListener('DOMContentLoaded', function () {
    const API_ENDPOINT = 'https://xon-api-test-325858668484.us-west1.run.app/v1/domain-phishing/';
    const domainForm = document.getElementById('domainForm');
    const domainInput = document.getElementById('domainInput');
    const submitButton = document.getElementById('submitButton');
    const spinner = document.getElementById('spinner');
    const errorMessage = document.getElementById('errorMessage');
    const noBreachMessage = document.getElementById('noBreachMessage');
    const searchedDomain = document.getElementById('searchedDomain');
    const domainDisplay = document.getElementById('domain-display');
    const lastExposure = document.getElementById('last-exposure');
    const breachCount = document.getElementById('breach-count');
    const recordCount = document.getElementById('record-count');
    const emailCount = document.getElementById('email-count');
    const chartDiv = document.getElementById('chart_div');
    const checkAnotherDomainBtn = document.getElementById('checkAnotherDomainBtn');
    const checkAnotherDomainBtnInModal = document.getElementById('checkAnotherDomainBtnInModal');

    // Initialize Google Charts with gauge package
    google.charts.load('current', { 'packages': ['gauge'] });

    function showLoading() {
        spinner.style.display = 'inline-block';
        submitButton.disabled = true;
        errorMessage.style.display = 'none';
    }

    function hideLoading() {
        spinner.style.display = 'none';
        submitButton.disabled = false;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.style.color = '#dc3545'; // Bootstrap danger color
        errorMessage.style.marginTop = '15px';
        errorMessage.style.fontWeight = '500';

        // Ensure modal stays open when there's an error
        $('#domainModal').modal('show');
    }

    function hideError() {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z');
    }

    function getUniqueFuzzerCount(data) {
        const uniqueFuzzers = new Set();
        data.raw_results.forEach(result => {
            if (result.fuzzer && result.fuzzer !== '*original') {
                uniqueFuzzers.add(result.fuzzer);
            }
        });
        return uniqueFuzzers.size;
    }

    function calculateRiskScore(data) {
        // Risk factors:
        // 1. Number of live domains (higher = more risk)
        // 2. Ratio of live domains to total scanned (higher ratio = more risk)

        const liveDomains = data.total_live;
        const totalScanned = data.total_scanned;

        // Calculate base risk from live domains (0-70 points)
        const domainRisk = Math.min((liveDomains / 10) * 10, 70);

        // Calculate risk from live ratio (0-30 points)
        const liveRatio = liveDomains / totalScanned;
        const ratioRisk = Math.min(liveRatio * 30, 30);

        // Total risk score (0-100)
        return Math.round(domainRisk + ratioRisk);
    }

    function drawRiskMeter(riskScore) {
        const chartData = new google.visualization.DataTable();
        chartData.addColumn('string', 'Label');
        chartData.addColumn('number', 'Value');
        chartData.addRows([
            ['Risk', riskScore]
        ]);

        const options = {
            width: 150,
            height: 150,
            redFrom: 90,
            redTo: 100,
            yellowFrom: 70,
            yellowTo: 90,
            greenFrom: 0,
            greenTo: 70,
            minorTicks: 5,
            majorTicks: ['0', '20', '40', '60', '80', '100'],
            max: 100,
            min: 0
        };

        const chart = new google.visualization.Gauge(chartDiv);
        chart.draw(chartData, options);

        // Add risk level text below the chart
        let riskLevel;
        if (riskScore <= 70) {
            riskLevel = 'Low Risk';
        } else if (riskScore <= 90) {
            riskLevel = 'Medium Risk';
        } else {
            riskLevel = 'High Risk';
        }

        const riskLevelDiv = document.createElement('div');
        riskLevelDiv.style.textAlign = 'center';
        riskLevelDiv.style.color = '#fff';
        riskLevelDiv.style.marginTop = '10px';
        riskLevelDiv.style.fontSize = '14px';
        riskLevelDiv.textContent = riskLevel;

        // Clear previous elements if they exist
        const existingElements = chartDiv.parentElement.querySelectorAll('.risk-level, .risk-score');
        existingElements.forEach(el => el.remove());

        riskLevelDiv.className = 'risk-level';
        chartDiv.parentElement.appendChild(riskLevelDiv);
    }

    // Function to focus on the input field
    function focusInput() {
        setTimeout(() => {
            domainInput.focus();
        }, 500); // Small delay to ensure modal is fully shown
    }

    // Utility to get URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    async function checkDomain(domain) {
        try {
            showLoading();
            // Get email and token from URL
            const email = getUrlParameter('email');
            const token = getUrlParameter('token');
            // Build API URL with query params
            let apiUrl = API_ENDPOINT + encodeURIComponent(domain);
            const params = [];
            if (email) params.push('email=' + encodeURIComponent(email));
            if (token) params.push('token=' + encodeURIComponent(token));
            if (params.length > 0) {
                apiUrl += '?' + params.join('&');
            }
            const response = await fetch(apiUrl);

            // Handle specific HTTP status codes
            if (response.status === 429) {
                showError('Too many requests. Please try again in a few minutes.');
                return;
            }
            if (response.status === 404) {
                showError('Domain not found. Please check the domain name and try again.');
                return;
            }
            if (response.status >= 500) {
                showError('Service temporarily unavailable. Please try again later.');
                return;
            }
            if (!response.ok) {
                showError('An error occurred while checking the domain. Please try again.');
                return;
            }

            const data = await response.json();

            if (data.status === 'success') {
                // Update domain display
                domainDisplay.textContent = domain;
                lastExposure.textContent = formatDate(data.last_checked);

                // Update logo
                const logoImg = document.getElementById('logo');
                if (logoImg) {
                    logoImg.src = `https://logo.clearbit.com/${domain}`;
                    logoImg.onerror = function () {
                        // If logo fails to load, try alternative logo service
                        this.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                        this.onerror = function () {
                            // If both fail, hide the logo
                            this.style.display = 'none';
                        };
                    };
                    logoImg.style.display = 'inline-block';
                }

                // Update statistics
                breachCount.textContent = data.total_scanned;
                recordCount.textContent = data.total_live;
                emailCount.textContent = '-'; // No longer showing fuzzer count

                // Calculate and display risk score
                const riskScore = calculateRiskScore(data);
                google.charts.setOnLoadCallback(() => drawRiskMeter(riskScore));

                // Show results
                $('#domainModal').modal('hide');
                document.getElementById('content').classList.remove('blurred');
                document.getElementById('note').style.display = 'block';

                // Store domain data for detailed view
                window.domainData = data;
                // Update phishing table (detailed or summary)
                if (typeof window.updatePhishingTable === 'function') {
                    window.updatePhishingTable(data);
                }
            } else {
                showError(data.message || 'An error occurred while checking the domain.');
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                showError('Network error. Please check your internet connection and try again.');
            } else {
                showError('An unexpected error occurred. Please try again later.');
            }
        } finally {
            hideLoading();
        }
    }

    domainForm.addEventListener('submit', function (e) {
        e.preventDefault();
        hideError(); // Clear any previous errors
        const domain = domainInput.value.trim().toLowerCase();

        if (!domain) {
            showError('Please enter a domain name.');
            return;
        }

        // Basic domain validation
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
        if (!domainRegex.test(domain)) {
            showError('Please enter a valid domain name.');
            return;
        }

        checkDomain(domain);
    });

    // Handle "Check Another Domain" buttons
    [checkAnotherDomainBtn, checkAnotherDomainBtnInModal].forEach(btn => {
        btn.addEventListener('click', function () {
            $('#domainModal').modal('show');
            document.getElementById('content').classList.add('blurred');
            document.getElementById('note').style.display = 'none';
            domainInput.value = '';
            hideError();
            noBreachMessage.style.display = 'none';
            focusInput();
        });
    });

    // Show modal on page load and focus input
    $('#domainModal').on('shown.bs.modal', function () {
        focusInput();
    });
    $('#domainModal').modal('show');

    function resetCounts() {
        $('#breach-count').text('-');
        $('#record-count').text('-');
        $('#email-count').text('-');
        $('#last-exposure').text('--');
        $('#note').hide();

        // Clear the phishing domains table
        if (typeof window.clearPhishingTable === 'function') {
            window.clearPhishingTable();
        }
    }
}); 