/**
 * HandLayout - Slay the Spire Style Card Hand Positioning
 * 
 * Calculates card positions using normalized positioning, arc curves,
 * and proper layering for a professional card game feel.
 */

export class HandLayout {
    constructor(options = {}) {
        // Layout configuration
        this.maxSpread = options.maxSpread || 150;      // Max horizontal spread
        this.curveHeight = options.curveHeight || 40;   // Arc height (parabola)
        this.maxRotation = options.maxRotation || 12;   // Max rotation in degrees
        this.baseSpread = options.baseSpread || 70;     // Base spread
        this.spreadFactor = options.spreadFactor || 12; // Spread increase per card
        
        // Animation configuration
        this.lerpFactor = options.lerpFactor || 0.15;   // Smooth interpolation
        this.hoverScale = options.hoverScale || 1.2;    // Hover scale
        this.hoverLift = options.hoverLift || 40;       // Hover lift in px
        
        // Alignment configuration
        this.bottomAlign = options.bottomAlign || false; // Align at bottom like fan
        this.cardHeight = options.cardHeight || 180;     // Approximate card height for alignment
    }
    
    /**
     * Calculates card positions for a hand
     * @param {Array} cards - Array of card elements/objects
     * @param {number} containerWidth - Width of the hand container
     * @returns {Array} Array of transform objects
     */
    calculateCardPositions(cards, containerWidth) {
        const n = cards.length;
        if (n === 0) return [];
        if (n === 1) {
            // Single card - centered
            return [{
                x: 0,
                y: 0,
                rotation: 0,
                zIndex: 100,
                scale: 1
            }];
        }
        
        const center = Math.floor(n / 2);
        const transforms = [];
        
        // Dynamic spread based on hand size
        const maxSpread = Math.min(
            this.baseSpread + n * this.spreadFactor,
            this.maxSpread
        );
        
        for (let i = 0; i < n; i++) {
            // Normalized position: -1 (left) to +1 (right)
            // For even number of cards, this gives symmetric positions
            const t = n > 1 ? (i - center) / (n - 1) * 2 : 0;
            
            // Clamp to -1 to +1
            const clampedT = Math.max(-1, Math.min(1, t));
            
            // Horizontal position
            const x = clampedT * maxSpread;
            
            // Vertical offset (parabola arc: y = -a * t²)
            // Center card is highest, edges are lower
            const y = -this.curveHeight * (clampedT * clampedT);
            
            // Rotation (tilts outward from center)
            const rotation = clampedT * this.maxRotation;

            // Z-index (center cards render on top)
            // Uses inverted absolute value so center = highest
            const zIndex = Math.floor(100 - Math.abs(clampedT) * 50);

            // Bottom alignment adjustment (fan hold style)
            let finalY = y;
            if (this.bottomAlign) {
                // Shift cards down so bottom edges align
                // Cards at edges need more adjustment due to rotation
                const rotationOffset = Math.abs(rotation) * 2;
                finalY = y + this.cardHeight * 0.35 + rotationOffset;
            }

            transforms.push({
                x,
                y: finalY,
                rotation,
                zIndex,
                scale: 1,
                index: i
            });
        }

        return transforms;
    }
    
    /**
     * Calculates hover transform override
     * @param {Object} baseTransform - Base transform from calculateCardPositions
     * @param {boolean} isHovered - Whether card is hovered
     * @returns {Object} Modified transform
     */
    applyHover(baseTransform, isHovered) {
        if (!isHovered) {
            return { ...baseTransform, scale: 1 };
        }
        
        // Hover overrides
        return {
            ...baseTransform,
            scale: this.hoverScale,
            y: baseTransform.y - this.hoverLift,  // Lift up
            rotation: 0,  // Straighten
            zIndex: 999   // Always on top when hovered
        };
    }
    
    /**
     * Linear interpolation between two values
     * @param {number} current - Current value
     * @param {number} target - Target value
     * @param {number} factor - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    lerp(current, target, factor = this.lerpFactor) {
        return current + (target - current) * factor;
    }
    
    /**
     * Interpolates a transform toward a target
     * @param {Object} current - Current transform state
     * @param {Object} target - Target transform
     * @returns {Object} Interpolated transform
     */
    interpolateTransform(current, target) {
        return {
            x: this.lerp(current.x, target.x),
            y: this.lerp(current.y, target.y),
            rotation: this.lerp(current.rotation, target.rotation),
            scale: this.lerp(current.scale, target.scale),
            zIndex: target.zIndex  // Z-index doesn't interpolate
        };
    }
    
    /**
     * Applies a transform to a card element
     * @param {HTMLElement} cardEl - Card DOM element
     * @param {Object} transform - Transform object
     */
    applyTransform(cardEl, transform) {
        if (!cardEl) return;
        
        const transformString = `translateX(${transform.x}px) translateY(${transform.y}px) rotate(${transform.rotation}deg) scale(${transform.scale})`;
        cardEl.style.transform = transformString;
        cardEl.style.zIndex = transform.zIndex;
    }
    
    /**
     * Gets the card element under the mouse
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     * @param {Array} cards - Array of card elements with transforms
     * @returns {Object|null} Card under mouse or null
     */
    getCardUnderMouse(mouseX, mouseY, cards) {
        // Sort by zIndex descending (check top cards first)
        const sorted = [...cards].sort((a, b) => b.transform.zIndex - a.transform.zIndex);
        
        for (const card of sorted) {
            const rect = card.element.getBoundingClientRect();
            if (
                mouseX >= rect.left &&
                mouseX <= rect.right &&
                mouseY >= rect.top &&
                mouseY <= rect.bottom
            ) {
                return card;
            }
        }
        
        return null;
    }
}

export default HandLayout;
