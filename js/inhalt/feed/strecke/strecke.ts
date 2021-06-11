import Strecke from "../../../model/strecke";
import {strecken} from "../../../firebase/lesen";
import m from "../../../formatierung/einheit/m";
import {fahrerNummer, fahrerRangBestenliste, streckenVonFahrer} from "../../../verschieden";

type FormulierungGenerator = (laenge: number, strecke: string, fahrer: string) => string

const linkZuName = (fahrer: string, text = fahrer) => "<a href='karte.html/#" + encodeURIComponent(fahrer) + "'>" + text + "</a>"

const formulierungsGruppen: {[gruppe: string]: FormulierungGenerator[]} = {
	generell: [
		(laenge, strecke, fahrer) =>
			`${linkZuName(fahrer)} ist ${strecke} gefahren.`,
		(laenge, strecke, fahrer) =>
			`🚲 ${linkZuName(fahrer)} hat ${strecke} eingetragen.`,
		(laenge, strecke, fahrer) =>
			`Weitere ${strecke} kommen von ${linkZuName(fahrer)}. Vielen Dank!`,
		(laenge, strecke, fahrer) =>
			`${linkZuName(fahrer)}'s ${streckenVonFahrer(fahrer).length}. Strecke: ${strecke}. Weiter so!`,
	],
	erste: [
		(laenge, strecke, fahrer) =>
			`${linkZuName(fahrer)} hat gerade seine/ihre erste Strecke eingetragen: ${strecke}!.`,
		(laenge, strecke, fahrer) =>
			`Willkommen im Club, ${linkZuName(fahrer)}! ${strecke}, nicht schlecht.`,
	],
	wiederholt: [
		(laenge, strecke, fahrer) =>
			`${linkZuName(fahrer, `Weltretter#${fahrerNummer(fahrer)}`)} legt noch ${strecke} drauf.`
	],
	bestenliste: [
		(laenge, strecke, fahrer) =>
			`${linkZuName(fahrer)}, ${fahrerRangBestenliste(fahrer)}. auf der Bestenliste, legt nach: ${strecke}.`,
	],
	bestenlisteAberNichtBester: [
		(laenge, strecke, fahrer) =>
			`${linkZuName(fahrer)} möchte unbedingt auf Rang ${fahrerRangBestenliste(fahrer) + 1} kommen, diesmal mit ${strecke}.`,
	]
}

export default function ({fahrer, laenge, zeitpunkt}: Strecke): string {
	const gruppen: FormulierungGenerator[][] = [formulierungsGruppen.generell];
	if (Object.values(strecken).filter(strecke => strecke.fahrer === fahrer).length > 1) gruppen.push(formulierungsGruppen.wiederholt)
	else gruppen.push(formulierungsGruppen.erste)

	const formulierungen = gruppen.flat()
	const zufaelligerIndex = Math.floor(zeitpunkt % 1000 / 1000 * formulierungen.length);

	return formulierungen[zufaelligerIndex]!!(laenge, Object.values(m(laenge)).join(" "), fahrer)
}

// Mit Link auf Name -> Map mit allen Strecken von Person


// Emojis (verschiedene Fahrradfahrer)



// Weltretter #23 ist weitere ... Kilometer gefahren.

// ... nahm gerade den 3. Platz ein.
