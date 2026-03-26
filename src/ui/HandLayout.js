/**
 * HandLayout - Arc Fan Style Card Hand Positioning
 * 
 * Cards fan out along a circular arc, like holding cards in your hand.
 * Each card is positioned along the arc circumference and rotates to follow it.
 * 
 * Key Design:
 * - Cards positioned along arc path
 * - Center card at top of arc
 * - Edge cards at bottom corners
 * - Rotation follows arc tangent
 */

export class HandLayout {
    constructor(options = {}) {
        // Arc configuration
        this.arcRadius = options.arcRadius || 350;      // Distance from pivot point
        this.arcSpan = options.arcSpan || 100;          // Total arc angle in degrees
        this.cardWidth = options.cardWidth || 120;      // Card width
        this.cardHeight = options.cardHeight || 180;    // Card height
        
        // Animation configuration
        this.hoverScale = options.hoverScale || 1.15;   // Hover scale
        this.hoverLift = options.hoverLift || 50;       // Hover lift
    }
    
    /**
     * Calculates card positions along circular arc
     * @param {Array} cards - Array of card elements
     * @param {number} containerWidth - Width of hand container
     * @returns {Array} Array of transform objects
     */
    calculateCardPositions(cards, containerWidth) {
        const n = cards.length;
        if (n === 0) return [];
        
        // Single card - centered, upright
        if (n === 1) {
            return [{
                x: 0,
                y: -this.arcRadius + 100,  // Positioned at arc height
                rotation: 0,
                zIndex: 100,
                scale: 1,
                index: 0
            }];
        }
        
        const transforms = [];
        const centerIndex = (n - 1) / 2;
        const centerAngle = 90;  // 90° = straight up (12 o'clock)
        const halfSpan = this.arcSpan / 2;
        
        for (let i = 0; i < n; i++) {
            // Normalized position: -1 (left edge) to +1 (right edge)
            const t = n > 1 ? (i - centerIndex) / centerIndex : 0;
            
            // Angle for this card along the arc
            // Left cards: 90° + halfSpan, Right cards: 90° - halfSpan
            const angle = centerAngle + (t * halfSpan);
            const angleRad = (angle * Math.PI) / 180;
            
            // Position on arc circumference
            // cos gives x (horizontal), sin gives y (vertical)
            const x = Math.cos(angleRad) * this.arcRadius;
            const y = -Math.sin(angleRad) * this.arcRadius;
            
            // Rotation: perpendicular to radius (follows arc tangent)
            // At 90° (center), rotation = 0° (upright)
            // At edges, rotation matches arc angle
            const rotation = -(angle - 90);
            
            // Z-index: center cards on top
            const zIndex = Math.floor(100 - Math.abs(t) * 60);
            
            transforms.push({
                x,
                y,
                rotation,
                zIndex,
                scale: 1,
                index: i,
                normalizedT: t,
                angle: angle
            });
        }
        
        return transforms;
    }
    
    /**
     * Applies hover override to transform
     * @param {Object} baseTransform - Base transform
     * @param {boolean} isHovered - Is card hovered
     * @returns {Object} Modified transform
     */
    applyHover(baseTransform, isHovered) {
        if (!isHovered) {
            return { ...baseTransform, scale: 1 };
        }
        
        // Hover: lift up, straighten, scale up, top z-index
        return {
            ...baseTransform,
            scale: this.hoverScale,
            y: baseTransform.y - this.hoverLift,
            rotation: 0,  // Straighten on hover
            zIndex: 999
        };
    }
    
    /**
     * Applies transform to card element
     * @param {HTMLElement} cardEl - Card DOM element
     * @param {Object} transform - Transform object
     */
    applyTransform(cardEl, transform) {
        if (!cardEl) return;
        
        cardEl.style.transform = `
            translateX(${transform.x}px)
            translateY(${transform.y}px)
            rotate(${transform.rotation}deg)
            scale(${transform.scale})
        `;
        
        cardEl.style.zIndex = transform.zIndex;
    }
}

export default HandLayout;
