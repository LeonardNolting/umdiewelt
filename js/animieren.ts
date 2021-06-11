import LatLngLiteral = google.maps.LatLngLiteral;
import {animationFPS, animationZeit} from "./konfiguration";

export default function animieren(
	neuePosition: LatLngLiteral,
	altePosition: LatLngLiteral,
	versetzen: (position: LatLngLiteral) => void,
	zeit: number = animationZeit,
	fps: number = animationFPS
): NodeJS.Timeout {
	const differenz = {
			lng: neuePosition.lng - altePosition.lng,
			lat: neuePosition.lat - altePosition.lat
		},
		anzahlSchritte = Math.ceil(zeit * fps / 1000),
		schritt = {
			lng: differenz.lng / anzahlSchritte,
			lat: differenz.lat / anzahlSchritte
		},
		intervalTime = zeit / anzahlSchritte;

	let i = anzahlSchritte - 1
	const interval = setInterval(() => {
		const position = {
			lng: neuePosition.lng - schritt.lng * i,
			lat: neuePosition.lat - schritt.lat * i
		};
		versetzen(position)
		i--
		if (i < 0) clearInterval(interval)
	}, intervalTime)

	return interval
}
