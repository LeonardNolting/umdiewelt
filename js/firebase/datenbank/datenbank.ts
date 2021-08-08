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
	ref
} from "firebase/database";
import step from "../../step";
import Liste from "./liste";
import {ausgewaehlteSaison, bieteSaisonZurAuswahlAn, waehleSaisonAus} from "../../inhalt/saison";
import {fakt} from "../../inhalt/fakten";
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

		Object.entries(tabellen).forEach(([name, tabelle]) => {
			tabelle.name = name
			tabelle.ref = ref(datenbank, name)
		})

		return datenbank
	}

	export async function lesen() {
		step("Lese Datenbank")

		/*tabellen.saisons.ladeZeile(new Date().getFullYear().toString(), snap => {
			const key = snap.key
			const value = snap.val()
		})

		onChildAdded(tabellen.test.ref, data => console.log({key: data.key, value: data.val()}))
		// tabellen.test.laden(it => console.log("add ", it))*/

		onValue(ref(datenbank, "strecke"), async snap => {
			const strecke = snap.val() || 0

			fakt("strecke", () => m(strecke))
			fakt("gespart", () => kg(co2(strecke)), true, 3)
		})

		let anzahlFahrer = undefined,
			anzahlSaisons = undefined

		/**
		 * Überprüfe, ob der Fakt "fahrer" gesetzt werden kann
		 */
		const faktFahrer = () => {
			if (anzahlFahrer === undefined || anzahlSaisons === undefined) return
			const wert = anzahlSaisons === 0 ? 0 : anzahlFahrer / anzahlSaisons
			fakt("fahrer", () => ({wert}), anzahlSaisons !== 0, 0)
		}

		onValue(ref(datenbank, "anzahlFahrer"), snap => {
			anzahlFahrer = snap.val() || 0
			faktFahrer()
		})

		const saisonsRef = ref(datenbank, "saisons")

		onValue(query(saisonsRef, orderByKey()), snap => {
			anzahlSaisons = snap.size
			faktFahrer()

			snap.forEach(childSnap => bieteSaisonZurAuswahlAn(childSnap.key))

			let letzteSaison;

			// Letzte Saison gesondert bekommen und auswählen, s. Protokoll
			onChildAdded(query(saisonsRef, endAt(null), limitToLast(1)), snap => {
				const neu = snap.key
				const ausgewaehlt = ausgewaehlteSaison()
				bieteSaisonZurAuswahlAn(neu)

				// Nur automatisch wechseln, wenn die aktuelle Saison ausgewählt wurde (wenn man sich alte Saisons anschaut möchte man evtl. nicht gestört werden)
				if (ausgewaehlt === letzteSaison) waehleSaisonAus(neu)

				letzteSaison = neu
			})
		}, { onlyOnce: true })

		/*/!*onValue(saisonRef, snap => console.log("Saison:", snap.val()))
		onChildChanged(saisonRef, snap => console.log("Saison geändert:", snap.val()))*!/
		onValue(child(saisonRef, "start"), snap => console.log("Saisonstart gesetzt:", snap.val()))

		// Start und Ende
		onValue(child(saisonRef, "start"), snap => console.log("Saisonstart gesetzt:", snap.val()))
		onValue(child(saisonRef, "ende"), snap => console.log("Saisonende gesetzt:", snap.val()))
		onChildChanged(child(saisonRef, "start"), snap => console.log("Saisonstart verschoben:", snap.val()))
		onChildChanged(child(saisonRef, "ende"), snap => console.log("Saisonende verschoben:", snap.val()))

		// Fakten
		onValue(child(saisonRef, "strecke"), snap => console.log("Strecke gesetzt:", snap.val()))
		onValue(child(saisonRef, "strecke"), snap => console.log("Strecke verändert:", snap.val()))
		// selbes für strecken, fahrer ...

		// Schulen
		onValue(child(saisonRef, "schulen"), snap => console.log("Schule hinzugefügt:", snap.val()))
		onChildChanged(child(saisonRef, "schulen"), snap => console.log("Schule verändert:", snap.val()))*/
	}
}

// export default Datenbank
