import {aktuell, aktuellesLevelIndex, karte, latBeiLng, progress, progressPath} from "./initialisieren";
import anzeigen, {angezeigt, ziehtGerade} from "./anzeigen";
import animieren from "./animieren";
import {restriction} from "./optionen";
import LatLngLiteral = google.maps.LatLngLiteral;
import {umfang} from "./konfiguration";
import step from "./step";

function fortschreiten(position: LatLngLiteral, folgen: boolean) {
	karte.setOptions({
		restriction: restriction()
	})
	aktuell.bewegen(position)
	mitwirken.bewegen(position)
	progress.setPath(progressPath())
	if (folgen && !ziehtGerade) karte.setCenter(position)
}

let interval: NodeJS.Timeout

/**
 *
 * @param meter Zurückgelegte Meter
 */
export default async function aktualisieren(
	meter: number
) {
	step("Aktualisiert: " + meter + " Meter")
	const fortschritt = 360 * Math.min(1, meter / umfang),
		neuePosition = {
			lng: fortschritt,
			lat: latBeiLng(fortschritt)
		},
		altePosition = aktuell.position;
	clearInterval(interval)

	const animation = angezeigt
	const folgen = angezeigt && (
		Math.abs(karte.getCenter().lng() - aktuell.marker.getPosition().lng()) < 8 ||
		aktuellesLevelIndex !== 0
	)
	if (animation) {
		clearInterval(interval)
		interval = animieren(neuePosition, altePosition, position => fortschreiten(position, folgen))
	} else fortschreiten(neuePosition, folgen)

	if (!angezeigt) anzeigen()
}
