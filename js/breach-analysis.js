// Global variables to store data
let allData = null;
let filteredData = null;
let breachTable = null;
let expandedNodes = new Set();
let emailTypeahead = null;

// Theme handling
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

    // Set initial theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme === 'dark');
}

// Loading state handling
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Parse URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        email: params.get('email'),
        token: params.get('token')
    };
}

// Initialize the application
async function init() {
    showLoading();
    initializeTheme();

    const params = getUrlParams();
    if (!params.email || !params.token) {
        hideLoading();
        alert('Missing required parameters');
        return;
    }

    try {
        // Fetch data from API
        const response = await fetch(`https://api.xposedornot.com/v1/send_domain_breaches?email=${encodeURIComponent(params.email)}&token=${encodeURIComponent(params.token)}`);
        allData = await response.json();
        filteredData = allData;

        // Initialize components
        populateFilters();
        setupFilterListeners();
        updateSummaryTiles();
        initializeVisualization();
        initializeDataTable();

    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error loading data. Please try again.');
    } finally {
        hideLoading();
    }
}

// Initialize email typeahead
function initializeEmailTypeahead() {
    const emails = [...new Set(allData.Breaches_Details.map(item => item.email))];

    // Initialize Bloodhound for email suggestions
    const emailEngine = new Bloodhound({
        local: emails,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        datumTokenizer: Bloodhound.tokenizers.whitespace
    });

    // Clear existing typeahead if it exists
    if (emailTypeahead) {
        emailTypeahead.typeahead('destroy');
    }

    // Initialize typeahead
    emailTypeahead = $('#emailFilter').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
        {
            name: 'emails',
            source: emailEngine
        });

    // Handle selection
    emailTypeahead.on('typeahead:select', function (ev, suggestion) {
        filterData();
    });
}

// Populate filter dropdowns
function populateFilters() {
    // Domain filter
    const domains = [...new Set(allData.Breaches_Details.map(item => item.domain))];
    const domainSelect = document.getElementById('domainFilter');
    domainSelect.innerHTML = '<option value="">All Domains</option>';
    domains.forEach(domain => {
        const option = new Option(domain, domain);
        domainSelect.add(option);
    });

    // Breach filter
    const breaches = Object.keys(allData.Detailed_Breach_Info);
    const breachSelect = document.getElementById('breachFilter');
    breachSelect.innerHTML = '<option value="">All Breaches</option>';
    breaches.forEach(breach => {
        const option = new Option(breach, breach);
        breachSelect.add(option);
    });

    // Year filter
    const years = Object.keys(allData.Yearly_Metrics).sort((a, b) => b - a);
    const yearSelect = document.getElementById('yearFilter');
    yearSelect.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        const option = new Option(year, year);
        yearSelect.add(option);
    });

    // Initialize email typeahead
    initializeEmailTypeahead();
}

// Add event listeners for filters
function setupFilterListeners() {
    ['domainFilter', 'breachFilter', 'yearFilter'].forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('change', () => {
            updateFilterActiveState(element);
            filterData();
        });
    });

    // Email filter input
    const emailFilter = document.getElementById('emailFilter');
    emailFilter.addEventListener('input', debounce(() => {
        updateFilterActiveState(emailFilter);
        filterData();
    }, 300));

    // Clear email filter button
    document.getElementById('clearEmailFilter').addEventListener('click', () => {
        emailFilter.value = '';
        updateFilterActiveState(emailFilter);
        filterData();
    });
}

// Update filter active state
function updateFilterActiveState(element) {
    if (element.value) {
        element.classList.add('filter-active');
    } else {
        element.classList.remove('filter-active');
    }
}

// Debounce function to limit how often filterData is called
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

// Filter data based on selected values
function filterData() {
    const selectedDomain = document.getElementById('domainFilter').value;
    const selectedBreach = document.getElementById('breachFilter').value;
    const selectedYear = document.getElementById('yearFilter').value;
    const emailSearch = document.getElementById('emailFilter').value.toLowerCase();

    // Reset expanded nodes when filters change
    expandedNodes.clear();

    // Auto-expand selected breach or domain
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
}

// Update summary tiles with filtered data
function updateSummaryTiles() {
    const uniqueBreaches = [...new Set(filteredData.Breaches_Details.map(item => item.breach))];
    const uniqueEmails = [...new Set(filteredData.Breaches_Details.map(item => item.email))];

    // Calculate risk score (example implementation)
    const riskScore = calculateRiskScore(filteredData.Breaches_Details);

    document.getElementById('totalBreaches').textContent = uniqueBreaches.length;
    document.getElementById('uniqueEmails').textContent = uniqueEmails.length;
    document.getElementById('riskScore').textContent = riskScore;
}

// Calculate risk score based on breach types and counts
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
        // Handle cases where breach info is missing
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

// Initialize D3.js visualization
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

