import Strecke from "../../model/strecke";
import m from "../../formatierung/einheit/m";
import zahl from "../../formatierung/zahl";

type FormulierungGenerator = (strecke: string, fahrer: string, laenge: number) => string

/**
 * Link zu Karte mit allen Strecken des Fahrers
 *
 * Funktioniert aktuell __nicht__
 * @param fahrer
 * @param text
 */
const linkZuName = (fahrer: string, text = fahrer) => "<a href='karte.html/#" + encodeURIComponent(fahrer) + "'>" + text + "</a>"

// TODO emojis
const formulierungsGruppen: { [gruppe: string]: FormulierungGenerator[] } = {
	generell: [
		(strecke, fahrer) =>
			`${linkZuName(fahrer)} ist ${strecke} gefahren.`,
		(strecke, fahrer) =>
			`🚲 ${linkZuName(fahrer)} hat ${strecke} eingetragen.`,
		(strecke, fahrer) =>
			`Weitere ${strecke} kommen von ${linkZuName(fahrer)}. Vielen Dank!`,
		/*(strecke, fahrer) =>
			`${linkZuName(fahrer)}'s ${streckenVonFahrer(fahrer).length}. Strecke: ${strecke}. Weiter so!`,*/
	],
	erste: [
		(strecke, fahrer) =>
			`${linkZuName(fahrer)} hat gerade seine/ihre erste Strecke eingetragen: ${strecke}!.`,
		(strecke, fahrer) =>
			`Willkommen im Club, ${linkZuName(fahrer)}! ${strecke}, nicht schlecht.`,
	],
	wiederholt: [
		/*(strecke, fahrer) =>
			`${linkZuName(fahrer, `Weltretter#${fahrerNummer(fahrer)}`)} legt noch ${strecke} drauf.`*/
	],
	bestenliste: [
		/*(strecke, fahrer) =>
			`${linkZuName(fahrer)}, ${fahrerRangBestenliste(fahrer)}. auf der Bestenliste, legt nach: ${strecke}.`,*/
	],
	bestenlisteAberNichtBester: [
		/*(strecke, fahrer) =>
			`${linkZuName(fahrer)} möchte unbedingt auf Rang ${fahrerRangBestenliste(fahrer) + 1} kommen, diesmal mit ${strecke}.`,*/
	],
	// TODO bestenListeNeuerRang -> ... nahm gerade den 3. Platz ein.
}

export default function ({fahrer, laenge, zeitpunkt}: Strecke, zufaelligerIndex: (length: number) => number): string {
	/*const gruppen: FormulierungGenerator[][] = [formulierungsGruppen.generell];
	if (Object.values(strecken).filter(strecke => strecke.fahrer === fahrer).length > 1) gruppen.push(formulierungsGruppen.wiederholt)
	else gruppen.push(formulierungsGruppen.erste)
	// TODO bestenliste gruppen pushen

	const formulierungen = gruppen.flat(),
		laengeFormatiert = m(laenge);

	return formulierungen[zufaelligerIndex(formulierungen.length)]!!(zahl(laengeFormatiert.wert, 0) + " " + laengeFormatiert.einheit, fahrer, laenge)*/
	return "haha"
}
