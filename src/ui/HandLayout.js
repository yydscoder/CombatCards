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
        
        const centerX = containerWidth / 2;
        const centerY = 0; // Bottom of container (cards positioned from bottom)
        
        // Calculate total angle spread in radians
        const totalRad = (this.arcAngle * Math.PI) / 180;
        const startAngle = -totalRad / 2;
        const angleStep = cardCount > 1 ? totalRad / (cardCount - 1) : 0;
        
        const transforms = [];
        
        for (let index = 0; index < cardCount; index++) {
            // Calculate angle for this card
            const angle = startAngle + (angleStep * index);
            
            // Basic arc position (sin/cos)
            const x = centerX + (this.arcRadius * Math.sin(angle));
            const y = centerY - (this.arcRadius * Math.cos(angle)) + this.cardHeight;
            
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
            
            transforms.push({
                x: x - (this.cardWidth / 2),  // Center anchor
                y: y - this.cardHeight,        // Position from bottom
                rotation,
                zIndex,
                scale,
                offsetX,
                offsetY,
                index
            });
        }
        
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
