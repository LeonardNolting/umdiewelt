import {getAnalytics} from "firebase/analytics";
import {Database, getDatabase, onChildAdded, onValue, ref} from "firebase/database";
import step from "../step";
import {ausgewaehlteSaison, bieteSaisonZurAuswahlAn, waehleSaisonAus} from "../inhalt/saison";
import {ladeFakt} from "../inhalt/fakten";
import m from "../formatierung/einheit/m";
import kg from "../formatierung/einheit/kg";
import co2 from "../co2";
import bestenliste from "../inhalt/bestenliste";
import {aktualisieren, daten} from "../welt/welt";

export namespace Datenbank {
	export let datenbank: Database

	export function initialisieren() {
		step("Verbindet mit Datenbank")

		const analytics = getAnalytics()
		datenbank = getDatabase();

		// enableLogging(true)

		return datenbank
	}

	export namespace Lesen {
		export function lesen() {
			step("Liest Datenbank");

			onValue(ref(datenbank, "allgemein/saisons/aktiv"), async snap => {
				const saison = snap.val()
				fortschritt(saison)
				beteiligte(saison)
			})
			saisonAuswahl()
			bestenliste()
		}

		function fortschritt(saison: string | null) {
			onValue(ref(datenbank, "allgemein/saisons/details/" + saison + "/strecke"), snap => {
				daten.strecke = snap.val() || 0
				// daten.strecke = 0
				ladeFakt("strecke", m(daten.strecke), true, 0)
				ladeFakt("gespart", kg(co2(daten.strecke)), true, 2)
				aktualisieren()
			})
		}

		function beteiligte(saison: string | null) {
			onValue(ref(datenbank, "allgemein/saisons/details/" + saison + "/anzahlFahrer"), snap => {
				daten.beteiligte = snap.val() || 0
				// daten.beteiligte = 0
				ladeFakt("fahrer", {wert: daten.beteiligte}, true, 0)
				aktualisieren()
			})
		}

		async function saisonAuswahl() {
			const geladene = []
			let aktiv = undefined,
				zuletztAktiv = undefined,
				/**
				 * Erst wenn die aktive Saison bekannt ist *und geladen wurde* aktive Saison zur Auswahl anbieten, sodass sie vorher schon *in der richtigen Reihenfolge* zur Auswahl angeboten wurde und nicht vorher irgendwo undefiniert landet.
				 */
				fertig = () => aktiv !== undefined && aktiv !== null && geladene.includes(aktiv)

			const probieren = () => {
				// Schon fertig geladen?
				if (!fertig()) return

				bieteSaisonZurAuswahlAn(aktiv)

				const ausgewaehlt = ausgewaehlteSaison()
				if (
					// Nur automatisch wechseln, wenn die aktuelle Saison ausgewählt wurde (wenn man sich alte Saisons anschaut möchte man evtl. nicht gestört werden)
					zuletztAktiv === ausgewaehlt ||
					// oder es wurde tatsächlich keine Saison ausgewählt, weil vorher noch keine da waren...
					ausgewaehlt === undefined
				) waehleSaisonAus(aktiv)
				zuletztAktiv = aktiv
			}

			onChildAdded(ref(datenbank, "allgemein/saisons/liste"), snap => {
				bieteSaisonZurAuswahlAn(snap.key)
				geladene.push(snap.key)
				probieren()
			})

			onValue(ref(datenbank, "allgemein/saisons/aktiv"), snap => {
				aktiv = snap.val()?.toString() || null
				probieren()
			})
		}
	}
}

export default Datenbank
