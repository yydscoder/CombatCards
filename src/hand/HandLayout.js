import { DOMHelper } from '../utils/DOMHelper.js';

export class HandLayout {
    constructor(options = {}) {
        this.config = {
            arcRadius: options.arcRadius ?? 350,
            arcCenterYOffset: options.arcCenterYOffset ?? 320,
            minAnglePerCard: options.minAnglePerCard ?? 5,
            maxAngleSpread: options.maxAngleSpread ?? 60,
            hoverLift: options.hoverLift ?? 50,
            hoverScale: options.hoverScale ?? 1.2,
            neighborPush: options.neighborPush ?? 30,
            cardWidth: options.cardWidth ?? 112,
            cardHeight: options.cardHeight ?? 156,
            animationDuration: options.animationDuration ?? 0.2,
            centerXRatio: options.centerXRatio ?? 0.39
        };

        this.lastState = {
            cardCount: -1,
            containerWidth: -1,
            containerHeight: -1,
            hoveredIndex: -2
        };
    }

    calculateCardPositions(cardCount, containerWidth, hoveredIndex = -1, containerHeight = 400) {
        if (cardCount <= 0 || containerWidth <= 0 || containerHeight <= 0) {
            return [];
        }

        const centerX = containerWidth * this.config.centerXRatio;
        const centerY = containerHeight + this.config.arcCenterYOffset;
        const totalSpread = this.calculateAngleSpread(cardCount);
        const startAngle = -totalSpread / 2;
        const step = cardCount > 1 ? totalSpread / (cardCount - 1) : 0;

        console.log(`[HandLayout] Container: ${containerWidth}px x ${containerHeight}px`);
        console.log(`[HandLayout] Arc pivot: centerX=${centerX.toFixed(1)}, centerY=${centerY.toFixed(1)} (below container)`);
        console.log(`[HandLayout] Arc radius: ${this.config.arcRadius}px, angle spread: ${totalSpread}deg`);

        const transforms = [];

        for (let index = 0; index < cardCount; index += 1) {
            const angleDeg = startAngle + (step * index);
            const angleRad = angleDeg * (Math.PI / 180);

            const rawX = centerX + (this.config.arcRadius * Math.sin(angleRad));
            const rawY = centerY - (this.config.arcRadius * Math.cos(angleRad));

            let offsetX = 0;
            let offsetY = 0;
            let scale = 1;

            if (index === hoveredIndex) {
                offsetY = -this.config.hoverLift;
                scale = this.config.hoverScale;
            } else if (hoveredIndex !== -1) {
                if (index < hoveredIndex) {
                    offsetX = -this.config.neighborPush;
                } else if (index > hoveredIndex) {
                    offsetX = this.config.neighborPush;
                }
            }

            const zIndex = index === hoveredIndex ? 999 : 50 + index;

            transforms.push({
                x: rawX - (this.config.cardWidth / 2),
                y: rawY - this.config.cardHeight,
                rotation: angleDeg,
                offsetX,
                offsetY,
                scale,
                zIndex
            });

            if (index === 0 || index === Math.floor(cardCount / 2) || index === cardCount - 1) {
                const finalX = rawX - (this.config.cardWidth / 2) + offsetX;
                const finalY = rawY - this.config.cardHeight + offsetY;
                console.log(`[HandLayout] Card ${index}: pos(${finalX.toFixed(0)}, ${finalY.toFixed(0)}), rotation=${angleDeg.toFixed(1)}deg, scale=${scale.toFixed(2)}`);
            }
        }

        this.lastState = {
            cardCount,
            containerWidth,
            containerHeight,
            hoveredIndex
        };

        return transforms;
    }

    calculateAngleSpread(cardCount) {
        if (cardCount <= 1) {
            return 0;
        }

        const spread = cardCount * this.config.minAnglePerCard;
        return Math.min(spread, this.config.maxAngleSpread);
    }

    needsRecalculation(cardCount, container) {
        const bounds = DOMHelper.getBounds(container);

        return (
            cardCount !== this.lastState.cardCount ||
            Math.abs(bounds.width - this.lastState.containerWidth) > 1 ||
            Math.abs(bounds.height - this.lastState.containerHeight) > 1
        );
    }

    applyTransform(cardEl, transform) {
        if (!cardEl || !transform) {
            return;
        }

        const finalX = transform.x + transform.offsetX;
        const finalY = transform.y + transform.offsetY;

        cardEl.style.transform = `translate(${finalX}px, ${finalY}px) rotate(${transform.rotation}deg) scale(${transform.scale})`;
        cardEl.style.zIndex = String(transform.zIndex);
        cardEl.style.transition = `transform ${this.config.animationDuration}s ease-out`;
        cardEl.style.transformOrigin = 'center bottom';
        cardEl.style.position = 'absolute';
        cardEl.style.left = '0';
        cardEl.style.top = '0';
    }
}

export default HandLayout;
