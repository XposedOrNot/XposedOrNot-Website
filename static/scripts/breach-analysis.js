let allData = null;
let filteredData = null;
let breachTable = null;
let expandedNodes = new Set();
let emailTypeahead = null;


function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const icon = themeToggle.querySelector('i');

    function updateThemeIcon(isDark) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = html.getAttribute('data-bs-theme') === 'dark';
        html.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
        updateThemeIcon(!isDark);
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    });


    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme === 'dark');
}


function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}


function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        email: params.get('email'),
        token: params.get('token')
    };
}


async function init() {
    showLoading();
    initializeTheme();

    const params = getUrlParams();
    if (!params.email || !params.token) {
        hideLoading();
        alert('Missing required parameters');
        window.location.href = 'breach-dashboard.html';
        return;
    }


    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = `breach-dashboard.html?email=${encodeURIComponent(params.email)}&token=${encodeURIComponent(params.token)}`;
    });

    try {
        const response = await fetch(`https://api.xposedornot.com/v1/send_domain_breaches?email=${encodeURIComponent(params.email)}&token=${encodeURIComponent(params.token)}`);
        allData = await response.json();
        filteredData = allData;

        populateFilters();
        setupFilterListeners();
        updateSummaryTiles();
        initializeVisualization();
        initializeDataTable();
        updateTop10Lists();

    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error loading data. Please try again.');
    } finally {
        hideLoading();
    }
}


function initializeEmailTypeahead() {
    const emails = [...new Set(allData.Breaches_Details.map(item => item.email))];


    const emailEngine = new Bloodhound({
        local: emails,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        datumTokenizer: Bloodhound.tokenizers.whitespace
    });


    if (emailTypeahead) {
        emailTypeahead.typeahead('destroy');
    }


    emailTypeahead = $('#emailFilter').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
        {
            name: 'emails',
            source: emailEngine
        });


    emailTypeahead.on('typeahead:select', function (ev, suggestion) {
        filterData();
    });
}


function populateFilters() {

    const domains = [...new Set(allData.Breaches_Details.map(item => item.domain))];
    const domainSelect = document.getElementById('domainFilter');
    domainSelect.innerHTML = '<option value="">All Domains</option>';
    domains.forEach(domain => {
        const option = new Option(domain, domain);
        domainSelect.add(option);
    });


    const breaches = Object.keys(allData.Detailed_Breach_Info);
    const breachSelect = document.getElementById('breachFilter');
    breachSelect.innerHTML = '<option value="">All Breaches</option>';
    breaches.forEach(breach => {
        const option = new Option(breach, breach);
        breachSelect.add(option);
    });


    const years = Object.keys(allData.Yearly_Metrics).sort((a, b) => b - a);
    const yearSelect = document.getElementById('yearFilter');
    yearSelect.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        const option = new Option(year, year);
        yearSelect.add(option);
    });


    initializeEmailTypeahead();
}


function setupFilterListeners() {
    ['domainFilter', 'breachFilter', 'yearFilter'].forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('change', () => {
            updateFilterActiveState(element);
            filterData();
        });
    });


    const emailFilter = document.getElementById('emailFilter');
    emailFilter.addEventListener('input', debounce(() => {
        updateFilterActiveState(emailFilter);
        filterData();
    }, 300));


    document.getElementById('clearEmailFilter').addEventListener('click', () => {
        emailFilter.value = '';
        updateFilterActiveState(emailFilter);
        filterData();
    });
}


function updateFilterActiveState(element) {
    if (element.value) {
        element.classList.add('filter-active');
    } else {
        element.classList.remove('filter-active');
    }
}


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


function filterData() {
    const selectedDomain = document.getElementById('domainFilter').value;
    const selectedBreach = document.getElementById('breachFilter').value;
    const selectedYear = document.getElementById('yearFilter').value;
    const emailSearch = document.getElementById('emailFilter').value.toLowerCase();

    expandedNodes.clear();

    if (selectedBreach) {
        expandedNodes.add(selectedBreach);
    }
    if (selectedDomain) {
        expandedNodes.add(selectedDomain);
    }

    filteredData = {
        ...allData,
        Breaches_Details: allData.Breaches_Details.filter(item => {
            const matchDomain = !selectedDomain || item.domain === selectedDomain;
            const matchBreach = !selectedBreach || item.breach === selectedBreach;
            const breachDate = allData.Detailed_Breach_Info[item.breach]?.breached_date;
            const breachYear = breachDate ? new Date(breachDate).getFullYear().toString() : '';
            const matchYear = !selectedYear || breachYear === selectedYear;
            const matchEmail = !emailSearch || item.email.toLowerCase().includes(emailSearch);

            return matchDomain && matchBreach && matchYear && matchEmail;
        })
    };

    updateSummaryTiles();
    updateVisualization();
    updateDataTable();
    updateTop10Lists();
}


