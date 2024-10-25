const datenbank = {}

const klassenDetails = datenbank.spezifisch.klassen.details["Gymnasium Höchstadt"]


// region Jahrgangsstufen
// Jeder Klasse ihre Jahrgangsstufe zuordnen
// TODO ist das richtig bei komischen Klassennamen wie 9pE oder so?
// use parseInt?
for (let klasse in klassenDetails) klassenDetails[klasse].jgs = klasse === "Lehrer" ? "Sonstig" : klasse.slice(0, -1)

// Jeder Jahrgangsstufe ihre Klassen zuordnen
const klassenProJgs = {}
for (let klasse in klassenDetails) { klassenProJgs[klassenDetails[klasse].jgs] = (klassenProJgs[klassenDetails[klasse].jgs] || []); klassenProJgs[klassenDetails[klasse].jgs].push(klasse) }
// endregion


const beteiligungProKlasse = {}
for (let klasse in klassenDetails) {
	beteiligungProKlasse[klasse] = (((klassenDetails[klasse].anzahlFahrer / klassenDetails[klasse].potAnzahlFahrer) || 0) * 100).toLocaleString() + "%"
}

const beteiligungProJgs = {}
for (let jgs in klassenProJgs) {
	const anzahlFahrer = klassenProJgs[jgs].reduce((sum, klasse) => sum + (klassenDetails[klasse].anzahlFahrer || 0), 0)
	const potAnzahlFahrer = klassenProJgs[jgs].reduce((sum, klasse) => sum + (klassenDetails[klasse].potAnzahlFahrer || 0), 0)
	beteiligungProJgs[jgs] = (((anzahlFahrer / potAnzahlFahrer) || 0) * 100).toLocaleString() + "%"
}

const streckeProJgs = {}
for (let jgs in klassenProJgs) {
	streckeProJgs[jgs] = Math.round(klassenProJgs[jgs].reduce((sum, klasse) => sum + (klassenDetails[klasse].strecke || 0), 0) / 1000)
}

let objectToCSV = object => Object.entries(object)
	.map(entry => [...entry].join(";"))
	.join("\n")

function download(filename, data) {
	const blob = new Blob([data], {type: 'text/csv'})
	const element = document.createElement('a');
	element.href = URL.createObjectURL(blob);
	element.download = filename;

	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}


download("streckeProJgs", objectToCSV(streckeProJgs))
download("beteiligungProJgs", objectToCSV(beteiligungProJgs))
download("beteiligungProKlasse", objectToCSV(beteiligungProKlasse))
