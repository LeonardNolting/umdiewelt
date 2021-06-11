import {bestenliste, fahrer, strecken} from "./firebase/lesen";
import {umfang} from "./konfiguration";

export const streckenVonFahrer = (fahrer: string) => Object.values(strecken).filter(strecke => strecke.fahrer === fahrer)
export const fahrerNummer = (fahrer: string) => Object.keys(fahrer).indexOf(fahrer)

/*export const nachStreckeGefahreneKilometer = (streckenNummer: string) => {
	const index = Object.keys(strecken).indexOf(streckenNummer)
	// TODO eingeschlossen oder ausgeschlossen?
	Object.values(strecken).slice(index).reduce((acc, cur) => acc + cur.laenge, 0)
}*/

export const vorStreckeGefahreneKilometer = (streckenNummer: string) =>
	Object.values(strecken)
		// nur frühere Strecken, ausschließlich aktueller
		.slice(0, Object.keys(strecken).indexOf(streckenNummer))
		// aufsummieren
		.reduce((acc, cur) => acc + cur.laenge, 0)

/**
 * Meiste Strecke zuerst...
 */
export const fahrerNachStrecke = () => Object.keys(fahrer).sort((a, b) => fahrer[b] - fahrer[a])
/**
 * Aufwändiger als fahrerRangBestenliste!
 * @param fahrer
 */
export const fahrerRang = (fahrer: string) => fahrerNachStrecke().indexOf(fahrer) + 1

export const fahrerRangBestenliste = (fahrer: string) => bestenliste.indexOf(fahrer) + 1


export const prozent: {[faktor: number]: number} = {}
for (let i = 0; i < 1; i += 0.1) prozent[i] = umfang * i
