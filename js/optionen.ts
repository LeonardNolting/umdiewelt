import {level} from "./konfiguration";
import {aktuell, aktuellesLevelIndex, punkte} from "./initialisieren";

const optionen = (): google.maps.MapOptions => ({
	center: punkte["0"].position,
	zoom: level[aktuellesLevelIndex],
	restriction: restriction(),
	// Zoom-, Kartentyp-, StreetView- usw. Knöpfe ausblenden
	disableDefaultUI: true,

	// Zoomen des Users verbieten
	scrollwheel: false,
	disableDoubleClickZoom: true,

	// Satellitenkarte anzeigen
	mapTypeId: 'satellite',

	keyboardShortcuts: false,
})

export default optionen

export const restriction = () => ({
	latLngBounds: {
		// Nicht höher und tiefer als Fahrrad
		north: aktuell.position.lat,
		south: aktuell.position.lat - 0.001,

		// Nach links und rechts unbegrenzt
		west: -180,
		east: 180
	},
})
