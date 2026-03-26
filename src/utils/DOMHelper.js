export class DOMHelper {
    /**
     * Wait until an element has measurable layout dimensions.
     * @param {HTMLElement|null} element
     * @param {number} timeout
     * @returns {Promise<DOMRect>}
     */
    static waitForLayout(element, timeout = 2000) {
        return new Promise((resolve, reject) => {
            if (!element) {
                reject(new Error('[DOMHelper] Missing element in waitForLayout'));
                return;
            }

            const start = performance.now();

            const check = () => {
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    resolve(rect);
                    return;
                }

                if (performance.now() - start > timeout) {
                    reject(new Error(`[DOMHelper] Layout timeout for element: ${element.id || element.className || 'unknown'}`));
                    return;
                }

                requestAnimationFrame(check);
            };

            requestAnimationFrame(check);
        });
    }

    /**
     * @param {HTMLElement|null} element
     * @returns {DOMRect}
     */
    static getBounds(element) {
        if (!element || !element.getBoundingClientRect) {
            return new DOMRect(0, 0, 0, 0);
        }
        return element.getBoundingClientRect();
    }

    /**
     * @param {number} screenX
     * @param {number} screenY
     * @param {DOMRect} containerBounds
     * @returns {{x: number, y: number}}
     */
    static toLocalCoords(screenX, screenY, containerBounds) {
        return {
            x: screenX - containerBounds.left,
            y: screenY - containerBounds.top
        };
    }
}
