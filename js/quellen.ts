const quellen: { [bezeichnung: string]: { was: string, wert: number, name: string, url: string } } = {
	"verbrauch": {
		was: "Durchschnittlicher Kraftstoffverbrauch PKW/Kombi mit Otto-Motor in Deutschland 2019: <b>7,8l/100km</b>",
		wert: 7.8,
		name: "Verkehr in Zahlen 2020/2021, S. 309, Bundesministerium für Verkehr und digitale Infrastruktur",
		url: "https://www.bmvi.de/SharedDocs/DE/Publikationen/G/verkehr-in-zahlen-2020-pdf.pdf?__blob=publicationFile"
	},
	"gespart": {
		was: "Eingespartes CO<sub>2</sub> pro Kilometer, zurückgelegt mit Fahrrad statt Auto mit Otto-Motor, bei einem Verbrauch von 7,8l/100km: <b>0,18kg/km</b>",
		wert: 0.18,
		name: "Einspar Rechner, Allgemeiner Deutscher Fahrrad-Club Landesverband Baden-Württemberg e. V.",
		url: "https://www.adfc-bw.de/radzurarbeit/einspar-rechner/"
	}
}

export default quellen
