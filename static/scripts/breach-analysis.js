let allData = null;
let filteredData = null;
let breachTable = null;
let expandedNodes = new Set();
let emailTypeahead = null;
let currentZoom = null;
let currentSvg = null;
let nodeToCenterOnLoad = null;


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


        d3.selectAll('#visualization text:not(.fa)')
            .attr('fill', isDark ? 'light' : '#000')
            .attr('stroke', isDark ? 'none' : '#ffffff');
    });


    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme === 'dark');
}


function initializeVisualizationToggle() {
    const toggleBtn = document.getElementById('toggleVisualization');
    const vizCard = document.getElementById('visualizationCard');
    const vizIcon = document.getElementById('vizToggleIcon');
    const vizText = document.getElementById('vizToggleText');

    toggleBtn.addEventListener('click', () => {
        const isCollapsed = vizCard.classList.contains('collapsed');

        if (isCollapsed) {
            vizCard.classList.remove('collapsed');
            vizIcon.className = 'fas fa-chevron-up';
            vizText.textContent = 'Collapse';
            toggleBtn.classList.remove('collapsed');
        } else {
            vizCard.classList.add('collapsed');
            vizIcon.className = 'fas fa-chevron-down';
            vizText.textContent = 'Expand';
            toggleBtn.classList.add('collapsed');
        }
    });

    document.getElementById('resetVisualization').addEventListener('click', clearAllFilters);
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
    initializeVisualizationToggle();

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
        updateClearAllButtonState();

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


    document.getElementById('clearAllFilters').addEventListener('click', clearAllFilters);
}


function clearAllFilters() {
    document.getElementById('emailFilter').value = '';
    document.getElementById('domainFilter').value = '';
    document.getElementById('breachFilter').value = '';
    document.getElementById('yearFilter').value = '';

    expandedNodes.clear();
    nodeToCenterOnLoad = null; // Clear centering target

    ['emailFilter', 'domainFilter', 'breachFilter', 'yearFilter'].forEach(id => {
        const element = document.getElementById(id);
        element.classList.remove('filter-active');
    });

    filteredData = allData;
    updateSummaryTiles();
    updateVisualization();
    updateDataTable();
    updateTop10Lists();
    updateClearAllButtonState();
}


function updateFilterActiveState(element) {
    if (element.value) {
        element.classList.add('filter-active');
    } else {
        element.classList.remove('filter-active');
    }
    updateClearAllButtonState();
}


