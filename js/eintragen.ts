import {koordinaten} from "./konfiguration";

export default () => {
	const form = document.getElementById("eintragen-anzeige");

	(document.getElementById("eintragen-karte-knopf") as HTMLDetailsElement)
		.addEventListener("toggle", () => new google.maps.Map(document.getElementById("eintragen-karte"), {
			center: koordinaten.hoechstadt,
			mapTypeControl: false,
			clickableIcons: false,
			fullscreenControl: false,
			keyboardShortcuts: false,
			rotateControl: false,
			streetViewControl: false,
			zoom: 11
		}), {once: true})


	form.addEventListener("submit", event => {
		event.preventDefault()


	})
}