function updateSummaryTiles() {
    const uniqueBreaches = new Set(filteredData.Breaches_Details.map(item => item.breach)).size;
    const uniqueEmails = new Set(filteredData.Breaches_Details.map(item => item.email)).size;
    const riskScore = calculateRiskScore(filteredData.Breaches_Details);

    document.getElementById('totalBreaches').innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-shield-alt fa-2x me-3 text-danger"></i>
            <span>${uniqueBreaches}</span>
        </div>
    `;
    document.getElementById('riskScore').innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
            <span>${riskScore}</span>
        </div>
    `;
    document.getElementById('uniqueEmails').innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-envelope fa-2x me-3 text-primary"></i>
            <span>${uniqueEmails}</span>
        </div>
    `;
}


function calculateRiskScore(breaches) {
    const riskWeights = {
        'plaintext': 1.0,
        'easytocrack': 0.8,
        'hardtocrack': 0.5,
        'unknown': 0.3
    };

    let totalRisk = 0;
    const uniqueBreaches = [...new Set(breaches.map(item => item.breach))];

    uniqueBreaches.forEach(breach => {
        const breachInfo = allData.Detailed_Breach_Info[breach];

        if (!breachInfo) {
            console.warn(`Missing breach information for: ${breach}`);
            totalRisk += riskWeights['unknown'];
            return;
        }
        const weight = riskWeights[breachInfo.password_risk] || riskWeights['unknown'];
        totalRisk += weight;
    });

    return Math.min(Math.round(totalRisk * 10), 100);
}


function initializeVisualization() {
    const container = document.getElementById('visualization');
    d3.select('#visualization')
        .append('svg')
        .attr('width', container.clientWidth)
        .attr('height', container.clientHeight);

    updateVisualization();
    window.addEventListener('resize', debounce(() => {
        updateVisualization();
    }, 250));
}


function updateVisualizationSize() {
    const container = document.getElementById('visualization');
    if (!container) return;

    const nodeCount = filteredData?.Breaches_Details?.length || 0;
    const uniqueBreaches = new Set(filteredData?.Breaches_Details?.map(item => item.breach)).size || 0;


    let baseHeight = Math.max(
        600,
        Math.min(2000, nodeCount * 15 + uniqueBreaches * 30)
    );


    let height;
    if (window.innerWidth >= 1200) {
        height = Math.max(baseHeight, window.innerHeight - 300);
    } else {
        height = Math.max(baseHeight, window.innerHeight - 400);
    }


    const minWidth = nodeCount > 500 ? 1200 : 800;
    const width = Math.max(container.clientWidth, minWidth);


    container.style.height = `${height}px`;
    container.style.minWidth = `${minWidth}px`;
    container.style.overflowX = 'auto';


    const svg = d3.select('#visualization svg');
    if (svg.node()) {
        svg.attr('width', width)
            .attr('height', height);
    }
}


function updateVisualization() {
    const container = document.getElementById('visualization');
    const width = container.clientWidth;
    const height = container.clientHeight;


    d3.select('#visualization svg').html('');


    const nodeIcons = {
        domain: '\uf0ac',
        email: '\uf0e0',
        breach: '\uf3ed'
    };


    const defs = d3.select('#visualization svg').append('defs');
    defs.append('style')
        .text(`@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');`);


    const nodes = [];
    const links = [];


    const domains = [...new Set(filteredData.Breaches_Details.map(item => item.domain))];
    domains.forEach(domain => {
        const emailCount = filteredData.Breaches_Details.filter(item => item.domain === domain).length;
        nodes.push({ id: domain, type: 'domain', label: `${domain} (${emailCount})` });
    });


    const breaches = [...new Set(filteredData.Breaches_Details.map(item => item.breach))];
    breaches.forEach(breach => {
        const emailCount = filteredData.Breaches_Details.filter(item => item.breach === breach).length;
        nodes.push({ id: breach, type: 'breach', label: `${breach} (${emailCount})` });
    });


    filteredData.Breaches_Details.forEach(item => {
        const shouldShowEmail = expandedNodes.has(item.breach) || expandedNodes.has(item.domain);
        if (shouldShowEmail) {
            if (!nodes.find(n => n.id === item.email)) {
                nodes.push({ id: item.email, type: 'email', label: item.email });
            }
            links.push({ source: item.domain, target: item.email });
            links.push({ source: item.email, target: item.breach });
        } else {

            links.push({ source: item.domain, target: item.breach });
        }
    });


    const nodeCount = nodes.length;
    const isLargeDataset = nodeCount > 100;

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(isLargeDataset ? 200 : 150))
        .force('charge', d3.forceManyBody().strength(isLargeDataset ? -800 : -500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(isLargeDataset ? 80 : 50));

    const svg = d3.select('#visualization svg');


    svg.append('defs').selectAll('marker')
        .data(['end'])
        .enter().append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');


    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrow)')
        .attr('stroke-width', d => {
            return (d.source.type === 'domain' && d.target.type === 'breach') ? 2 : 1;
        });


    const nodeGroup = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', d => `node-group ${expandedNodes.has(d.id) ? 'expanded' : ''}`)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
        .on('click', (event, d) => handleNodeClick(event, d));


    nodeGroup.append('circle')
        .attr('r', d => {
            switch (d.type) {
                case 'domain': return 15;
                case 'breach': return 12;
                case 'email': return 10;
                default: return 10;
            }
        })
        .attr('fill', d => {
            switch (d.type) {
                case 'domain': return '#28a745';
                case 'email': return '#0d6efd';
                case 'breach': return '#dc3545';
                default: return '#999';
            }
        })
        .attr('stroke', d => expandedNodes.has(d.id) ? '#ffc107' : '#fff')
        .attr('stroke-width', d => expandedNodes.has(d.id) ? 3 : 1.5);


    nodeGroup.append('text')
        .attr('class', 'fa')
        .attr('font-family', 'FontAwesome')
        .attr('font-size', d => {
            switch (d.type) {
                case 'domain': return '14px';
                case 'breach': return '12px';
                case 'email': return '10px';
                default: return '10px';
            }
        })
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(d => nodeIcons[d.type]);


    nodeGroup.append('text')
        .text(d => {
            if (d.type === 'email' && !expandedNodes.has(d.id) &&
                !expandedNodes.has(getConnectedBreach(d.id)) &&
                !expandedNodes.has(getConnectedDomain(d.id))) {
                return '';
            }
            const maxLength = d.type === 'email' ? 30 : 20;
            const label = d.label.length > maxLength ? d.label.substring(0, maxLength) + '...' : d.label;
            return label;
        })
        .attr('x', d => d.type === 'email' ? 12 : 18)
        .attr('y', 4)
        .attr('font-size', d => d.type === 'email' ? '8px' : '10px')
        .attr('font-family', 'Arial')
        .attr('fill', () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#e9ecef' : '#000')
        .attr('stroke', () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'none' : '#ffffff')
        .attr('stroke-width', '1px')
        .attr('paint-order', 'stroke')
        .attr('pointer-events', 'none');


    nodeGroup.append('title')
        .text(d => `${d.type}: ${d.label}`);


    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodeGroup
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });


    function getConnectedBreach(emailId) {
        const connection = filteredData.Breaches_Details.find(item => item.email === emailId);
        return connection ? connection.breach : null;
    }

    function getConnectedDomain(emailId) {
        const connection = filteredData.Breaches_Details.find(item => item.email === emailId);
        return connection ? connection.domain : null;
    }


    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
}