function updateClearAllButtonState() {
    const clearAllBtn = document.getElementById('clearAllFilters');
    const resetVizBtn = document.getElementById('resetVisualization');
    const filterBadge = document.getElementById('filterBadge');

    const hasActiveFilters =
        document.getElementById('emailFilter').value !== '' ||
        document.getElementById('domainFilter').value !== '' ||
        document.getElementById('breachFilter').value !== '' ||
        document.getElementById('yearFilter').value !== '' ||
        expandedNodes.size > 0;

    if (hasActiveFilters) {
        clearAllBtn.classList.remove('btn-outline-primary');
        clearAllBtn.classList.add('btn-primary');

        resetVizBtn.style.display = 'inline-flex';
        filterBadge.style.display = 'inline-block';
    } else {
        clearAllBtn.classList.remove('btn-primary');
        clearAllBtn.classList.add('btn-outline-primary');

        resetVizBtn.style.display = 'none';
        filterBadge.style.display = 'none';
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
    updateClearAllButtonState();
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


    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', Math.max(800, container.clientWidth))
        .attr('height', container.clientHeight);


    const zoom = d3.zoom()
        .scaleExtent([0.5, 2])
        .on('zoom', (event) => {
            svg.selectAll('g').attr('transform', event.transform);
        });

    svg.call(zoom);


    updateVisualization();


    window.addEventListener('resize', debounce(() => {
        updateVisualizationSize();
    }, 250));
}


function updateVisualizationSize() {
    const container = document.getElementById('visualization');
    if (!container) return;

    const nodeCount = filteredData?.Breaches_Details?.length || 0;
    const uniqueBreaches = new Set(filteredData?.Breaches_Details?.map(item => item.breach)).size || 0;


    const minWidth = Math.max(800, nodeCount * 10);


    const svg = d3.select('#visualization svg');
    if (svg.node()) {
        svg
            .attr('width', Math.max(minWidth, container.clientWidth))
            .attr('height', container.clientHeight);
    }
}


function updateVisualization() {
    const container = document.getElementById('visualization');

    const nodes = [];
    const links = [];

    const domains = [...new Set(filteredData.Breaches_Details.map(item => item.domain))];
    domains.forEach(domain => {
        const emailCount = filteredData.Breaches_Details.filter(item => item.domain === domain).length;
        nodes.push({ id: domain, type: 'domain', label: `${domain} (${emailCount})`, emailCount: emailCount });
    });

    const breaches = [...new Set(filteredData.Breaches_Details.map(item => item.breach))];
    breaches.forEach(breach => {
        const emailCount = filteredData.Breaches_Details.filter(item => item.breach === breach).length;
        nodes.push({ id: breach, type: 'breach', label: `${breach} (${emailCount})`, emailCount: emailCount });
    });

    filteredData.Breaches_Details.forEach(item => {
        const shouldShowEmail = expandedNodes.has(item.breach) || expandedNodes.has(item.domain);
        if (shouldShowEmail) {
            if (!nodes.find(n => n.id === item.email)) {
                nodes.push({ id: item.email, type: 'email', label: item.email, emailCount: 1 });
            }
            links.push({ source: item.domain, target: item.email });
            links.push({ source: item.email, target: item.breach });
        } else {
            links.push({ source: item.domain, target: item.breach });
        }
    });

    const nodeCount = nodes.length;
    const isLargeDataset = nodeCount > 100;
    const isVeryLargeDataset = nodeCount > 500;

    const breachAndDomainNodes = nodes.filter(n => n.type === 'breach' || n.type === 'domain');
    const emailCounts = breachAndDomainNodes.map(n => n.emailCount || 1);
    const minEmails = Math.min(...emailCounts);
    const maxEmails = Math.max(...emailCounts);

    function getDynamicFontSize(emailCount, type) {
        if (!emailCount) return type === 'email' ? 9 : 11;

        if (emailCount <= 5) {
            return type === 'breach' ? 14 : (type === 'domain' ? 13 : 10);
        }
        else if (emailCount <= 20) {
            return type === 'breach' ? 12 : (type === 'domain' ? 11 : 9);
        }
        else if (emailCount <= 50) {
            return type === 'breach' ? 10 : (type === 'domain' ? 10 : 8);
        }
        else {
            return type === 'breach' ? 9 : (type === 'domain' ? 9 : 8);
        }
    }

    function getDynamicNodeRadius(emailCount, type) {
        if (!emailCount) return type === 'domain' ? 12 : (type === 'breach' ? 10 : 8);

        if (emailCount <= 5) {
            return type === 'domain' ? 18 : (type === 'breach' ? 15 : 10);
        }
        else if (emailCount <= 20) {
            return type === 'domain' ? 16 : (type === 'breach' ? 13 : 10);
        }
        else if (emailCount <= 50) {
            return type === 'domain' ? 14 : (type === 'breach' ? 11 : 10);
        }
        else {
            return type === 'domain' ? 12 : (type === 'breach' ? 10 : 10);
        }
    }

    function getDynamicLabelLength(emailCount, type) {
        if (!emailCount) return type === 'email' ? 30 : 20;

        if (emailCount <= 5) {
            return type === 'breach' ? 40 : (type === 'domain' ? 35 : 35);
        }
        else if (emailCount <= 20) {
            return type === 'breach' ? 30 : (type === 'domain' ? 25 : 30);
        }
        else if (emailCount <= 50) {
            return type === 'breach' ? 20 : (type === 'domain' ? 20 : 25);
        }
        else {
            return type === 'breach' ? 15 : (type === 'domain' ? 15 : 20);
        }
    }

    const baseWidth = Math.max(1400, container.clientWidth);
    const baseHeight = 600;

    const hasExpandedNodes = expandedNodes.size > 0;
    const expansionMultiplier = hasExpandedNodes ? 4 : 3;

    let width, height;
    if (isVeryLargeDataset) {
        width = Math.max(baseWidth, nodeCount * 2.5);
        height = Math.max(baseHeight, nodeCount * 2);
    } else if (isLargeDataset) {
        width = Math.max(baseWidth, nodeCount * 3);
        height = Math.max(baseHeight, nodeCount * 2.5);
    } else {
        width = Math.max(baseWidth, nodeCount * expansionMultiplier);
        height = Math.max(baseHeight, nodeCount * expansionMultiplier);
    }

    const padding = 100;
    width += padding * 2;
    height += padding * 2;

    d3.select('#visualization svg').remove();

    const nodeIcons = {
        domain: '\uf0ac',
        email: '\uf0e0',
        breach: '\uf3ed'
    };

    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    currentSvg = svg;

    const defs = svg.append('defs');
    defs.append('style')
        .text(`@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');`);

    const linkDistance = isVeryLargeDataset ? 100 : (isLargeDataset ? 150 : 120);
    const chargeStrength = isVeryLargeDataset ? -400 : (isLargeDataset ? -600 : -500);

    let centerX = width / 2;
    let centerY = height / 2;

    if (expandedNodes.size === 1) {
        const expandedNodeId = Array.from(expandedNodes)[0];
        const expandedNode = nodes.find(n => n.id === expandedNodeId);
        if (expandedNode && expandedNode.type === 'domain') {
            centerX = width / 2;
            centerY = height / 3; // Slightly higher to show breaches below
        } else if (expandedNode && expandedNode.type === 'breach') {
            centerX = width / 2;
            centerY = height / 2;
        }
    }

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(linkDistance)
            .strength(0.5)) // Slightly weaker links = less oscillation
        .force('charge', d3.forceManyBody().strength(chargeStrength))
        .force('center', d3.forceCenter(centerX, centerY))
        .force('collision', d3.forceCollide()
            .radius(d => {
                const nodeRadius = getDynamicNodeRadius(d.emailCount, d.type);
                const textPadding = d.emailCount <= 5 ? 40 : 25;
                return nodeRadius + textPadding;
            })
            .strength(0.8)   // Stronger collision = less overlap
            .iterations(2))  // More collision iterations = better stability
        .alphaDecay(0.05)    // Faster decay = quicker settling (default: 0.0228)
        .alphaMin(0.001)     // Stop simulation sooner (default: 0.001)
        .velocityDecay(0.6); // More friction = less bouncing (default: 0.4)

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

    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.1).restart();
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

        simulation.alpha(0.3);
    }

    const g = svg.append('g');

    svg.selectAll('line').remove();
    svg.selectAll('.node-group').remove();

    const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrow)')
        .attr('stroke-width', d => {
            return (d.source.type === 'domain' && d.target.type === 'breach') ? 2 : 1;
        });

    const nodeGroup = g.append('g')
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
        .attr('r', d => getDynamicNodeRadius(d.emailCount, d.type))
        .attr('fill', d => {
            switch (d.type) {
                case 'domain': return '#28a745';
                case 'email': return '#0d6efd';
                case 'breach': return '#dc3545';
                default: return '#999';
            }
        })
        .attr('stroke', d => expandedNodes.has(d.id) ? '#ffc107' : '#fff')
        .attr('stroke-width', d => {
            if (d.emailCount <= 5) return expandedNodes.has(d.id) ? 3 : 2;
            return expandedNodes.has(d.id) ? 3 : 1.5;
        });

    nodeGroup.append('text')
        .attr('class', 'fa')
        .attr('font-family', 'FontAwesome')
        .attr('font-size', d => {
            const baseSize = getDynamicFontSize(d.emailCount, d.type);
            return `${baseSize - 2}px`;
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
            const maxLength = getDynamicLabelLength(d.emailCount, d.type);
            const label = d.label.length > maxLength ? d.label.substring(0, maxLength) + '...' : d.label;
            return label;
        })
        .attr('x', d => {
            const radius = getDynamicNodeRadius(d.emailCount, d.type);
            return radius + 5;
        })
        .attr('y', 4)
        .attr('font-size', d => `${getDynamicFontSize(d.emailCount, d.type)}px`)
        .attr('font-family', 'Arial')
        .attr('font-weight', d => {
            return (d.emailCount && d.emailCount <= 5) ? 'bold' : 'normal';
        })
        .attr('fill', () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#e9ecef' : '#000')
        .attr('stroke', () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'none' : '#ffffff')
        .attr('stroke-width', '1px')
        .attr('paint-order', 'stroke')
        .attr('pointer-events', 'none');

    nodeGroup.append('title')
        .text(d => `${d.type}: ${d.label}`);

    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .filter(function(event) {
            return event.type !== 'wheel' && (event.type === 'mousedown' || event.type === 'touchstart' || event.type === 'dblclick');
        })
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);
    currentZoom = zoom;

    function centerNode(node) {
        const container = document.getElementById('visualization');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const scale = 1; // Keep current scale or set to 1 for no zoom
        const x = containerWidth / 2 - node.x * scale;
        const y = containerHeight / 2 - node.y * scale;

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }

    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodeGroup
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    if (nodeCount < 100) {
        simulation.tick(50); // Pre-compute 50 iterations
        simulation.restart();
    }

    if (nodeToCenterOnLoad) {
        const nodeToCenter = nodes.find(n => n.id === nodeToCenterOnLoad);
        if (nodeToCenter) {
            setTimeout(() => {
                centerNode(nodeToCenter);
                nodeToCenterOnLoad = null; // Clear after centering
            }, 500); // Wait 500ms for initial positioning
        } else {
            nodeToCenterOnLoad = null;
        }
    }

    function getConnectedBreach(emailId) {
        const connection = filteredData.Breaches_Details.find(item => item.email === emailId);
        return connection ? connection.breach : null;
    }

    function getConnectedDomain(emailId) {
        const connection = filteredData.Breaches_Details.find(item => item.email === emailId);
        return connection ? connection.domain : null;
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
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
            '<"row"<"col-sm-12"tr>>' +
            '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        buttons: [
            {
                extend: 'collection',
                text: 'Export',
                buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
            }
        ],
        pageLength: 10,
        lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
        order: [[3, 'desc']],
        responsive: true,
        scrollX: true,
        scrollCollapse: true,
        autoWidth: false,
        language: {
            search: 'Search results:',
            lengthMenu: '_MENU_ entries per page',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: {
                first: '«',
                previous: '‹',
                next: '›',
                last: '»'
            }
        },
        drawCallback: function () {
            $(window).trigger('resize');
        },
        initComplete: function () {

            this.api().columns.adjust();
        }
    });


    $(window).on('resize', function () {
        if (breachTable) {
            breachTable.columns.adjust();
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
            nodeToCenterOnLoad = d.id;
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