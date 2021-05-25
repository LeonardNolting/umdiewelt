import {Loader} from "@googlemaps/js-api-loader"
// @ts-ignore
import images from "../img/*.png";
import {Markierung} from "./markierung";
import {
	apiSchluessel as apiKey,
	farben,
	fortschritt,
	mittelstreifenFPS,
	mittelstreifenGeschwindigkeit,
	region,
	sprache as language,
	spread,
	version,
	zoom
} from "./konfiguration";

// Google Maps laden
new Loader({apiKey, version, language, region})
	.load()
	.then(() => {
		// Zoomlevel
		const level = [3, 6, 10],
			/**
			 * Berechne das Zoomlevel, das beim nächsten Klick angewandt wird
			 */
			berechneNeuesLevelIndex = () => level[aktuellesLevelIndex + 1] === undefined ? 0 : aktuellesLevelIndex + 1
		let aktuellesLevelIndex = 0

		// Markierungen auf der Karte
		const punkte: { [key: string]: Markierung } = {
				0: new Markierung(undefined, 0, {lat: spread, lng: 0}),
				25: new Markierung(images["bullseye"], 30, {lat: spread / 2, lng: 90}),
				50: new Markierung(images["bullseye"], 45, {lat: 0, lng: 180}),
				75: new Markierung(images["bullseye"], 30, {lat: -spread / 2, lng: -90}),
				100: new Markierung(images["checkered-flag"], 80, {lat: -spread, lng: 0}, false),
			},
			aktuell = new Markierung(images["bicycle2"], 120, {
				lat: spread - fortschritt / 360 * spread * 2,
				lng: fortschritt
			}, false, marker => {
				const neuesLevelIndex = berechneNeuesLevelIndex()
				const neuesLevel = level[neuesLevelIndex]
				aktuellesLevelIndex = neuesLevelIndex
				karte.setZoom(neuesLevel);
				karte.setCenter(aktuell.position);

				// Schauen, ob nächstes Mal raus- oder reingezoomed wird -> entsprechend cursor setzen
				marker.setCursor("zoom-" + (berechneNeuesLevelIndex() === 0 ? "out" : "in"))
			}, "zoom-in"),
			schule = new Markierung(images["school"], 60, {lat: 49.71118441038904, lng: 10.80865905572955})

		// Karte
		const karte = new google.maps.Map(document.getElementById("karte"), {
				center: punkte["0"].position,
				zoom,
				restriction: {
					latLngBounds: {
						// Nicht höher und tiefer als Fahrrad
						north: aktuell.position.lat, south: aktuell.position.lat - 0.01,

						// Nach links und rechts unbegrenzt
						west: -180, east: 180
					},
				},
				// Zoom-, Kartentyp-, StreetView- usw. Knöpfe ausblenden
				disableDefaultUI: true,

				// Zoomen des Users verbieten
				scrollwheel: false,
				disableDoubleClickZoom: true,

				// Satellitenkarte anzeigen
				mapTypeId: 'satellite',
			})
		;

		// Hinzufügen aller sichtbaren Markierungen auf Karte
		[aktuell, schule, ...Object.values(punkte)]
			.filter(markierung => markierung.url !== undefined)
			.forEach(markierung => markierung.aufKarte(karte))

		// "Straße"
		const
			/**
			 * Asphalt
 			 */
			pfad = new google.maps.Polyline({
				path: Object.values(punkte).map(position => position.position),
				strokeColor: farben.strasse,
				strokeWeight: 120,
				map: karte,
				clickable: false
			}),
			/**
			 * Zurückgelegte Strecke
			 */
			progress = new google.maps.Polyline({
				path: [punkte["0"].position, aktuell.position],
				strokeColor: farben.progress,
				strokeOpacity: 0.6,
				strokeWeight: 120,
				map: karte,
				clickable: false
			}),
			/**
			 * Straßenbemalung
			 */
			mittelstreifen = new google.maps.Polyline({
				path: Object.values(punkte).map(position => position.position),
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
		// TODO in richtige Richtung
		setTimeout(() => {
			karte.panTo(aktuell.position)
		}, 1500)

		// Falls reingezoomed (durch Klicken auf Fahrrad), immer wieder zu Fahrrad zurückkehren
		// da sonst Linie nicht mehr vertikal zentriert, da leicht schräg (s. spread) und map-bounds auf Fahrrad angepasst
		karte.addListener("dragend", () => {
			if (aktuellesLevelIndex !== 0) karte.panTo(aktuell.position)
		});
	});
