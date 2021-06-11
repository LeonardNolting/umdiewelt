import LatLngLiteral = google.maps.LatLngLiteral;
import animieren from "./animieren";
import {karte} from "./initialisieren";
import {animationFPS, animationZeit} from "./konfiguration";

const bewegen = (
	neuePosition: LatLngLiteral,
	zeit: number = animationZeit,
	fps: number = animationFPS
) => animieren(
	neuePosition,
	karte.getCenter().toJSON(),
	position => karte.setCenter(position),
	zeit,
	fps
)

export default bewegen
