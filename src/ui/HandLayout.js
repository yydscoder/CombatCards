/**
 * HandLayout - Arc Fan Card Hand Positioning
 *
 * Based on Slay the Spire hand mechanic.
 * Uses trigonometry for fan arc positioning.
 *
 * Key Features:
 * - Cards fan out in arc using sin/cos
 * - Hovered card lifts and scales
 * - Neighbor cards push away from center
 * - Responsive positioning based on container width
 */

export class HandLayout {
    constructor(options = {}) {
        // Arc configuration
        this.arcRadius = options.arcRadius || 300;      // How curved the fan is
        this.arcAngle = options.arcAngle || 40;         // Total spread in degrees
        this.hoverLift = options.hoverLift || 50;       // Pixels to move up on hover
        this.hoverScale = options.hoverScale || 1.2;    // Scale multiplier
        this.neighborPush = options.neighborPush || 30; // Pixels to push neighbors
        this.cardWidth = options.cardWidth || 100;
        this.cardHeight = options.cardHeight || 140;
    }

    /**
     * Calculates card positions along fan arc
     * @param {number} cardCount - Number of cards in hand
     * @param {number} containerWidth - Width of hand container
     * @param {number} hoveredIndex - Index of hovered card (-1 if none)
     * @returns {Array} Array of transform objects
     */
    calculateCardPositions(cardCount, containerWidth, hoveredIndex = -1) {
        if (cardCount === 0) return [];

        // Calculate center based on container width (responsive)
        // Offset to 35% instead of 50% to shift hand left toward energy orb
        // This centers the hand between energy orb (left) and end turn button (right)
        const centerX = containerWidth * 0.35;
        
        // Position the arc pivot point BELOW the container
        // Cards fan UP from this pivot, creating an arc at the bottom
        // Container is ~400px tall, we want cards at bottom (y=300-400px)
        // Card center anchor at ~370px, so centerY - arcRadius = 370
        // With arcRadius=350: centerY = 370 + 350 = 720
        const containerHeight = 400;  // Match CSS #hand height
        const centerY = 720;  // Pivot below container for proper card height
        const arcRadius = 350;  // Distance from pivot to card bottoms

        // Calculate total angle spread in radians
        // Dynamic spread: 5° per card, max 60° total
        const minAnglePerCard = 5;
        const maxSpread = 60;
        const dynamicSpread = Math.min(cardCount * minAnglePerCard, maxSpread);
        const totalRad = (dynamicSpread * Math.PI) / 180;
        const startAngle = -totalRad / 2;
        const angleStep = cardCount > 1 ? totalRad / (cardCount - 1) : 0;

        const transforms = [];

        // Log container bounds for debugging
        console.log(`[HandLayout] Container: ${containerWidth}px wide x ${containerHeight}px tall`);
        console.log(`[HandLayout] Arc pivot: centerX=${centerX.toFixed(1)}, centerY=${centerY} (below container)`);
        console.log(`[HandLayout] Arc radius: ${arcRadius}px, angle spread: ${dynamicSpread}° (dynamic for ${cardCount} cards)`);

        for (let index = 0; index < cardCount; index++) {
            // Calculate angle for this card
            const angle = startAngle + (angleStep * index);

            // Basic arc position (sin/cos)
            // With pivot below container, cards fan UP from bottom
            const x = centerX + (arcRadius * Math.sin(angle));
            const y = centerY - (arcRadius * Math.cos(angle));

            // Rotation (align with angle, convert to degrees)
            const rotation = (angle * 180) / Math.PI;

            // Hover logic
            let offsetX = 0;
            let offsetY = 0;
            let scale = 1;

            if (index === hoveredIndex) {
                // Hovered card: lift up and scale
                offsetY = -this.hoverLift;
                scale = this.hoverScale;
            } else if (hoveredIndex !== -1) {
                // Neighbor cards: push away from center
                if (index < hoveredIndex) {
                    offsetX = -this.neighborPush;
                } else if (index > hoveredIndex) {
                    offsetX = this.neighborPush;
                }
            }

            // Z-index: hovered card on top, then by position
            let zIndex = 50 + index;
            if (index === hoveredIndex) {
                zIndex = 999;
            }

            // Calculate final card position (anchor from BOTTOM center of card)
            // Cards fan upward from the arc, with bottoms on the curve
            const finalX = x - (this.cardWidth / 2) + offsetX;
            const finalY = y - this.cardHeight + offsetY;  // Anchor from bottom, not center

            transforms.push({
                x: x - (this.cardWidth / 2),  // Center X anchor
                y: y - this.cardHeight,  // Bottom Y anchor (card extends upward)
                rotation,
                zIndex,
                scale,
                offsetX,
                offsetY,
                index,
                // Debug info
                rawX: x,
                rawY: y,
                finalX,
                finalY
            });

            // Log first card and center card positions
            if (index === 0 || index === Math.floor(cardCount / 2)) {
                console.log(`[HandLayout] Card ${index}: pos(${finalX.toFixed(0)}, ${finalY.toFixed(0)}), rotation=${rotation.toFixed(1)}°, scale=${scale}`);
            }
        }

        // Log last card position
        if (cardCount > 1) {
            const lastIdx = cardCount - 1;
            const last = transforms[lastIdx];
            console.log(`[HandLayout] Card ${lastIdx}: pos(${last.finalX.toFixed(0)}, ${last.finalY.toFixed(0)})`);
        }

        // Log container boundaries and arc coverage
        console.log(`[HandLayout] Container bounds: left=0, right=${containerWidth}, top=0, bottom=${containerHeight}`);
        console.log(`[HandLayout] Arc coverage: from y=${centerY - arcRadius}px to y=${centerY}px`);
        console.log(`[HandLayout] Card bottoms at y=${centerY - arcRadius}px (${containerHeight - (centerY - arcRadius)}px from bottom), tops at y=${centerY - arcRadius - this.cardHeight}px`);

        return transforms;
    }

    /**
     * Applies transform to card element
     * @param {HTMLElement} cardEl - Card DOM element
     * @param {Object} transform - Transform object
     */
    applyTransform(cardEl, transform) {
        if (!cardEl) return;

        const finalX = transform.x + transform.offsetX;
        const finalY = transform.y + transform.offsetY;

        cardEl.style.transform = `
            translate(${finalX}px, ${finalY}px)
            rotate(${transform.rotation}deg)
            scale(${transform.scale})
        `;

        cardEl.style.zIndex = transform.zIndex;
    }
}

export default HandLayout;
