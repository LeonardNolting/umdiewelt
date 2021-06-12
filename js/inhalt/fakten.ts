import zahl from "../formatierung/zahl";

interface HTMLTableRowElementFakt extends HTMLTableRowElement {
	interval: NodeJS.Timeout,
	wertZelle: HTMLTableCellElement,

	wert?: {
		wertBerechnen: () => { wert: number, einheit?: string },
		valide: boolean,
		anzahlNachkommastellen: number,
	}

	gesehen: boolean
}

const tabelle = document.getElementById("fakten-anzeige") as HTMLTableElement

const observer = new IntersectionObserver((eintraege, observer) => {
	eintraege.filter(eintrag => eintrag.isIntersecting).forEach(eintrag => {
		const zeile = eintrag.target as HTMLTableRowElementFakt;
		observer.unobserve(zeile)
		faktAnzeigen(zeile)
	})
}, {
	rootMargin: '0px',
	threshold: 1.0
})

export default function fakten() {
	Array.from(tabelle.rows).forEach((zeile: HTMLTableRowElementFakt) => {
		zeile.wertZelle = document.createElement("td")
		zeile.appendChild(zeile.wertZelle)

		observer.observe(zeile)
	})
}

function faktAnzeigen(zeile: HTMLTableRowElementFakt) {
	zeile.gesehen = true
	if (!zeile.wert) return

	const zelle = zeile.wertZelle

	if (!zeile.wert.valide) return zelle.innerHTML = "N/A"

	const {wert, einheit = ""} = zeile.wert.wertBerechnen(),
		wertSetzen = (wert: number) => zelle.innerHTML = zahl(wert, zeile.wert.anzahlNachkommastellen, 0) + " " + einheit,
		zeit = 600,
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

export function fakt(bezeichnung: string, wertBerechnen: () => { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1) {
	const zeile = Array.from(tabelle.rows).find(zeile => zeile.dataset["bezeichnung"] === bezeichnung) as HTMLTableRowElementFakt

	zeile.wert = {
		wertBerechnen,
		valide,
		anzahlNachkommastellen
	}
	if (zeile.gesehen) faktAnzeigen(zeile)
}