// Update visualization size based on content
function updateVisualizationSize() {
    const container = document.getElementById('visualization');
    if (!container) return;

    const nodeCount = filteredData?.Breaches_Details?.length || 0;
    const uniqueBreaches = new Set(filteredData?.Breaches_Details?.map(item => item.breach)).size || 0;

    // Calculate base height based on number of nodes and breaches
    let baseHeight = Math.max(
        600,
        Math.min(2000, nodeCount * 15 + uniqueBreaches * 30)
    );

    // Adjust height based on screen size
    let height;
    if (window.innerWidth >= 1200) {
        height = Math.max(baseHeight, window.innerHeight - 300);
    } else {
        height = Math.max(baseHeight, window.innerHeight - 400);
    }

    // For very large datasets, ensure minimum width
    const minWidth = nodeCount > 500 ? 1200 : 800;
    const width = Math.max(container.clientWidth, minWidth);

    // Update container dimensions
    container.style.height = `${height}px`;
    container.style.minWidth = `${minWidth}px`;
    container.style.overflowX = 'auto';

    // Update SVG dimensions
    const svg = d3.select('#visualization svg');
    if (svg.node()) {
        svg.attr('width', width)
            .attr('height', height);
    }
}

// Update D3.js visualization with filtered data
function updateVisualization() {
    const container = document.getElementById('visualization');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear existing visualization
    d3.select('#visualization svg').html('');

    // Define icons for node types
    const nodeIcons = {
        domain: '\uf0ac', // Globe icon
        email: '\uf0e0',  // Envelope icon
        breach: '\uf3ed'  // Shield-alt icon
    };

    // Add Font Awesome to SVG
    const defs = d3.select('#visualization svg').append('defs');
    defs.append('style')
        .text(`@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');`);

    // Prepare data for visualization
    const nodes = [];
    const links = [];

    // Add domain nodes
    const domains = [...new Set(filteredData.Breaches_Details.map(item => item.domain))];
    domains.forEach(domain => {
        const emailCount = filteredData.Breaches_Details.filter(item => item.domain === domain).length;
        nodes.push({ id: domain, type: 'domain', label: `${domain} (${emailCount})` });
    });

    // Add breach nodes
    const breaches = [...new Set(filteredData.Breaches_Details.map(item => item.breach))];
    breaches.forEach(breach => {
        const emailCount = filteredData.Breaches_Details.filter(item => item.breach === breach).length;
        nodes.push({ id: breach, type: 'breach', label: `${breach} (${emailCount})` });
    });

    // Add email nodes and links only for expanded nodes
    filteredData.Breaches_Details.forEach(item => {
        const shouldShowEmail = expandedNodes.has(item.breach) || expandedNodes.has(item.domain);
        if (shouldShowEmail) {
            if (!nodes.find(n => n.id === item.email)) {
                nodes.push({ id: item.email, type: 'email', label: item.email });
            }
            links.push({ source: item.domain, target: item.email });
            links.push({ source: item.email, target: item.breach });
        } else {
            // Direct link between domain and breach when not expanded
            links.push({ source: item.domain, target: item.breach });
        }
    });

    // Create force simulation with adjusted forces for larger datasets
    const nodeCount = nodes.length;
    const isLargeDataset = nodeCount > 100;

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(isLargeDataset ? 200 : 150))
        .force('charge', d3.forceManyBody().strength(isLargeDataset ? -800 : -500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(isLargeDataset ? 80 : 50));

    const svg = d3.select('#visualization svg');

    // Create arrow markers for links
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

    // Draw links
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

    // Create node groups
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

    // Add circles to nodes
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

    // Add icons to nodes
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

    // Add labels with improved visibility
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
        .attr('fill', () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#e9ecef' : '#333')
        .attr('stroke', () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'none' : '#ffffff')
        .attr('stroke-width', '0.5px')
        .attr('pointer-events', 'none');

    // Add tooltips
    nodeGroup.append('title')
        .text(d => `${d.type}: ${d.label}`);

    // Update positions on tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodeGroup
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Helper functions
    function getConnectedBreach(emailId) {
        const connection = filteredData.Breaches_Details.find(item => item.email === emailId);
        return connection ? connection.breach : null;
    }

    function getConnectedDomain(emailId) {
        const connection = filteredData.Breaches_Details.find(item => item.email === emailId);
        return connection ? connection.domain : null;
    }

    // Drag functions
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

// Initialize DataTables
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
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = date.toLocaleString('default', { month: 'short' });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
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

// Update DataTable with filtered data
function updateDataTable() {
    breachTable.clear().rows.add(processTableData()).draw();
}

// Process data for DataTable
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

// Handle node click events
function handleNodeClick(event, d) {
    if (d.type === 'domain' || d.type === 'breach') {
        if (expandedNodes.has(d.id)) {
            expandedNodes.delete(d.id);
        } else {
            expandedNodes.add(d.id);
        }

        // Update filters based on selection
        if (d.type === 'domain') {
            const element = document.getElementById('domainFilter');
            element.value = expandedNodes.has(d.id) ? d.id : '';
            updateFilterActiveState(element);
        } else if (d.type === 'breach') {
            const element = document.getElementById('breachFilter');
            element.value = expandedNodes.has(d.id) ? d.id : '';
            updateFilterActiveState(element);
        }

        // Update visualization and table
        filterData();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
});