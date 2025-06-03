let phishingTable;

$(document).ready(function () {
    // Initialize DataTable with default options
    phishingTable = $('#phishingDomainsTable').DataTable({
        responsive: true,
        pageLength: 10,
        order: [[0, 'asc']],
        columns: [
            {
                data: 'domain',
                width: '20%',
                render: function (data, type, row) {
                    if (type === 'display') {
                        const isLive = row.dns_a && row.dns_a.length > 0;
                        const liveIndicator = isLive ?
                            '<span class="live-indicator" title="Domain is live"></span>' :
                            '<span class="dead-indicator" title="Domain is not live"></span>';
                        return `<div class="domain-cell">${liveIndicator} ${data || '-'}</div>`;
                    }
                    return data || '-';
                }
            },
            {
                data: 'fuzzer',
                width: '10%',
                render: function (data) {
                    return `<div class="table-cell">${data || '-'}</div>`;
                }
            },
            {
                data: 'dns_ns',
                width: '20%',
                render: function (data) {
                    return `<div class="table-cell">${Array.isArray(data) ? data.join('<br>') : '-'}</div>`;
                }
            },
            {
                data: 'dns_a',
                width: '20%',
                render: function (data) {
                    return `<div class="table-cell">${Array.isArray(data) ? data.join('<br>') : '-'}</div>`;
                }
            },
            {
                data: 'dns_mx',
                width: '15%',
                render: function (data) {
                    if (!data || data.length === 0 || (data.length === 1 && data[0] === '')) {
                        return '<div class="table-cell">-</div>';
                    }
                    return `<div class="table-cell">${Array.isArray(data) ? data.join('<br>') : data}</div>`;
                }
            },
            {
                data: 'whois_created',
                width: '10%',
                render: function (data) {
                    return `<div class="table-cell">${data ? new Date(data).toLocaleDateString() : '-'}</div>`;
                }
            },
            {
                data: null,
                width: '15%',
                render: function (row) {
                    return `<div class="table-cell">${row.whois_registrar || '-'}</div>`;
                }
            }
        ],
        language: {
            search: "Search domains:",
            lengthMenu: "Show _MENU_ domains per page",
            info: "",
            infoEmpty: "",
            infoFiltered: ""
        },
        dom: '<"top"Bf>rt<"bottom"l<"datatable-paginate"p>><"clear">',
        buttons: [
            {
                extend: 'collection',
                text: 'Export',
                className: 'btn btn-primary export-btn',
                buttons: [
                    {
                        extend: 'csv',
                        text: 'CSV',
                        className: 'btn btn-light',
                        exportOptions: {
                            columns: ':visible'
                        }
                    },
                    {
                        extend: 'excel',
                        text: 'Excel',
                        className: 'btn btn-light',
                        exportOptions: {
                            columns: ':visible'
                        }
                    },
                    {
                        extend: 'pdf',
                        text: 'PDF',
                        className: 'btn btn-light',
                        exportOptions: {
                            columns: ':visible'
                        }
                    }
                ]
            }
        ],
        initComplete: function () {
            // Add custom styling for dark mode
            $('.dataTables_wrapper').css('color', '#fff');
            $('.dataTables_length').css('color', '#fff');
            $('.dataTables_filter').css({
                'color': '#fff',
                'margin-left': 'auto'
            });
            $('.dataTables_paginate').css('color', '#fff');
            $('.btn-light').css('color', '#000');

            // Style the export button
            $('.dt-buttons').css({
                'display': 'inline-block',
                'margin-right': '15px'
            });

            $('.dt-buttons .btn').css({
                'background-color': '#D63031',
                'border-color': '#D63031',
                'color': '#fff',
                'margin-right': '5px'
            });

            // Style the top row
            $('.dataTables_wrapper .top').css({
                'display': 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
                'margin-bottom': '15px'
            });
        },
        drawCallback: function () {
            // Remove show more initialization
        }
    });

    // Function to update table with new data
    window.updatePhishingTable = function (data) {
        if (!data || !data.raw_results || !Array.isArray(data.raw_results) || data.raw_results.length === 0) {
            phishingTable.clear().draw();
            $('#phishingDomainsTable_wrapper').hide();
            return;
        }

        // Clear existing data
        phishingTable.clear();

        // Process and validate data before adding
        const processedData = data.raw_results.map(row => ({
            ...row,
            // Ensure all required fields exist
            domain: row.domain || '',
            fuzzer: row.fuzzer || '',
            dns_ns: Array.isArray(row.dns_ns) ? row.dns_ns : [],
            dns_a: Array.isArray(row.dns_a) ? row.dns_a : [],
            dns_mx: Array.isArray(row.dns_mx) ? row.dns_mx : [],
            whois_created: row.whois_created || '',
            whois_registrar: row.whois_registrar || ''
        }));

        // Add new data
        phishingTable.rows.add(processedData).draw();

        // Show/hide table based on data availability
        if (processedData.length > 0) {
            $('#phishingDomainsTable_wrapper').show();
        } else {
            $('#phishingDomainsTable_wrapper').hide();
        }
    };

    // Function to clear table
    window.clearPhishingTable = function () {
        phishingTable.clear().draw();
        $('#phishingDomainsTable_wrapper').hide();
    };

    // Initially hide the table wrapper
    $('#phishingDomainsTable_wrapper').hide();

    // Remove the show more related functions
    // Remove createExpandableCell and initializeShowMore functions

    // Remove the window resize handler for show more
    $(window).off('resize');
}); 