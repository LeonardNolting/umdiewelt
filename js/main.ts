import initialisieren from "./initialisieren";
import firebase from "./firebase/firebase";
import datenbank from "./firebase/datenbank";
import lesen from "./firebase/lesen";
import inhalt from "./inhalt/inhalt";
import maps from "./maps";
import Cookies from "./cookies";
import popups from "./popups";

document.addEventListener("DOMContentLoaded", async () => {
	popups()
	await Cookies.ueberpruefen()
	await maps()
	inhalt()
	initialisieren()
	firebase()
	datenbank()
	await lesen()
})
