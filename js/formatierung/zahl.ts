export default (zahl: number, anzahlNachkommastellen: number, minimumAnzahlNachkommastellen: number = anzahlNachkommastellen) => zahl.toLocaleString("de-DE", {
	minimumFractionDigits: minimumAnzahlNachkommastellen,
	maximumFractionDigits: anzahlNachkommastellen
})
