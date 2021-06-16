import initialisieren from "./initialisieren";
import firebase from "./firebase/firebase";
import datenbank from "./firebase/datenbank";
import lesen from "./firebase/lesen";
import inhalt from "./inhalt/inhalt";
import maps from "./maps";
import Cookies from "./cookies";

Cookies.ueberpruefen().then(async () => {
	await maps()
	inhalt()
	initialisieren()
	firebase()
	datenbank()
	await lesen()
})
