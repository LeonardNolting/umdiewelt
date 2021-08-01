interface Document {
	wait: boolean
	progress: boolean
}

Object.defineProperties(HTMLBodyElement.prototype, {
	wait: {
		get() {
			return this.hasAttribute('data-wait');
		},
		set(value: boolean) {
			(value ? this.setAttribute('data-wait', '') : this.removeAttribute('data-wait'));
		},
	},
	progress: {
		get() {
			return this.hasAttribute('data-progress');
		},
		set(value: boolean) {
			(value ? this.setAttribute('data-progress', '') : this.removeAttribute('data-progress'));
		},
	},
});

interface HTMLElement {
	/**
	 * Legt im CSS fest, dass dieses Element und alle Kindelemente erreichbar sind, selbst wenn der Rest nicht klickbar ist.
	 */
	waitImmune: boolean
}

Object.defineProperty(Element.prototype, 'waitImmune', {
	get() {
		return this.hasAttribute('data-wait-immune');
	},
	set(value: boolean) {
		(value ? this.setAttribute('data-wait-immune', '') : this.removeAttribute('data-wait-immune'));
	},
});
