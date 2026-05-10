$(document).ready(function () {
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortedData = [];
    let lastFetchedAt = null;

    function showLoading() {
        $('.loading-spinner').addClass('active');
        $('#news-container').hide();
    }

    function hideLoading() {
        $('.loading-spinner').removeClass('active');
        $('#news-container').show();
    }

    function updatePagination(totalPages) {
        $('#page-info').text(`Page ${currentPage} of ${totalPages}`);
        $('#prev-page').prop('disabled', currentPage === 1);
        $('#next-page').prop('disabled', currentPage === totalPages);
    }

    function fetchNews() {
        showLoading();
        $('#results-strip').prop('hidden', true);
        $.ajax({
            url: 'https://api.xposedornot.com/v1/xon-pulse',
            method: 'GET',
            success: function (response) {
                sortedData = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                lastFetchedAt = new Date();
                currentPage = 1;
                displayPaginatedNews();
                hideLoading();
            },
            error: function () {
                console.error('Failed to fetch news');
                hideLoading();
                renderErrorState();
            }
        });
    }

    function renderErrorState() {
        const $container = $('#news-container').empty();
        const $state = $('<div class="error-state" role="alert"></div>');
        $state.append('<i class="fas fa-exclamation-triangle" aria-hidden="true"></i>');
        $state.append($('<h3></h3>').text('Could not load the news feed'));
        $state.append($('<p></p>').text('Something went wrong reaching our servers. Please try again.'));
        $state.append(
            $('<button type="button" class="btn"></button>')
                .text('Retry')
                .on('click', fetchNews)
        );
        $container.append($state);
    }

    function clearFilters() {
        $('#search-input').val('');
        $('#timeline-dropdown').val('all');
        currentPage = 1;
        displayPaginatedNews();
        $('#search-input').focus();
    }

    function isSafeUrl(url) {
        try {
            const parsed = new URL(url, window.location.origin);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }

    function getSourceLabel(url) {
        if (!isSafeUrl(url)) return '';
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch (e) {
            return '';
        }
    }

    function timelineLabel(value) {
        const labels = {
            'all': '', 'day': 'Last 24 hours', 'week': 'Past week',
            'month': 'Past month', 'quarter': 'Past 3 months', 'year': 'Past year'
        };
        return labels[value] || '';
    }

    function updateResultsStrip(filteredCount, totalCount) {
        $('#results-strip').prop('hidden', false);
        const $meta = $('#results-meta').empty();
        const searchText = $('#search-input').val();
        const timelineVal = $('#timeline-dropdown').val();

        const $count = $('<span></span>');
        if (filteredCount === totalCount) {
            $count
                .append(document.createTextNode('Showing '))
                .append($('<strong></strong>').text(totalCount))
                .append(document.createTextNode(' ' + (totalCount === 1 ? 'article' : 'articles')));
        } else {
            $count
                .append(document.createTextNode('Showing '))
                .append($('<strong></strong>').text(filteredCount))
                .append(document.createTextNode(' of '))
                .append($('<strong></strong>').text(totalCount))
                .append(document.createTextNode(' articles'));
        }
        $meta.append($count);

        const tlLabel = timelineLabel(timelineVal);
        if (tlLabel) {
            $meta.append($('<span class="filter-pill"></span>')
                .append('<i class="fas fa-clock" aria-hidden="true"></i>')
                .append(document.createTextNode(tlLabel)));
        }
        if (searchText) {
            $meta.append($('<span class="filter-pill"></span>')
                .append('<i class="fas fa-search" aria-hidden="true"></i>')
                .append($('<span></span>').text('"' + searchText + '"')));
        }
        if (lastFetchedAt) {
            $meta.append($('<span></span>').text('· Updated ' + getRelativeTime(lastFetchedAt)));
        }
    }

    function filterByTimeline(data) {
        const timeline = $('#timeline-dropdown').val();
        if (timeline === 'all') return data;

        const now = new Date();
        let cutoffDate;

        switch (timeline) {
            case 'day':
                cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                return data;
        }

        return data.filter(news => new Date(news.date) >= cutoffDate);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
        if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        if (diffDays < 7) return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
        if (diffMonths < 1) return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
        if (diffMonths < 12) return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
        return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }

    function displayPaginatedNews() {
        const searchText = $('#search-input').val();
        let filteredData = filterByTimeline(sortedData);
        if (searchText) {
            const q = searchText.toLowerCase();
            filteredData = filteredData.filter(news =>
                (news.title || '').toLowerCase().includes(q) ||
                (news.summary || '').toLowerCase().includes(q)
            );
        }
        const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

        updateResultsStrip(filteredData.length, sortedData.length);
        updatePagination(totalPages);

        const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        displayNews(paginatedData);
    }

    function renderEmptyState() {
        const $container = $('#news-container').empty();
        const hasFilters = $('#search-input').val() || $('#timeline-dropdown').val() !== 'all';
        const $state = $('<div class="empty-state"></div>');
        $state.append('<i class="fas fa-search" aria-hidden="true"></i>');
        $state.append($('<h3></h3>').text(hasFilters ? 'No matching articles' : 'No articles available'));
        $state.append($('<p></p>').text(
            hasFilters
                ? 'Try a different search term or expand the time range.'
                : 'Check back shortly for the latest data breach updates.'
        ));
        if (hasFilters) {
            $state.append(
                $('<button type="button" class="btn"></button>')
                    .text('Clear filters')
                    .on('click', clearFilters)
            );
        }
        $container.append($state);
    }

    function displayNews(newsItems) {
        const $container = $('#news-container').empty();
        if (newsItems.length === 0) {
            renderEmptyState();
            return;
        }
        newsItems.forEach(news => {
            const formattedDate = formatDate(news.date);
            const relativeTime = getRelativeTime(news.date);
            const title = String(news.title || '');
            const summary = String(news.summary || '');
            const safeUrl = isSafeUrl(news.url) ? news.url : '#';
            const source = getSourceLabel(news.url);

            const $article = $('<article class="news-item"></article>');

            const $date = $('<div class="news-date"></div>')
                .text(formattedDate + ' ')
                .append($('<span class="relative-time"></span>').text('· ' + relativeTime));

            const $titleLink = $('<a></a>')
                .attr({
                    href: safeUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    'aria-label': 'Read full article: ' + title + (source ? ' (source: ' + source + ')' : '')
                })
                .text(title);

            const $heading = $('<h3></h3>').append($titleLink);
            if (source) {
                $heading.append(
                    $('<span class="news-source"></span>')
                        .append('<i class="fas fa-globe" aria-hidden="true"></i>')
                        .append($('<span></span>').text(source))
                );
            }

            const $summary = $('<p class="news-summary"></p>').text(summary);

            const $cta = $('<span class="news-cta" aria-hidden="true"></span>')
                .text('Read Full Article ')
                .append('<i class="fas fa-external-link-alt"></i>');

            $article.append($date, $heading, $summary, $cta);
            $container.append($article);
        });
    }

    let searchTimeout;
    $('#search-input').on('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            displayPaginatedNews();
        }, 300);
    });

    $('#timeline-dropdown').on('change', function () {
        currentPage = 1;
        displayPaginatedNews();
    });

    $('#prev-page').click(function () {
        if (currentPage > 1) {
            currentPage--;
            displayPaginatedNews();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    $('#next-page').click(function () {
        currentPage++;
        displayPaginatedNews();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('#refresh-btn').click(function () {
        fetchNews();
    });

    fetchNews();
});

document.addEventListener('DOMContentLoaded', function () {
    var footerGroups = document.querySelectorAll('.footer-group h6');
    footerGroups.forEach(function (header) {
        header.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                this.parentElement.classList.toggle('active');
            }
        });
    });
});
