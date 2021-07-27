import {fahrer} from "../firebase/lesen";
import zahl from "../formatierung/zahl";
import m from "../formatierung/einheit/m";
import {bestenlisteChunkGroesse} from "../konfiguration";

const tabelle = document.querySelector("#bestenliste-anzeige > table") as HTMLTableElement,
	mehrLaden = document.querySelector("#bestenliste-anzeige > button")

const emojis = ["🥇", "🥈", "🥉", "🏅"]

let naechsterChunk = 1

function ladeChunk(chunk: number) {
	const zeilen = tabelle.rows,
		min = chunk * bestenlisteChunkGroesse,
		max = min + bestenlisteChunkGroesse

	for (let i = min; i <= max; i++) {
		if (zeilen.length > i) {
			zeilen.item(i).classList.remove("versteckt")
			mehrLaden.classList.remove("versteckt")
		} else mehrLaden.classList.add("versteckt")
	}
}

export default () => {
	Object.entries(fahrer).forEach(([name, strecke], index) => {
		const rang = index + 1,
			zeile = tabelle.insertRow(),
			emoji = emojis[Math.min(index, emojis.length - 1)],
			{wert, einheit} = m(strecke)

		zeile.classList.add("versteckt")

		zeile.insertCell().innerHTML = `${rang}. ${emoji} ${name}`
		zeile.insertCell().innerHTML =
			zahl(wert, 2, 0) + " " + einheit
	})

	ladeChunk(0)

	mehrLaden.addEventListener("click", () => {
		ladeChunk(naechsterChunk)
		naechsterChunk++
	})
}
