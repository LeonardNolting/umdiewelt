import {getAnalytics} from "firebase/analytics";
import {
	Database,
	endAt,
	getDatabase,
	limitToLast,
	onChildAdded,
	onValue,
	orderByKey,
	query,
	ref,
	get,
	enableLogging
} from "firebase/database";
import step from "../../step";
import Liste from "./liste";
import {ausgewaehlteSaison, bieteSaisonZurAuswahlAn, waehleSaisonAus} from "../../inhalt/saison";
import {ladeFakt} from "../../inhalt/fakten";
import m from "../../formatierung/einheit/m";
import kg from "../../formatierung/einheit/kg";
import co2 from "../../co2";
import LatLngLiteral = google.maps.LatLngLiteral;

export interface Saison {
	start: number
	ende: number
	strecke: number
	strecken: number
	fahrer: number
	schulen: {
		[name: string]: {
			strecke: number
			strecken: number
			fahrer: number
			potFahrer: number
			angefeuert: number
		}
	}
}

export interface Schule {
	saisons: { [jahr: string]: true }
	klassen: {
		[name: string]: {
			strecke: number
			strecken: number
			fahrer: number
		}
	}
}

export interface Fahrer {
	klasse: string
	name: string
	strecke: number
	strecken: number
}

export interface Strecke {
	fahrer: string
	strecke: number
	zeitpunkt: number
}

export interface Route {
	von: LatLngLiteral & { ort: string }
	zu: LatLngLiteral & { ort: string }
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
		/*strecke: new Wert<number>(async strecke => {
			await aktualisieren(strecke)

			fakt("strecke", () => m(strecke))
			fakt("gespart", () => kg(co2(strecke)), true, 3)
		}, 0, wert => typeof wert !== "number"),*/

		saisons: new Liste<Saison>(),
		schulen: new Liste<Schule>(/*zeile => {
		}, zeile => {
		}, key => {
		}, zeilen => {
			Authentifizierung.vorbereiten()
		}*/),
		fahrer: new Liste<Fahrer>(),
		strecken: new Liste<Strecke>(),
		routen: new Liste<Route>(),
		orte: new Liste<Orte>(),

		/*test: new Liste<Saison>(
			// null,
			// it => console.log("add ", it),
			// it => console.log("change ", it),
			// it => console.log("remove ", it),
			// it => console.log("load ", it)
		)*/
	}

	export function initialisieren() {
		step("Verbindet mit Datenbank")

		const analytics = getAnalytics()
		datenbank = getDatabase();

		// enableLogging(true)

		Object.entries(tabellen).forEach(([name, tabelle]) => {
			tabelle.name = name
			tabelle.ref = ref(datenbank, name)
		})

		return datenbank
	}

	export namespace Lesen {
		export function lesen() {
			step("Liest Datenbank");

			globaleStrecke()
			beteiligteJaehrlich()
			saisonAuswahl()
		}

		async function globaleStrecke() {
			onValue(ref(datenbank, "global/strecke"), async snap => {
				const strecke = snap.val() || 0

				ladeFakt("strecke", m(strecke))
				ladeFakt("gespart", kg(co2(strecke)), true, 3)
			})
		}

		async function beteiligteJaehrlich() {
			let anzahlFahrer = undefined,
				anzahlHistorischeSaisons = undefined

			const probieren = () => {
				// Schon fertig geladen?
				if (anzahlFahrer === undefined || anzahlHistorischeSaisons === undefined) return

				const wert = anzahlFahrer / anzahlHistorischeSaisons
				const valide = anzahlHistorischeSaisons !== 0;
				ladeFakt("fahrer", {wert}, valide, 0)
			}

			onValue(ref(datenbank, "anzahlFahrer"), snap => {
				anzahlFahrer = snap.val() || 0
				probieren()
			})

			onValue(ref(datenbank, "saisons/anzahlHistorisch"), snap => {
				anzahlHistorischeSaisons = snap.val() || 0
				probieren()
			})
		}

		async function saisonAuswahl() {
			const geladene = []
			let aktiv = undefined,
				zuletztAktiv = undefined,
				/**
				 * Erst wenn die aktive Saison bekannt ist *und geladen wurde* aktive Saison zur Auswahl anbieten, sodass sie vorher schon *in der richtigen Reihenfolge* zur Auswahl angeboten wurde und nicht vorher irgendwo undefiniert landet.
				 */
				fertig = () => aktiv !== undefined && geladene.includes(aktiv)

			const probieren = () => {
				// Schon fertig geladen?
				if (!fertig()) return

				bieteSaisonZurAuswahlAn(aktiv)

				const ausgewaehlt = ausgewaehlteSaison()
				if (
					// Nur automatisch wechseln, wenn die aktuelle Saison ausgewählt wurde (wenn man sich alte Saisons anschaut möchte man evtl. nicht gestört werden)
					zuletztAktiv === ausgewaehlt ||
					// evtl. wurde Saisonauswahl noch nicht geladen -> zuletztAktiv schon auf aktiv gesetzt (ohne Saisonauswahl wird Nutzer aber auch nicht gestört, da er sich keine alten Saisons hat anschauen können...)
					zuletztAktiv === aktiv
				) waehleSaisonAus(aktiv)
			}

			onChildAdded(ref(datenbank, "saisons/liste"), snap => {
				bieteSaisonZurAuswahlAn(snap.key)
				geladene.push(snap.key)
				probieren()
			})

			onValue(ref(datenbank, "saisons/aktiv"), snap => {
				aktiv = snap.key
				probieren()
				zuletztAktiv = aktiv
			})
		}
	}
}

// export default Datenbank
