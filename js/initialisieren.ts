import {farben, level, spread} from "./konfiguration";
import {Markierung} from "./markierung";
// @ts-ignore
import images from "../img/*.png";
import optionen from "./optionen";
import step from "./step";
import {Eintragung} from "./eintragen";

export let initialisiert = false

export let karte: google.maps.Map

export const latBeiLng = (lng: number) => spread - lng / 360 * spread * 2

// Zoomlevel
export const
	/**
	 * Berechne das Zoomlevel, das beim nächsten Klick angewandt wird
	 */
	berechneNeuesLevelIndex = () => level[aktuellesLevelIndex + 1] === undefined ? 0 : aktuellesLevelIndex + 1
export let aktuellesLevelIndex = 0

export let passwortInputWindow

// Markierungen auf der Karte
export const punkte: { [key: string]: Markierung } = {
		0: new Markierung(undefined, 0, {lat: spread, lng: 0}),
		25: new Markierung(undefined, 0, {lat: spread / 2, lng: 90}),
		50: new Markierung(images["half"], 60, {lat: 0, lng: 180}),
		75: new Markierung(undefined, 0, {lat: -spread / 2, lng: 270}),
		100: new Markierung(images["checkered-flag"], 80, {lat: -spread, lng: 360}, false),
	},
	schule = new Markierung(images["school"], 60, {lat: 49.71118441038904, lng: 10.80865905572955}),
	aktuell = new Markierung(images["bicycle2"], 120, {
		lat: latBeiLng(0),
		lng: 0
	}, false, marker => {
		const neuesLevelIndex = berechneNeuesLevelIndex()
		const neuesLevel = level[neuesLevelIndex]
		aktuellesLevelIndex = neuesLevelIndex
		karte.setZoom(neuesLevel);
		karte.setCenter(marker.getPosition());

		// Schauen, ob nächstes Mal raus- oder reingezoomed wird -> entsprechend cursor setzen
		marker.setCursor("zoom-" + (berechneNeuesLevelIndex() === 0 ? "out" : "in"))
	}, "zoom-in"),
	mitwirken = new Markierung(images["right-arrow"], 60, {
		lat: latBeiLng(0),
		lng: 0,
	}, false, () => Eintragung.eintragen(), "pointer", () => ({
		anchor: new google.maps.Point(-70, 90)
		// anchor: new google.maps.Point(60 / 2, 60 / 2)

	}), "Gefahrene Strecke eintragen!")

// "Straße"
export let
	/**
	 * Asphalt
	 */
	pfad,

	/**
	 * Zurückgelegte Strecke
	 */
	progress,

	/**
	 * Straßenbemalung
	 */
	mittelstreifen;

export const progressPath = () => [
	...Object.values(punkte)
		.filter(markierung => markierung.position.lng < aktuell.position.lng)
		.map(markierung => markierung.position),
	aktuell.position
]

export default function initialisieren() {
	step("Initialisiert")
	if (initialisiert) throw new Error("Karte wurde schon initialisiert.")
	initialisiert = true

	karte = new google.maps.Map(document.getElementById("karte"), optionen())

	pfad = new google.maps.Polyline({
		path: Object.values(punkte).map(position => position.position),
		strokeColor: farben.strasse,
		strokeWeight: 120,
		map: karte,
		clickable: false
	})
	progress = new google.maps.Polyline({
		path: progressPath(),
		strokeColor: farben.progress,
		strokeOpacity: 0.6,
		strokeWeight: 120,
		map: karte,
		clickable: false
	})
	mittelstreifen = new google.maps.Polyline({
		path: Object.values(punkte).map(markierung => markierung.position),
		strokeOpacity: 0,
		icons: [{
			icon: {
				path: 'M 0,-1 0,0.5',
				strokeOpacity: 1,
				scale: 8,
				strokeColor: farben.mittelstreifen,
				strokeWeight: 4,

			},
			repeat: '40px',
		}],
		map: karte,
		clickable: false,
	});
}
