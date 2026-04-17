/* ============================================
   NavSense AI — Interactive Stadium Map
   ============================================ */

NavSense.StadiumMap = (() => {
    const store = NavSense.DataStore;

    function render(container, options = {}) {
        const stadium = store.getStadium();
        const state = store.getState();
        const fullscreen = options.fullscreen || false;
        const showHeatmap = options.showHeatmap !== false;
        const showAmenities = options.showAmenities !== false;
        const showUser = options.showUser !== false;
        const showRoute = options.route || null;
        const onZoneClick = options.onZoneClick || null;
        const onAmenityClick = options.onAmenityClick || null;

        const wrapper = document.createElement('div');
        wrapper.className = `stadium-map-wrapper ${fullscreen ? 'fullscreen' : ''}`;
        wrapper.id = options.id || 'stadium-map';

        // SVG Layer
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('class', 'stadium-svg');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Defs
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <radialGradient id="field-gradient">
                <stop offset="0%" style="stop-color:#15803d;stop-opacity:0.8"/>
                <stop offset="100%" style="stop-color:#166534;stop-opacity:0.9"/>
            </radialGradient>
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#00d4ff"/>
                <stop offset="100%" style="stop-color:#7c3aed"/>
            </linearGradient>
        `;
        svg.appendChild(defs);

        // Stadium outline (oval)
        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        outline.setAttribute('cx', '50');
        outline.setAttribute('cy', '50');
        outline.setAttribute('rx', '48');
        outline.setAttribute('ry', '46');
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', 'var(--border-secondary)');
        outline.setAttribute('stroke-width', '0.5');
        svg.appendChild(outline);

        // Zones
        stadium.zones.forEach(zone => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'zone');
            g.setAttribute('data-zone', zone.id);

            let shape;
            if (zone.type === 'field') {
                // Oval field
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                shape.setAttribute('cx', zone.x);
                shape.setAttribute('cy', zone.y);
                shape.setAttribute('rx', zone.w / 2);
                shape.setAttribute('ry', zone.h / 2);
                shape.setAttribute('fill', 'url(#field-gradient)');
                shape.setAttribute('stroke', '#15803d');
                shape.setAttribute('stroke-width', '0.5');

                // Pitch markings
                const pitch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                pitch.setAttribute('x', zone.x - 1.5);
                pitch.setAttribute('y', zone.y - 8);
                pitch.setAttribute('width', '3');
                pitch.setAttribute('height', '16');
                pitch.setAttribute('fill', '#d4a574');
                pitch.setAttribute('rx', '0.5');
                pitch.setAttribute('opacity', '0.6');
                g.appendChild(pitch);
            } else {
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('x', zone.x - zone.w / 2);
                shape.setAttribute('y', zone.y - zone.h / 2);
                shape.setAttribute('width', zone.w);
                shape.setAttribute('height', zone.h);
                shape.setAttribute('rx', zone.type === 'concourse' ? '1' : '2');

                const density = state.crowdDensity[zone.id] || 0;
                const color = getDensityFillColor(density, zone.type);
                shape.setAttribute('fill', color);
                shape.setAttribute('stroke', 'var(--border-secondary)');
                shape.setAttribute('stroke-width', '0.3');
                shape.setAttribute('data-density', density);
            }

            g.appendChild(shape);

            // Label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', zone.type === 'field' ? 'zone-label' : 'zone-label-small');
            label.setAttribute('x', zone.x);
            label.setAttribute('y', zone.y);
            label.textContent = zone.type === 'field' ? '⬥' : zone.name.replace(' Stand', '').replace(' Pavilion', '').replace(' Concourse', ' Con.');

            g.appendChild(label);

            if (zone.type !== 'field' && onZoneClick) {
                g.style.cursor = 'pointer';
                g.addEventListener('click', () => onZoneClick(zone));
            }

            svg.appendChild(g);
        });

        // Gates
        stadium.gates.forEach(gate => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'amenity-marker');

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', gate.x);
            circle.setAttribute('cy', gate.y);
            circle.setAttribute('r', '2.5');
            circle.setAttribute('fill', 'var(--color-info)');
            circle.setAttribute('stroke', 'var(--bg-primary)');
            circle.setAttribute('stroke-width', '0.5');
            g.appendChild(circle);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', gate.x);
            text.setAttribute('y', gate.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.setAttribute('font-size', '2.5');
            text.setAttribute('font-weight', '700');
            text.setAttribute('fill', '#fff');
            text.textContent = 'G';
            g.appendChild(text);

            svg.appendChild(g);
        });

        // Amenities
        if (showAmenities) {
            stadium.amenities.forEach(amenity => {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('class', 'amenity-marker');

                const colorMap = {
                    food: '#f59e0b',
                    restroom: '#3b82f6',
                    merchandise: '#8b5cf6',
                    medical: '#ef4444',
                    info: '#10b981'
                };

                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', amenity.x);
                circle.setAttribute('cy', amenity.y);
                circle.setAttribute('r', '2');
                circle.setAttribute('fill', colorMap[amenity.type] || '#6b7280');
                circle.setAttribute('stroke', 'var(--bg-primary)');
                circle.setAttribute('stroke-width', '0.4');
                g.appendChild(circle);

                const iconMap = { food: '🍕', restroom: '🚻', merchandise: '🛍', medical: '🏥', info: 'ℹ' };
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', amenity.x);
                text.setAttribute('y', amenity.y);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'central');
                text.setAttribute('font-size', '2');
                text.textContent = iconMap[amenity.type] || '•';
                g.appendChild(text);

                if (onAmenityClick) {
                    g.style.cursor = 'pointer';
                    g.addEventListener('click', (e) => {
                        e.stopPropagation();
                        onAmenityClick(amenity);
                    });
                }

                svg.appendChild(g);
            });
        }

        // User position
        if (showUser) {
            const user = NavSense.UserContext.getUser();
            const userG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            userG.setAttribute('class', 'user-marker');
            userG.id = 'user-marker';

            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ring.setAttribute('class', 'user-marker-ring');
            ring.setAttribute('cx', user.position.x);
            ring.setAttribute('cy', user.position.y);
            ring.setAttribute('r', '4');
            userG.appendChild(ring);

            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('class', 'user-marker-dot');
            dot.setAttribute('cx', user.position.x);
            dot.setAttribute('cy', user.position.y);
            dot.setAttribute('r', '2');
            userG.appendChild(dot);

            const youLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            youLabel.setAttribute('x', user.position.x);
            youLabel.setAttribute('y', user.position.y - 5.5);
            youLabel.setAttribute('text-anchor', 'middle');
            youLabel.setAttribute('font-size', '2.5');
            youLabel.setAttribute('font-weight', '700');
            youLabel.setAttribute('fill', 'var(--brand-primary)');
            youLabel.textContent = 'YOU';
            userG.appendChild(youLabel);

            svg.appendChild(userG);
        }

        // Route
        if (showRoute) {
            const user = NavSense.UserContext.getUser();
            const routePath = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            routePath.setAttribute('class', 'route-line');
            routePath.setAttribute('x1', user.position.x);
            routePath.setAttribute('y1', user.position.y);
            routePath.setAttribute('x2', showRoute.x);
            routePath.setAttribute('y2', showRoute.y);
            routePath.setAttribute('stroke', 'url(#route-gradient)');
            svg.appendChild(routePath);

            // Destination marker
            const destCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            destCircle.setAttribute('cx', showRoute.x);
            destCircle.setAttribute('cy', showRoute.y);
            destCircle.setAttribute('r', '3');
            destCircle.setAttribute('fill', 'var(--brand-secondary)');
            destCircle.setAttribute('stroke', '#fff');
            destCircle.setAttribute('stroke-width', '0.5');
            destCircle.setAttribute('class', 'route-end');
            svg.appendChild(destCircle);
        }

        wrapper.appendChild(svg);

        // Legend
        if (showHeatmap) {
            const legend = document.createElement('div');
            legend.className = 'map-legend';
            legend.innerHTML = `
                <span>Crowd</span>
                <div>
                    <div class="legend-gradient"></div>
                    <div class="legend-labels"><span>Low</span><span>High</span></div>
                </div>
            `;
            wrapper.appendChild(legend);
        }

        container.innerHTML = '';
        container.appendChild(wrapper);
        return wrapper;
    }

    function getDensityFillColor(density, zoneType) {
        const alpha = zoneType === 'vip' ? 0.8 : 0.65;
        if (density < 20) return `rgba(16, 185, 129, ${alpha})`;
        if (density < 35) return `rgba(52, 211, 153, ${alpha})`;
        if (density < 50) return `rgba(251, 191, 36, ${alpha})`;
        if (density < 65) return `rgba(245, 158, 11, ${alpha})`;
        if (density < 75) return `rgba(249, 115, 22, ${alpha})`;
        if (density < 85) return `rgba(239, 68, 68, ${alpha})`;
        return `rgba(185, 28, 28, ${alpha})`;
    }

    // Update densities in existing map
    function updateDensities(mapId) {
        const state = store.getState();
        const stadium = store.getStadium();
        const svg = document.querySelector(`#${mapId || 'stadium-map'} .stadium-svg`);
        if (!svg) return;

        stadium.zones.forEach(zone => {
            if (zone.type === 'field') return;
            const g = svg.querySelector(`[data-zone="${zone.id}"]`);
            if (!g) return;
            const shape = g.querySelector('rect');
            if (!shape) return;

            const density = state.crowdDensity[zone.id] || 0;
            shape.setAttribute('fill', getDensityFillColor(density, zone.type));
            shape.setAttribute('data-density', density);
        });
    }

    return { render, updateDensities, getDensityFillColor };
})();
