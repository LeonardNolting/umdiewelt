import {set} from "firebase/database";
import LatLngLiteral = google.maps.LatLngLiteral;
import {fahrer, strecke, strecken} from "./lesen";
import {refs} from "./datenbank";

export let eintragbar = false
export function eintragen(name: string, route: { von: LatLngLiteral, nach: LatLngLiteral } | undefined, meter: number) {
	if (!eintragbar)
		throw new Error("Kann nicht eintragen, ohne `strecke`, `fahrer` und `strecken` zu kennen.")

	// Strecke
	set(refs.strecke, (strecke || 0) + meter)

	// Fahrer
	set(refs.bestimmt.fahrer(name), (fahrer[name] || 0) + meter)

	// Strecken
	let neuerSchluessel: number = 0
	if (strecken !== null) {
		const schluessel = Object.keys(strecken)
		const letzterSchluessel = schluessel[schluessel.length - 1]
		neuerSchluessel = Number(letzterSchluessel) + 1
	}
	set(refs.bestimmt.strecken(neuerSchluessel), {laenge: meter, fahrer: name, zeitpunkt: Date.now()})

	// Routen
	if (route !== undefined)
		set(refs.bestimmt.routen(neuerSchluessel), route)

	// Bestenliste

}
