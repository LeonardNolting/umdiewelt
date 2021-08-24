declare global {
	interface Document {
		wait: boolean
		progress: boolean
	}

	interface HTMLElement {
		/**
		 * Legt im CSS fest, dass dieses Element und alle Kindelemente erreichbar sind, selbst wenn der Rest nicht klickbar ist.
		 */
		waitImmune: boolean
	}
}

export default () => {
	Object.defineProperties(Document.prototype, {
		wait: {
			get() {
				return this.documentElement.hasAttribute('data-wait');
			},
			set(value: boolean) {
				(value ? this.documentElement.setAttribute('data-wait', '') : this.documentElement.removeAttribute('data-wait'));
			},
		},
		progress: {
			get() {
				return this.documentElement.hasAttribute('data-progress');
			},
			set(value: boolean) {
				(value ? this.documentElement.setAttribute('data-progress', '') : this.documentElement.removeAttribute('data-progress'));
			},
		},
	});

	Object.defineProperty(HTMLElement.prototype, 'waitImmune', {
		get() {
			return this.hasAttribute('data-wait-immune');
		},
		set(value: boolean) {
			(value ? this.setAttribute('data-wait-immune', '') : this.removeAttribute('data-wait-immune'));
		},
	});
}
