export class Debounce {
    constructor() {
        this.timers = new Map();
    }

    execute(key, fn, delay = 100) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        const timer = setTimeout(() => {
            this.timers.delete(key);
            fn();
        }, delay);

        this.timers.set(key, timer);
    }

    cancel(key) {
        if (!this.timers.has(key)) {
            return;
        }

        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
    }

    flush(key, fn) {
        this.cancel(key);
        fn();
    }
}

export const debouncer = new Debounce();
