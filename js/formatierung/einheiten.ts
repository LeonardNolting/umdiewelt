const kg = (wert: number): { wert: number, einheit: string } => {
	if (Math.abs(wert) < 2) return {
		wert: wert * 1000,
		einheit: "g"
	}; else if (Math.abs(wert) >= 2000) return {
		wert: wert / 1000,
		einheit: "t"
	}; else return {
		wert, einheit: "kg"
	}
}

const m = (wert: number): { wert: number, einheit: string } => Math.abs(wert) >= 2000 ? {
	wert: wert / 1000,
	einheit: "km"
} : {wert, einheit: "m"}

export const zahl = (zahl: number, anzahlNachkommastellen: number, minimumAnzahlNachkommastellen: number = anzahlNachkommastellen) => zahl.toLocaleString("de-DE", {
	minimumFractionDigits: minimumAnzahlNachkommastellen,
	maximumFractionDigits: anzahlNachkommastellen
})

export default { kg, m }
