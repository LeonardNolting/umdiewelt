import {ref, set, update, increment} from "firebase/database";
import LatLngLiteral = google.maps.LatLngLiteral;
import {Authentifizierung} from "../authentifizierung/authentifizierung";
import {Datenbank} from "./datenbank";
import tabellen = Datenbank.tabellen;
import datenbank = Datenbank.datenbank;
import FahrerAuthentifizierung from "../authentifizierung/fahrerAuthentifizierung";

export let eintragbar = false

export async function eintragen(
	strecke: number,
	name: string,
	route?: { von: LatLngLiteral, nach: LatLngLiteral } | undefined
) {
	if (!Authentifizierung.authentifizierung.kannEintragen)
		throw new Error("Authentifizierung ist nicht ausreichend.")

	/* * Schritte:
	1. Strecke (Strecke anpassen)
	2. Schulen (Strecke anpassen)
	3. Klassen (Strecke anpassen)
	4. Fahrer (Strecke anpassen, evtl. erstellen)
	5. Strecken (erstellen)
	6. Orte (Häufigkeit erhöhen, evtl. erstellen)
	7. Routen (erstellen)

	-> zuerst Fahrer sicherstellen
	-> dann Strecke erstellen
	-> dann atomic alle Strecken auf einmal anpassen
	-> zuletzt Orte aktualisieren und Route erstellen (unwichtig)

	Am Ende: Länge überprüfen, ggf. melden
	 */

	// Fahrer
	const fahrer = ""

	// Strecke
	tabellen.strecken.eintragen({fahrer, strecke, zeitpunkt: Date.now()})

	// Strecken überall anpassen
	const klasse = (Authentifizierung.authentifizierung as FahrerAuthentifizierung).klasse
	const schule = tabellen.klassen.get(klasse).schule
	const updates = {}

	const steigerung = increment(strecke);
	updates[`strecke`] = steigerung
	updates[`schulen/${schule}/strecke`] = steigerung
	updates[`klassen/${klasse}/strecke`] = steigerung
	updates[`fahrer/${fahrer}/strecke`] = steigerung

	await update(ref(datenbank), updates)

	// Orte

	// Route

	// ggf. melden

}
