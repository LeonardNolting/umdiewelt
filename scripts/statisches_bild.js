(async () => {
	const canvas = temp1;
	const anzeige = canvas.parentElement;

	if (!anzeige) {
		console.error("Error: Could not find the parent container.");
		return;
	}

	const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
	const hardwareMax = gl ? gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) : 8192;
	const SAFE_MAX = 8192;
	const MAX_PIXELS = Math.min(hardwareMax, SAFE_MAX);

	const dpr = window.devicePixelRatio || 1;
	const targetCSSSize = Math.floor(MAX_PIXELS / dpr);

	// Cache original styles to restore them perfectly later
	const origAnzeigeStyles = {
		width: anzeige.style.width,
		height: anzeige.style.height,
		position: anzeige.style.position,
		zIndex: anzeige.style.zIndex,
		maxWidth: anzeige.style.maxWidth,
		maxHeight: anzeige.style.maxHeight,
		transform: anzeige.style.transform,
		transformOrigin: anzeige.style.transformOrigin,
		top: anzeige.style.top,
		left: anzeige.style.left
	};
	const origCanvasStyles = {
		maxWidth: canvas.style.maxWidth,
		maxHeight: canvas.style.maxHeight
	};

	console.log(`Setting up for ${MAX_PIXELS}px export...`);

	// Calculate a scale factor to keep the giant container visible on-screen
	const scale = Math.min(window.innerWidth / targetCSSSize, window.innerHeight / targetCSSSize);

	// Force container size and override responsive constraints
	anzeige.style.position = 'fixed';
	anzeige.style.top = '0';
	anzeige.style.left = '0';
	anzeige.style.zIndex = '9999';
	anzeige.style.width = `${targetCSSSize}px`;
	anzeige.style.height = `${targetCSSSize}px`;
	anzeige.style.maxWidth = 'none';
	anzeige.style.maxHeight = 'none';

	// Keep it on-screen to prevent browser compositor culling
	anzeige.style.transformOrigin = 'top left';
	anzeige.style.transform = `scale(${scale})`;

	// Safeguard the canvas element itself against external CSS
	canvas.style.maxWidth = 'none';
	canvas.style.maxHeight = 'none';

	// Trigger resize so Three.js recalculates the projection matrix
	window.dispatchEvent(new Event('resize'));

	// Wait for layout reflow and re-render
	await new Promise(resolve => setTimeout(resolve, 800));

	requestAnimationFrame(() => {
		try {
			const dataUrl = canvas.toDataURL('image/png', 1.0);

			if (dataUrl === "data:,") {
				console.error("Export failed: Empty buffer.");
			} else {
				const link = document.createElement('a');
				link.download = `globe_export_full_${MAX_PIXELS}x${MAX_PIXELS}.png`;
				link.href = dataUrl;
				link.click();
				console.log("Success! Full uncropped image downloaded.");
			}
		} catch (e) {
			console.error("Export failed.", e);
		} finally {
			// Restore original styles
			Object.assign(anzeige.style, origAnzeigeStyles);
			Object.assign(canvas.style, origCanvasStyles);
			window.dispatchEvent(new Event('resize'));
			console.log("Restored original DOM state.");
		}
	});
})();
