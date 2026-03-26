/**
 * HandLayout - Slay the Spire Style Card Hand Positioning
 * 
 * Uses ABSOLUTE POSITIONING with manual transforms.
 * Cards fan from bottom center pivot point.
 * 
 * Key Design:
 * - Normalized position: -1 (left) to +1 (right)
 * - Parabolic arc: y = -curveHeight * t²
 * - Rotation: angle based on position
 * - Dynamic spread based on card count
 */

export class HandLayout {
    constructor(options = {}) {
        // Layout configuration
        this.maxSpread = options.maxSpread || 700;     // Max hand width
        this.curveHeight = options.curveHeight || 80;  // Arc height
        this.maxRotation = options.maxRotation || 15;  // Degrees at edges
        this.cardWidth = options.cardWidth || 120;     // Card width
        this.cardHeight = options.cardHeight || 180;   // Card height
        
        // Animation configuration
        this.hoverScale = options.hoverScale || 1.2;   // Hover scale
        this.hoverLift = options.hoverLift || 40;      // Hover lift
    }
    
    /**
     * Calculates card positions using STS-style layout
     * @param {Array} cards - Array of card elements
     * @param {number} containerWidth - Width of hand container
     * @returns {Array} Array of transform objects
     */
    calculateCardPositions(cards, containerWidth) {
        const n = cards.length;
        if (n === 0) return [];
        
        // Single card - centered
        if (n === 1) {
            return [{
                x: 0,
                y: 0,
                rotation: 0,
                zIndex: 100,
                scale: 1,
                index: 0
            }];
        }
        
        // Dynamic spread - wider with more cards, capped
        const maxSpread = Math.min(this.cardWidth * n * 0.7, this.maxSpread);
        const center = (n - 1) / 2;
        
        const transforms = [];
        
        for (let i = 0; i < n; i++) {
            // Normalized position: -1 (left) to +1 (right)
            const t = n > 1 ? (i - center) / center : 0;
            
            // Horizontal position
            const x = t * maxSpread * 0.5;
            
            // Vertical offset (parabolic arc: y = -a * t²)
            // Center card highest, edges lower
            const y = -this.curveHeight * (t * t);
            
            // Rotation (tilts outward from center)
            const rotation = t * this.maxRotation;
            
            // Z-index (center cards on top)
            const zIndex = Math.floor(100 - Math.abs(t) * 80);
            
            transforms.push({
                x,
                y,
                rotation,
                zIndex,
                scale: 1,
                index: i,
                normalizedT: t
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
            rotation: 0,
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