function initializeDataTable() {
    breachTable = $('#breachTable').DataTable({
        data: processTableData(),
        columns: [
            { data: 'email' },
            { data: 'domain' },
            { data: 'breach' },
            {
                data: 'breachDate',
                render: function (data) {
                    const date = new Date(data);
                    const month = date.toLocaleString('default', { month: 'short' });
                    const year = date.getFullYear();
                    return `${month}-${year}`;
                }
            },
            {
                data: 'exposedData',
                render: function (data) {
                    return data.split(';').join(', ');
                }
            }
        ],
        dom: '<"d-flex justify-content-between align-items-center mb-3"Bf>rt<"d-flex justify-content-between align-items-center"lip>',
        buttons: [
            {
                extend: 'collection',
                text: 'Export',
                buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
            }
        ],
        pageLength: 10,
        order: [[3, 'desc']],
        responsive: true,
        language: {
            search: 'Search results:',
            lengthMenu: 'Show _MENU_ entries per page',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries'
        }
    });
}


function updateDataTable() {
    breachTable.clear().rows.add(processTableData()).draw();
}


function processTableData() {
    return filteredData.Breaches_Details.map(item => {
        const breachInfo = allData.Detailed_Breach_Info[item.breach] || {
            breached_date: 'Unknown',
            xposed_data: 'Information not available'
        };
        return {
            email: item.email,
            domain: item.domain,
            breach: item.breach,
            breachDate: breachInfo.breached_date,
            exposedData: breachInfo.xposed_data
        };
    });
}


