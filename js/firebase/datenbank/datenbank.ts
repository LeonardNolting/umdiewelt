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
import {ausgewaehlteSaison, bieteSaisonZurAuswahlAn, waehleSaisonAus} from "../../inhalt/saison";
import {ladeFakt} from "../../inhalt/fakten";
import m from "../../formatierung/einheit/m";
import kg from "../../formatierung/einheit/kg";
import co2 from "../../co2";
import aktualisieren from "../../aktualisieren";

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

			fortschritt()
			globaleStrecke()
			beteiligteJaehrlich()
			saisonAuswahl()
		}

		function fortschritt() {
			onValue(ref(datenbank, "allgemein/saisons/aktiv"), async snap => {
				const saison = snap.val()
				const wert: number = saison === 0 ? 0 : await new Promise(resolve => {
					onValue(
						ref(datenbank, "allgemein/saisons/details/" + saison + "/strecke"),
						snap => resolve(snap.val() || 0)
					)
				})
				aktualisieren(wert)
			})
		}

		async function globaleStrecke() {
			onValue(ref(datenbank, "allgemein/strecke"), async snap => {
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

			onValue(ref(datenbank, "allgemein/saisons/anzahlHistorisch"), snap => {
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

// export default Datenbank
