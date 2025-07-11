document.addEventListener('DOMContentLoaded', function () {
    const API_ENDPOINT = 'https://api.xposedornot.com/v1/domain-phishing/';
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
        errorMessage.style.color = '#dc3545';
        errorMessage.style.marginTop = '15px';
        errorMessage.style.fontWeight = '500';

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

        const liveDomains = data.total_live;
        const totalScanned = data.total_scanned;
        const domainRisk = Math.min((liveDomains / 10) * 10, 70);

        const liveRatio = liveDomains / totalScanned;
        const ratioRisk = Math.min(liveRatio * 30, 30);


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


        const existingElements = chartDiv.parentElement.querySelectorAll('.risk-level, .risk-score');
        existingElements.forEach(el => el.remove());

        riskLevelDiv.className = 'risk-level';
        chartDiv.parentElement.appendChild(riskLevelDiv);
    }


    function focusInput() {
        setTimeout(() => {
            domainInput.focus();
        }, 250);
    }

    async function checkDomain(domain) {
        try {
            showLoading();
            const response = await fetch(API_ENDPOINT + encodeURIComponent(domain));


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

                domainDisplay.textContent = domain;
                lastExposure.textContent = formatDate(data.last_checked);


                const logoImg = document.getElementById('logo');
                if (logoImg) {
                    logoImg.src = `https://logo.clearbit.com/${domain}`;
                    logoImg.onerror = function () {
                        this.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                        this.onerror = function () {

                            this.style.display = 'none';
                        };
                    };
                    logoImg.style.display = 'inline-block';
                }


                breachCount.textContent = data.total_scanned;
                recordCount.textContent = data.total_live;
                emailCount.textContent = data.unique_fuzzers || '-';


                const riskScore = calculateRiskScore(data);
                google.charts.setOnLoadCallback(() => drawRiskMeter(riskScore));


                $('#domainModal').modal('hide');
                document.getElementById('content').classList.remove('blurred');
                document.getElementById('note').style.display = 'block';


                window.domainData = data;

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
        hideError();
        const domain = domainInput.value.trim().toLowerCase();

        if (!domain) {
            showError('Please enter a domain name.');
            return;
        }


        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
        if (!domainRegex.test(domain)) {
            showError('Please enter a valid domain name.');
            return;
        }

        checkDomain(domain);
    });


    [checkAnotherDomainBtn, checkAnotherDomainBtnInModal].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function () {
                $('#domainModal').modal('show');
                document.getElementById('content').classList.add('blurred');
                document.getElementById('note').style.display = 'none';
                domainInput.value = '';
                hideError();
                noBreachMessage.style.display = 'none';
                focusInput();
            });
        }
    });


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


        if (typeof window.clearPhishingTable === 'function') {
            window.clearPhishingTable();
        }
    }
}); 