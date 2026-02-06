/* Contentful Content Model Explorer - Interactivity */

document.addEventListener('DOMContentLoaded', () => {
    initSearch('ships');
    initSearch('excursions');
    initSearch('ports');
    initSearch('voyage-products');
    initShipTabs();
    initExpandRows();
});

/* Generic search/filter for data tables */
function initSearch(sectionId) {
    const input = document.getElementById(`search-${sectionId}`);
    const filterEl = document.getElementById(`filter-${sectionId}`);
    const table = document.getElementById(`table-${sectionId}`);
    const countEl = document.getElementById(`count-${sectionId}`);

    if (!input || !table) return;

    function applyFilter() {
        const query = input.value.toLowerCase().trim();
        const filterVal = filterEl ? filterEl.value : '';
        const rows = table.querySelectorAll('tbody tr:not(.expand-row)');
        let visible = 0;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const filterField = row.dataset.filter || '';
            const matchesSearch = !query || text.includes(query);
            const matchesFilter = !filterVal || filterField === filterVal;
            const show = matchesSearch && matchesFilter;
            row.style.display = show ? '' : 'none';

            // Also hide any expand rows
            const expandRow = row.nextElementSibling;
            if (expandRow && expandRow.classList.contains('expand-row')) {
                expandRow.style.display = 'none';
                expandRow.classList.remove('active');
            }

            if (show) visible++;
        });

        if (countEl) {
            const total = rows.length;
            countEl.textContent = query || filterVal
                ? `Showing ${visible} of ${total}`
                : `${total} total`;
        }
    }

    input.addEventListener('input', applyFilter);
    if (filterEl) filterEl.addEventListener('change', applyFilter);
}

/* Ship tabs for cabin section */
function initShipTabs() {
    const tabs = document.querySelectorAll('.ship-tab');
    const groups = document.querySelectorAll('.cabin-ship-group');

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const ship = tab.dataset.ship;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            groups.forEach(g => {
                if (ship === 'all') {
                    g.style.display = '';
                } else {
                    g.style.display = g.dataset.ship === ship ? '' : 'none';
                }
            });
        });
    });
}

/* Expandable detail rows */
function initExpandRows() {
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const expandRow = document.getElementById(targetId);
            if (!expandRow) return;

            const isActive = expandRow.classList.contains('active');
            expandRow.classList.toggle('active');
            expandRow.style.display = isActive ? 'none' : 'table-row';
            btn.textContent = isActive ? 'Details' : 'Hide';
        });
    });
}

/* Smooth scroll for nav links */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});