function handleNodeClick(event, d) {
    if (d.type === 'domain' || d.type === 'breach') {
        if (expandedNodes.has(d.id)) {
            expandedNodes.delete(d.id);
        } else {
            expandedNodes.add(d.id);
        }


        if (d.type === 'domain') {
            const element = document.getElementById('domainFilter');
            element.value = expandedNodes.has(d.id) ? d.id : '';
            updateFilterActiveState(element);
        } else if (d.type === 'breach') {
            const element = document.getElementById('breachFilter');
            element.value = expandedNodes.has(d.id) ? d.id : '';
            updateFilterActiveState(element);
        }


        filterData();
    }
}


function updateTop10Lists() {
    // Update Top 10 Breaches
    const breachCounts = {};
    filteredData.Breaches_Details.forEach(item => {
        breachCounts[item.breach] = (breachCounts[item.breach] || 0) + 1;
    });

    const sortedBreaches = Object.entries(breachCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    const topBreachesBody = document.querySelector('#topBreachesTable tbody');
    topBreachesBody.innerHTML = '';

    sortedBreaches.forEach(([breach, count]) => {
        const breachInfo = allData.Detailed_Breach_Info[breach];
        const riskLevel = breachInfo?.password_risk || 'unknown';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <a href="#" class="breach-link" data-breach="${breach}">
                    ${breach}
                </a>
            </td>
            <td>${count}</td>
            <td>
                <span class="badge ${getRiskBadgeClass(riskLevel)}">
                    ${riskLevel}
                </span>
            </td>
        `;
        topBreachesBody.appendChild(row);
    });

    // Update Top 10 Emails
    const emailBreachCounts = {};
    const emailDomains = {};

    filteredData.Breaches_Details.forEach(item => {
        emailBreachCounts[item.email] = (emailBreachCounts[item.email] || 0) + 1;
        emailDomains[item.email] = emailDomains[item.email] || new Set();
        emailDomains[item.email].add(item.domain);
    });

    const sortedEmails = Object.entries(emailBreachCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    const topEmailsBody = document.querySelector('#topEmailsTable tbody');
    topEmailsBody.innerHTML = '';

    sortedEmails.forEach(([email, count]) => {
        const domains = Array.from(emailDomains[email]);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <a href="#" class="email-link" data-email="${email}">
                    ${email}
                </a>
            </td>
            <td>${count}</td>
            <td>
                <span class="badge bg-secondary" title="${domains.join(', ')}">
                    ${domains.length} domain${domains.length !== 1 ? 's' : ''}
                </span>
            </td>
        `;
        topEmailsBody.appendChild(row);
    });

    // Add click handlers
    document.querySelectorAll('.breach-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const breach = e.target.dataset.breach;
            document.getElementById('breachFilter').value = breach;
            filterData();
        });
    });

    document.querySelectorAll('.email-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const email = e.target.dataset.email;
            document.getElementById('emailFilter').value = email;
            filterData();
        });
    });
}

function getRiskBadgeClass(risk) {
    switch (risk) {
        case 'plaintext': return 'bg-danger';
        case 'easytocrack': return 'bg-warning text-dark';
        case 'hardtocrack': return 'bg-success';
        default: return 'bg-secondary';
    }
}

// Add CSS for the badges
const style = document.createElement('style');
style.textContent = `
    .badge {
        font-size: 0.8em;
        padding: 0.4em 0.6em;
    }
    .breach-link, .email-link {
        text-decoration: none;
        color: inherit;
    }
    .breach-link:hover, .email-link:hover {
        text-decoration: underline;
    }
    [data-bs-theme="dark"] .text-dark {
        color: #000 !important;
    }
`;
document.head.appendChild(style);


document.addEventListener('DOMContentLoaded', () => {
    init();
});