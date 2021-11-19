/**
 * Momentan kein Support für mehrere gleichzeitig geöffnete Popups
 */
export namespace Popup {
	export const wrapper = document.getElementById("popups")
	export const hintergrund = document.getElementById("popup-hintergrund")
	export const popups = Array.from(document.querySelectorAll("#popups > *:not(#popup-hintergrund)")) as HTMLElement[]

	export function oeffnen(popup: HTMLElement) {
		document.body.classList.add("popup")
		if (popup.classList.contains("wichtig")) document.body.classList.add("popup-wichtig");
		popup.classList.add("offen");
		(popup.querySelector("[autofocus]") as HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement)?.focus()
	}

	export function schliessen(popup: HTMLElement) {
		popup.dispatchEvent(new Event("close"))
		popup.classList.remove("offen")
		if (alleGeschlossen()) document.body.classList.remove("popup")
		document.body.classList.remove("popup-wichtig")
	}

	export function alle() {
		return Popup.popups
	}

	export function alleSchliessen() {
		Popup.popups.forEach(popup => schliessen(popup))
	}

	export function alleGeschlossen() {
		console.log(Popup.popups)
		return !Popup.popups.some(popup => popup.classList.contains("offen"))
	}

	export function offenes() {
		return Popup.popups.find(popup => popup.classList.contains("offen"))
	}
}
