import {umfang} from "./konfiguration";

// export const streckenVonFahrer = (fahrer: string) => Object.values(strecken).filter(strecke => strecke.fahrer === fahrer)
// export const fahrerNummer = (fahrer: string) => Object.keys(fahrer).indexOf(fahrer)

/*export const nachStreckeGefahreneKilometer = (streckenNummer: string) => {
	const index = Object.keys(strecken).indexOf(streckenNummer)
	// TODO eingeschlossen oder ausgeschlossen?
	Object.values(strecken).slice(index).reduce((acc, cur) => acc + cur.laenge, 0)
}*/

/*export const vorStreckeGefahreneKilometer = (streckenNummer: string) =>
	Object.values(strecken)
		// nur frühere Strecken, ausschließlich aktueller
		.slice(0, Object.keys(strecken).indexOf(streckenNummer))
		// aufsummieren
		.reduce((acc, cur) => acc + cur.laenge, 0)*/

/**
 * Meiste Strecke zuerst...
 */
// export const fahrerNachStrecke = () => Object.keys(fahrer).sort((a, b) => fahrer[b] - fahrer[a])
/**
 * Aufwändiger als fahrerRangBestenliste!
 * @param fahrer
 */
// export const fahrerRang = (fahrer: string) => fahrerNachStrecke().indexOf(fahrer) + 1

// export const fahrerRangBestenliste = (fahrer: string) => bestenliste.indexOf(fahrer) + 1


export const prozent: {[faktor: number]: number} = {}
for (let i = 1; i < 100; i++) prozent[i] = umfang * i/100

export function download(filename: string, data: string) {
	const blob = new Blob([data], {type: 'text/csv'})
	const element = document.createElement('a');
	element.href = URL.createObjectURL(blob);
	element.download = filename;

	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}
