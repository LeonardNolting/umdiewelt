const quellen: { [bezeichnung: string]: { was: string, wert: number, name: string, url: string } } = {
	"verbrauch": {
		was: "Durch&shy;schnitt&shy;licher Kraft&shy;stoff&shy;ver&shy;brauch PKW/Kombi mit Otto-Motor in Deutsch&shy;land 2019: <b>7,8l/100km</b>",
		wert: 7.8,
		name: "Verkehr in Zahlen 2020/2021, S. 309, Bundes&shy;ministerium für Verkehr und digitale Infra&shy;struktur",
		url: "https://www.bmvi.de/SharedDocs/DE/Publikationen/G/verkehr-in-zahlen-2020-pdf.pdf?__blob=publicationFile"
	},
	"gespart": {
		was: "Ein&shy;ge&shy;spartes CO<sub>2</sub> pro Kilometer, zurück&shy;gelegt mit Fahr&shy;rad statt Auto mit Otto-Motor, bei einem Ver&shy;brauch von 7,8l/100km: <b>0,18kg/km</b>",
		wert: 0.18,
		name: "Einspar-Rechner, Allge&shy;meiner Deutscher Fahrrad-Club Landes&shy;verband Baden-Würt&shy;tem&shy;berg e.&nbsp;V.",
		url: "https://www.adfc-bw.de/radzurarbeit/einspar-rechner/"
	}
}

export default quellen
