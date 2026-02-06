/* Contentful Content Model Explorer - Interactivity */

document.addEventListener('DOMContentLoaded', () => {
    initSearch('ships');
    initSearch('excursions');
    initSearch('ports');
    initSearch('voyage-products');
    initShipTabs();
    initExpandRows();
    initBookingLookup();
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
    const tabs = document.querySelectorAll('.ship-tab:not(.booking-pick)');
    const groups = document.querySelectorAll('.cabin-ship-group');

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const ship = tab.dataset.ship;
            if (!ship) return;

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

/* Booking ID Lookup */
function initBookingLookup() {
    const btn = document.getElementById('lookup-btn');
    const input = document.getElementById('lookup-booking-id');
    const randomBtn = document.getElementById('lookup-random');
    const resultsEl = document.getElementById('lookup-results');
    if (!btn || !resultsEl || !input) return;

    const data = window.LOOKUP_DATA;
    if (!data || !data.bookings) return;

    // Quick pick buttons
    document.querySelectorAll('.booking-pick').forEach(pickBtn => {
        pickBtn.addEventListener('click', () => {
            input.value = pickBtn.dataset.id;
            doLookup();
        });
    });

    // Random button
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            const rand = data.bookings[Math.floor(Math.random() * data.bookings.length)];
            input.value = rand.booking_id;
            doLookup();
        });
    }

    btn.addEventListener('click', doLookup);

    // Enter key triggers lookup
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') doLookup();
    });

    function doLookup() {
        const bookingId = input.value.trim();
        if (!bookingId) {
            resultsEl.style.display = 'none';
            return;
        }

        // Find the booking
        const booking = data.bookings.find(b => b.booking_id === bookingId);
        if (!booking) {
            resultsEl.innerHTML = renderCard('Booking', 'not-found', 'Not Found',
                `ID: ${bookingId}`,
                [],
                'No booking found with that ID. Try one of the quick pick buttons above, or click Random.');
            resultsEl.style.display = 'grid';
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
        }

        const cards = [];

        // --- Booking overview card ---
        cards.push(renderCard('Booking', 'found', booking.status, booking.sailing_description, [
            ['Booking ID', booking.booking_id, true],
            ['Status', booking.status],
            ['Ship Code', booking.ship_code, true],
            ['Sailing Code', booking.sailing_code, true],
            ['Destination', booking.destination],
            ['Route', `${booking.departure_port} → ${booking.arrival_port}`, true],
            ['Nights', booking.cruise_nights],
            ['Cabin', `${booking.cabin_category} (${booking.cabin_code})`, true],
        ], booking.flight_out_desc
            ? `Outbound: ${booking.flight_out_desc} (${booking.flight_out_from} → ${booking.flight_out_to})`
              + (booking.flight_in_desc ? ` | Inbound: ${booking.flight_in_desc} (${booking.flight_in_from} → ${booking.flight_in_to})` : '')
            : null
        ));

        // --- Ship lookup ---
        const shipCode = booking.ship_code;
        const ship = data.ships.find(s => s.brm_code === shipCode);
        if (ship) {
            const hasContent = ship.has_contentful_content === 'True';
            const shipUrl = ship.slug ? `https://www.hurtigruten.com/en/ships/${ship.slug}` : null;
            cards.push(renderCard('Ship', hasContent ? 'found' : 'warning',
                hasContent ? 'Content Available' : 'No CMS Content',
                ship.ship_name, [
                    ['BRM Code', shipCode, true],
                    ['Contentful ID', ship.contentful_id || '---', true],
                    ['Slug', ship.slug, true],
                    ['Has Content', hasContent ? 'Yes' : 'No'],
                ],
                hasContent
                    ? `Ship page exists in Contentful. Use slug "${ship.slug}" or ID "${ship.contentful_id}" to fetch content.`
                    : 'This ship has no content in Contentful. Travel documents will be missing ship details.',
                shipUrl
            ));
        } else {
            cards.push(renderCard('Ship', 'not-found', 'No Match',
                `Code: ${shipCode}`, [],
                `No ship found in Contentful with code "${shipCode}". Valid codes: ${data.ships.map(s => s.brm_code).join(', ')}`
            ));
        }

        // --- Cabin lookup ---
        const cabinCategory = booking.cabin_category;
        if (cabinCategory && ship) {
            // Booking cabin_category (e.g. "K3") matches Contentful cabin_code, not cabin_category
            // Contentful cabin_category is a name like "Polar Inside"
            // Ship alias: MS Maud (MS) uses same cabins as MS Midnatsol (WW) - same ship, renamed
            const SHIP_CABIN_ALIAS = { 'MS': 'WW' };
            const cabinShipCode = SHIP_CABIN_ALIAS[shipCode] || shipCode;
            const matchingCabins = data.cabins.filter(c =>
                c.ship_brm_code === cabinShipCode && c.cabin_code === cabinCategory
            );
            if (matchingCabins.length > 0) {
                const cabin = matchingCabins[0];
                const aliasNote = cabinShipCode !== shipCode
                    ? ` (via ${cabin.ship_name} - same ship, renamed)`
                    : '';
                cards.push(renderCard('Cabin', 'found', 'Content Available',
                    cabin.cabin_name, [
                        ['Booking Code', cabinCategory, true],
                        ['Contentful Code', cabin.cabin_code, true],
                        ['Category', cabin.cabin_category],
                        ['Ship', cabin.ship_name + aliasNote],
                        ['Bed Type', cabin.bed_type],
                        ['Window', cabin.window_type],
                        ['Size', `${cabin.size_from}${cabin.size_to && cabin.size_to !== cabin.size_from ? '-' + cabin.size_to : ''} m\u00B2`],
                        ['Balcony', cabin.has_balcony === 'True' ? 'Yes' : 'No'],
                    ],
                    matchingCabins.length > 1
                        ? `${matchingCabins.length} cabin variants matching code ${cabinCategory} on this ship. Showing first match.`
                        : cabin.cabin_description || null
                ));
            } else {
                cards.push(renderCard('Cabin', 'not-found', 'No Match',
                    `Code ${cabinCategory} on ${ship ? ship.ship_name : shipCode}`, [],
                    `No cabin with code "${cabinCategory}" found on ship "${shipCode}" in Contentful. The booking code may use a different format than the CMS.`
                ));
            }
        } else if (cabinCategory) {
            cards.push(renderCard('Cabin', 'warning', 'Partial',
                `Code: ${cabinCategory}`, [],
                'Ship not found in Contentful, so cabin lookup cannot be completed (cabins are ship-specific).'
            ));
        }

        // --- Port lookups (departure + arrival) ---
        const portCodes = [];
        if (booking.departure_port) portCodes.push({ code: booking.departure_port, label: 'Departure Port' });
        if (booking.arrival_port && booking.arrival_port !== booking.departure_port) {
            portCodes.push({ code: booking.arrival_port, label: 'Arrival Port' });
        }

        for (const { code, label } of portCodes) {
            // First try matching by port_code field, then fall back to name heuristic
            let portMatch = data.ports.find(p => p.port_code === code);
            if (!portMatch) {
                portMatch = data.ports.find(p =>
                    p.port_name.toLowerCase().includes(codeToPortName(code).toLowerCase())
                );
            }
            if (portMatch) {
                const portUrl = portMatch.slug ? `https://www.hurtigruten.com/en/ports/${portMatch.slug}` : null;
                const matchType = portMatch.port_code === code ? 'Exact Match' : 'Likely Match';
                cards.push(renderCard(label, 'found', matchType,
                    portMatch.port_name, [
                        ['Booking Code', code, true],
                        ['Port Code', portMatch.port_code || '---', true],
                        ['Port Name', portMatch.port_name],
                        ['Slug', portMatch.slug || '---', true],
                        ['Contentful ID', portMatch.contentful_id, true],
                    ],
                    portMatch.port_code === code
                        ? `Port code "${code}" matched directly to Contentful port "${portMatch.port_name}".`
                        : 'Matched by name heuristic. Verify this is the correct port.',
                    portUrl
                ));
            } else {
                cards.push(renderCard(label, 'warning', 'No Direct Match',
                    `Code: ${code}`, [
                        ['Booking Code', code, true],
                    ],
                    `No Contentful port found for code "${code}". A mapping may be needed.`
                ));
            }
        }

        // --- Voyage product lookup ---
        const sailingCode = booking.sailing_code;
        if (sailingCode) {
            // Sailing codes like "NK260920" differ from voyage product codes
            // Try partial match on the ship prefix
            const shipPrefix = sailingCode.substring(0, 2);
            const matchingVoyages = data.voyage_products.filter(v =>
                v.product_code && v.product_code.startsWith(shipPrefix)
            );
            if (matchingVoyages.length > 0) {
                // Check for exact match first
                const exact = data.voyage_products.find(v => v.product_code === sailingCode);
                if (exact) {
                    cards.push(renderCard('Voyage', 'found', 'Exact Match',
                        exact.title || exact.product_code, [
                            ['Sailing Code', sailingCode, true],
                            ['Product Code', exact.product_code, true],
                            ['Category', exact.category],
                            ['Contentful ID', exact.contentful_id, true],
                        ], null
                    ));
                } else {
                    cards.push(renderCard('Voyage', 'warning', 'No Exact Match',
                        `Sailing: ${sailingCode}`, [
                            ['Sailing Code', sailingCode, true],
                            ['Ship Prefix', shipPrefix, true],
                            ['Similar Voyages', `${matchingVoyages.length} products for ship ${shipPrefix}`],
                        ],
                        `Sailing code "${sailingCode}" does not directly match any Contentful voyage product code. Voyage codes in Contentful use a different format. ${matchingVoyages.length} products exist for ship prefix "${shipPrefix}" but the code structures differ.`
                    ));
                }
            } else {
                cards.push(renderCard('Voyage', 'not-found', 'No Match',
                    `Sailing: ${sailingCode}`, [
                        ['Sailing Code', sailingCode, true],
                    ],
                    'No voyage products found matching this sailing code. This is a known integration gap - sailing codes in booking data use a different format than Contentful voyage product codes.'
                ));
            }
        }

        resultsEl.innerHTML = cards.join('');
        resultsEl.style.display = 'grid';
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/* Map common 3-letter port codes to port names for heuristic matching */
function codeToPortName(code) {
    const map = {
        'BGO': 'Bergen',
        'TOS': 'Troms',
        'HAM': 'Hamburg',
        'HFT': 'Hammerfest',
        'SVJ': 'Svolvær',
        'AES': 'Ålesund',
        'TRD': 'Trondheim',
        'BOO': 'Bodø',
        'KKN': 'Kirkenes',
        'LYR': 'Longyearbyen',
        'OSL': 'Oslo',
        'DOV': 'Dover',
        'LIS': 'Lisbon',
        'REK': 'Reykjavik',
        'CPH': 'Copenhagen',
    };
    return map[code] || code;
}

function renderCard(type, status, statusLabel, title, fields, description, url) {
    const statusClass = status === 'found' ? 'match' : status === 'not-found' ? 'no-match' : 'partial';
    let fieldsHtml = '';
    if (fields.length) {
        fieldsHtml = '<div class="result-fields">';
        for (const [label, value, isMono] of fields) {
            fieldsHtml += `<div><div class="result-field-label">${label}</div><div class="result-field-value${isMono ? ' mono' : ''}">${value}</div></div>`;
        }
        fieldsHtml += '</div>';
    }
    const descHtml = description ? `<div class="result-desc">${description}</div>` : '';
    const linkHtml = url ? `<a href="${url}" target="_blank" class="result-link">View on hurtigruten.com</a>` : '';
    return `<div class="lookup-result-card ${status}">
        <div class="result-header">
            <span class="result-type">${type}</span>
            <span class="result-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="result-title">${title}</div>
        ${fieldsHtml}
        ${descHtml}
        ${linkHtml}
    </div>`;
}

/* Smooth scroll for nav links */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});
