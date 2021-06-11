import zahl from "../formatierung/zahl";

interface HTMLTableRowElementFakt extends HTMLTableRowElement {
	interval: NodeJS.Timeout,
	wertZelle: HTMLTableCellElement
}

const tabelle = document.getElementById("fakten-anzeige") as HTMLTableElement

export function fakt(bezeichnung: string, wertBerechnen: () => { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1) {
	const zeile = Array.from(tabelle.rows).find(row => row.dataset["bezeichnung"] === bezeichnung) as HTMLTableRowElementFakt
	const zelle = zeile.wertZelle || document.createElement("td")
	zeile.wertZelle = zelle
	zeile.appendChild(zelle)

	if (!valide) return zelle.innerHTML = "N/A"

	const {wert, einheit = ""} = wertBerechnen(),
		wertSetzen = (wert: number) => zelle.innerHTML = zahl(wert, anzahlNachkommastellen, 0) + " " + einheit,
		zeit = 300,
		fps = 50,
		anzahlSchritte = Math.ceil(Math.min(wert * 2, zeit * fps / 1000));

	if (anzahlSchritte < 1) {
		clearInterval(zeile.interval)
		wertSetzen(wert)
		return
	}

	const schritt = wert / anzahlSchritte,
		intervalTime = zeit / anzahlSchritte;

	let i = anzahlSchritte - 1
	zeile.interval = setInterval(() => {
		zelle.innerHTML = wertSetzen(wert - schritt * i)
		i--
		if (i < 0) clearInterval(zeile.interval)
	}, intervalTime)
}
