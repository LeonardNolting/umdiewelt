import {fahrer} from "../firebase/lesen";
import zahl from "../formatierung/zahl";
import m from "../formatierung/einheit/m";

const emojis = ["🥇", "🥈", "🥉", "🏅"]

export default () => {
	const tabelle = document.getElementById("bestenliste-anzeige") as HTMLTableElement

	Object.entries(fahrer).forEach(([name, strecke], index) => {
		const rang = index + 1,
			zeile = tabelle.insertRow(),
			emoji = emojis[Math.min(index, emojis.length - 1)],
			{ wert, einheit } = m(strecke)

		zeile.insertCell().innerHTML = `${rang}. ${emoji} ${name}`
		zeile.insertCell().innerHTML =
			zahl(wert, 2, 0) + " " + einheit
	})
}
