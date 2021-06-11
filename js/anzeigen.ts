import {mittelstreifenFPS, mittelstreifenGeschwindigkeit, verspaetungZuFahrrad, zeitZuFahrrad} from "./konfiguration";
import {
	aktuell,
	aktuellesLevelIndex,
	initialisiert,
	karte,
	mittelstreifen,
	mitwirken,
	punkte,
	schule
} from "./initialisieren";
import bewegen from "./bewegen";
import step from "./step";

export let angezeigt = false

export let ziehtGerade = false

export default function anzeigen() {
	step("Lädt Anzeige")
	if (!initialisiert) throw new Error("Kann erst nach dem Initialisieren anzeigen.")
	angezeigt = true;

	[schule, ...Object.values(punkte), aktuell, mitwirken]
		.filter(markierung => markierung.url !== undefined)
		.forEach(markierung => markierung.aufKarte());

	// Animation des Mittelstreifens
	const timeout = 1000 / mittelstreifenFPS
	let count = 0
	window.setInterval(() => {
		count = (count + mittelstreifenGeschwindigkeit / timeout * 2) % 200;
		const icons = mittelstreifen.get("icons");
		icons[0].offset = 100 - count / 2 + "%";
		mittelstreifen.set("icons", icons);
	}, timeout);

	// Von Anfang zu aktueller Position wechseln
	setTimeout(() => bewegen(aktuell.position, zeitZuFahrrad(aktuell.position.lat), 100), verspaetungZuFahrrad)

	karte.addListener("dragstart", () => { ziehtGerade = true })

	// Falls reingezoomed (durch Klicken auf Fahrrad), immer wieder zu Fahrrad zurückkehren
	// da sonst Linie nicht mehr vertikal zentriert
	// (da leicht schräg (s. spread) und map-bounds auf Fahrrad angepasst)
	karte.addListener("dragend", () => {
		ziehtGerade = false
		if (aktuellesLevelIndex !== 0) karte.panTo(aktuell.position)
	});
}
