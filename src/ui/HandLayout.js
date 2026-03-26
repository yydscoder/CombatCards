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
        const centerX = containerWidth / 2;
        
        // Position the arc pivot point ABOVE the container
        // Cards fan DOWN from this pivot, creating an arc at the bottom
        // Container is ~400px tall, cards are 140px tall
        // Arc radius 300px + card height 140px = 440px total, cards sit at bottom
        const containerHeight = 400;  // Match CSS #hand height
        const centerY = -50;  // Pivot point above container (negative = above top edge)

        // Calculate total angle spread in radians
        const totalRad = (this.arcAngle * Math.PI) / 180;
        const startAngle = -totalRad / 2;
        const angleStep = cardCount > 1 ? totalRad / (cardCount - 1) : 0;

        const transforms = [];

        // Log container bounds for debugging
        console.log(`[HandLayout] Container: ${containerWidth}px wide x ${containerHeight}px tall`);
        console.log(`[HandLayout] Arc pivot: centerX=${centerX}, centerY=${centerY} (above container)`);
        console.log(`[HandLayout] Arc radius: ${this.arcRadius}px, angle spread: ${this.arcAngle}°`);

        for (let index = 0; index < cardCount; index++) {
            // Calculate angle for this card
            const angle = startAngle + (angleStep * index);

            // Basic arc position (sin/cos)
            // With centerY above container and positive radius, cards fan down and right
            const x = centerX + (this.arcRadius * Math.sin(angle));
            const y = centerY + (this.arcRadius * Math.cos(angle));

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
        console.log(`[HandLayout] Arc coverage: from y=${centerY}px to y=${centerY + this.arcRadius}px`);
        console.log(`[HandLayout] Card bottoms at y=${centerY + this.arcRadius}px, tops at y=${centerY + this.arcRadius - this.cardHeight}px`);

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
