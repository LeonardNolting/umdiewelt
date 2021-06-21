import {onValue} from "firebase/database";
import aktualisieren from "../aktualisieren";
import {refs} from "./datenbank";
import {fakt} from "../inhalt/fakten";
import step from "../step";
import m from "../formatierung/einheit/m";
import kg from "../formatierung/einheit/kg";
import feed from "../inhalt/feed/feed";
import Strecken from "../model/strecken";
import Fahrer from "../model/fahrer";
import Routen from "../model/routen";
import fahrerInhalt from "../inhalt/fahrer";

/**
 * Wie viele Meter schon gefahren wurden
 * Undefined falls noch nicht abgefragt
 * Null falls noch nie gesetzt
 */
export let strecke: number

/**
 * Map Name => Anzahl Meter
 * Undefined falls noch nicht abgefragt
 * Null falls noch nie gesetzt
 */
export let fahrer: Fahrer

/**
 * Map Nummer => länge: number, fahrer: string
 * Undefined falls noch nicht abgefragt
 * Null falls noch nie gesetzt
 */
export let strecken: Strecken

// Routen
/**
 * Map Nummer => von: Koordinaten, zu: Koordinaten
 * Undefined falls noch nie abgefragt
 * Null falls noch nie gesetzt
 */
export let routen: Routen

// Bestenliste
/**
 * Beste zuerst
 */
export let bestenliste: string[]

const allesWurdeGelesen = () => strecke !== undefined && fahrer !== undefined && strecken !== undefined

export const allesGelesen = () =>
	allesGelesenPromise !== undefined ? allesGelesenPromise : lesen();

let allesGelesenPromise: Promise<void>
const lesen = () =>
	allesGelesenPromise = new Promise<void>(resolve => {
		step("Liest aus Datenbank")

		function ueberpruefen() {
			if (allesWurdeGelesen()) {
				step("Alles Wichtige aus Datenbank gelesen")

				if (strecken) Object.entries(strecken)
					// letzte 10 Strecken
					.slice(-10)
					// anzeigen
					.forEach(([streckenNummer, strecke]) => feed(streckenNummer, strecke))

				resolve()
			}
		}

		// Strecke
		onValue(refs.strecke, async snapshot => {
			strecke = snapshot.val()
			ueberpruefen()

			await aktualisieren(strecke || 0)

			fakt("strecke", () => m(strecke || 5))
			fakt("gespart", () => kg((strecke || 0) / 1000 * 0.18), true, 3)

			//! Infinite loop
			/*console.log(strecke, typeof strecke)
			set(refs.strecke, strecke + 1)
			console.log("getestet")*/
		})

		// Fahrer
		onValue(refs.fahrer, snapshot => {
			fahrer = snapshot.val()
			ueberpruefen()

			fahrerInhalt()

			fakt("fahrer", () => ({wert: fahrer ? Object.keys(fahrer).length : 0}))
		})

		// Strecken
		onValue(refs.strecken, snapshot => {
			strecken = snapshot.val().filter(it => !!it)
			ueberpruefen()

			fakt("durchschnitt", () => m(Object.values(strecken).reduce((acc, cur) => acc + cur.laenge, 0) / Object.keys(strecken).length), !!strecken)
		})

		onValue(refs.bestenliste, snapshot => {
			bestenliste = snapshot.val()

			// TODO inhalt/bestenliste
		})
	});

export default lesen
