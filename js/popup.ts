namespace Popup {
	export const wrapper = document.getElementById("popups")
	export const hintergrund = document.getElementById("#popup-hintergrund")
	export const popups = Array.from(document.querySelectorAll("#popups > *:not(#popup-hintergrund)")) as HTMLElement[]

	export function oeffnen(popup: HTMLElement) {
		document.body.classList.add("popup")
		popup.classList.add("offen")
	}

	export function schliessen(popup: HTMLElement) {
		if (alleGeschlossen()) document.body.classList.remove("popup")
		popup.classList.remove("offen")
	}

	export function alle() {
		return popups
	}

	export function alleSchliessen() {
		popups.forEach(popup => schliessen(popup))
	}

	export function alleGeschlossen() {
		return popups.some(popup => popup.classList.contains("offen"))
	}
}

export default Popup
