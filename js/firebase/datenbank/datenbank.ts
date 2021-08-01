import {getAnalytics} from "firebase/analytics";
import {getDatabase, ref, Database} from "firebase/database";
import step from "../../step";
import Liste from "./liste";
import {Wert} from "./wert";
import {Tabelle} from "./tabelle";
import LatLngLiteral = google.maps.LatLngLiteral;
import aktualisieren from "../../aktualisieren";
import {fakt} from "../../inhalt/fakten";
import m from "../../formatierung/einheit/m";
import kg from "../../formatierung/einheit/kg";
import co2 from "../../co2";
import {Authentifizierung} from "../authentifizierung/authentifizierung";

// import firebase from "firebase/compat";

export interface Schule {
	name: string
	strecke: number
}

export interface Klasse {
	schule: string
	name: string
	strecke: number
}

export interface Fahrer {
	klasse: string
	name: string
	strecke: number
}

export interface Strecke {
	fahrer: string
	strecke: number
	zeitpunkt: number
}

export interface Route {
	von: LatLngLiteral
	zu: LatLngLiteral
}

/**
 * Liste an Orten mit der jeweiligen Häufigkeit
 */
export interface Orte {
	[ort: string]: number
}

export namespace Datenbank {
	export let datenbank: Database

	export const tabellen = {
		strecke: new Wert<number>(async strecke => {
			await aktualisieren(strecke)

			fakt("strecke", () => m(strecke))
			fakt("gespart", () => kg(co2(strecke)), true, 3)
		}, 0, wert => typeof wert !== "number"),
		schulen: new Liste<Schule>(zeile => {
		}, zeile => {
		}, key => {
		}, zeilen => {
			Authentifizierung.vorbereiten()
		}),
		klassen: new Liste<Klasse>(zeile => {
		}, zeile => {
		}, key => {
		}, zeilen => {
			Authentifizierung.vorbereiten()
		}),
		fahrer: new Liste<Fahrer>(),
		strecken: new Liste<Strecke>(),
		routen: new Liste<Route>(),
		orte: new Liste<Orte>(),
	}

	export function initialisieren() {
		step("Verbindet mit Datenbank")

		const analytics = getAnalytics()
		datenbank = getDatabase();

		Object.entries(tabellen).forEach(([name, tabelle]) => {
			tabelle.name = name
			tabelle.ref = ref(datenbank, name)
		})

		return datenbank
	}
}

// export default Datenbank
