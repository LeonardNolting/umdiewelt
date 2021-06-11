import {Loader} from "@googlemaps/js-api-loader"
import {apiSchluessel as apiKey, region, sprache as language, version,} from "./konfiguration";
import initialisieren from "./initialisieren";
import firebase from "./firebase/firebase";
import datenbank from "./firebase/datenbank";
import lesen from "./firebase/lesen";
import step from "./step";
import inhalt from "./inhalt/inhalt";

step("Lädt Google Maps")

// Google Maps laden
new Loader({apiKey, version, language, region})
	.load()
	.then(async () => {
		inhalt()
		initialisieren()
		firebase()
		datenbank()
		await lesen()
	})

// .then(() => aktualisieren(20_000_000))
// .then(registrieren)
// .then(() => anmelden("WfudW!"))
// .then(() => testSchreiben())
// .then(() => setInterval(() => aktualisieren(aktuell.position.lng + 2), 2500))
