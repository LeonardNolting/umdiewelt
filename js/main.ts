import initialisieren from "./initialisieren";
import firebase from "./firebase/firebase";
import {Datenbank} from "./firebase/datenbank/datenbank";
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
	Datenbank.initialisieren()
})
