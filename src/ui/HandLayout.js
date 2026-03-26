/**
 * HandLayout - Slay the Spire Style Card Hand Positioning
 * 
 * Uses BOTTOM PIVOT system where all cards rotate around a shared
 * virtual point below the screen, creating an authentic "held fan" feel.
 * 
 * Key Design Principles:
 * - 25% overlap (70-80% of each card visible)
 * - Medium arc (80-120px height)
 * - 12-15° rotation at edges
 * - Bottom center pivot (cards emerge from bottom)
 * - Dynamic width (adapts to card count)
 */

export class HandLayout {
    constructor(options = {}) {
        // Core layout configuration
        this.overlapRatio = options.overlapRatio || 0.25;      // 25% overlap, 75% visible
        this.maxRotation = options.maxRotation || 15;          // Degrees at edges
        this.curveHeight = options.curveHeight || 100;         // Arc height in px
        this.pivotOffset = options.pivotOffset || 250;         // Pivot point below screen
        
        // Card dimensions (approximate)
        this.cardWidth = options.cardWidth || 200;
        this.cardHeight = options.cardHeight || 280;
        
        // Hand constraints
        this.maxWidthPercent = options.maxWidthPercent || 0.80; // 80% of screen max
        this.minCards = options.minCards || 3;
        this.maxCards = options.maxCards || 10;
        
        // Animation configuration
        this.lerpFactor = options.lerpFactor || 0.15;          // Smooth interpolation
        this.hoverScale = options.hoverScale || 1.15;          // Hover scale
        this.hoverLift = options.hoverLift || 60;              // Hover lift in px
        
        // Alignment
        this.bottomAnchor = options.bottomAnchor || true;      // Anchor at bottom edge
    }
    
    /**
     * Calculates card positions using BOTTOM PIVOT system
     * All cards rotate around a shared virtual point below screen
     * 
     * @param {Array} cards - Array of card elements/objects
     * @param {number} containerWidth - Width of the hand container
     * @returns {Array} Array of transform objects
     */
    calculateCardPositions(cards, containerWidth) {
        const n = cards.length;
        if (n === 0) return [];
        
        // Single card - centered, no rotation
        if (n === 1) {
            return [{
                x: 0,
                y: -20,  // Slight lift for single card
                rotation: 0,
                zIndex: 100,
                scale: 1,
                index: 0
            }];
        }
        
        // Calculate dynamic spread based on card count
        const visibleWidth = this.cardWidth * (1 - this.overlapRatio);
        const totalWidth = visibleWidth * n;
        const maxAllowedWidth = containerWidth * this.maxWidthPercent;
        
        // Adjust overlap if hand would be too wide
        let adjustedOverlap = this.overlapRatio;
        if (totalWidth > maxAllowedWidth && n > this.maxCards) {
            adjustedOverlap = Math.min(0.35, 1 - (maxAllowedWidth / (this.cardWidth * n)));
        }
        
        // Pivot point (center bottom, below screen)
        const pivotX = 0;  // Relative to center
        const pivotY = this.cardHeight + this.pivotOffset;
        
        // Calculate angle spread
        const totalAngle = this.maxRotation * 2;  // Full spread (-15° to +15° = 30°)
        const angleStep = n > 1 ? totalAngle / (n - 1) : 0;
        const startAngle = -this.maxRotation;  // Start from left edge
        
        const transforms = [];
        const radius = pivotY - this.cardHeight * 0.5;  // Distance from pivot to card center
        
        for (let i = 0; i < n; i++) {
            // Normalized position: 0 (left) to 1 (right)
            const t = n > 1 ? i / (n - 1) : 0.5;
            
            // Angle for this card (-maxRotation to +maxRotation)
            const angle = startAngle + (angleStep * i);
            const angleRad = (angle * Math.PI) / 180;
            
            // Position on arc (rotated around pivot)
            const x = Math.sin(angleRad) * radius;
            const y = -Math.cos(angleRad) * radius + this.pivotOffset;
            
            // Parabolic arc overlay (adds subtle lift to center)
            const arcOffset = -this.curveHeight * Math.sin(t * Math.PI);
            
            // Z-index (center cards on top)
            const distFromCenter = Math.abs(t - 0.5);
            const zIndex = Math.floor(100 - distFromCenter * 80);
            
            transforms.push({
                x,
                y: y + arcOffset,
                rotation: angle,
                zIndex,
                scale: 1,
                index: i,
                normalizedT: t
            });
        }
        
        return transforms;
    }
    
    /**
     * Calculates hover transform override
     * Lifts card up, straightens rotation, brings to front
     * 
     * @param {Object} baseTransform - Base transform from calculateCardPositions
     * @param {boolean} isHovered - Whether card is hovered
     * @returns {Object} Modified transform
     */
    applyHover(baseTransform, isHovered) {
        if (!isHovered) {
            return { ...baseTransform, scale: 1 };
        }
        
        // Hover overrides - card lifts out of hand
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
     * Uses translate3d for hardware acceleration
     * 
     * @param {HTMLElement} cardEl - Card DOM element
     * @param {Object} transform - Transform object
     */
    applyTransform(cardEl, transform) {
        if (!cardEl) return;
        
        // Use translate3d for GPU acceleration
        cardEl.style.transform = `
            translate3d(${transform.x}px, ${transform.y}px, 0) 
            rotate(${transform.rotation}deg)
            scale(${transform.scale})
        `;
        cardEl.style.zIndex = transform.zIndex;
        
        // Store transform for debugging
        cardEl._currentTransform = transform;
    }
    
    /**
     * Gets the card element under the mouse
     * Checks from highest z-index to lowest
     * 
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
