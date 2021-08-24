import initialisieren from "./initialisieren";
import firebase from "./firebase/firebase";
import {Datenbank} from "./firebase/datenbank/datenbank";
import inhalt from "./inhalt/inhalt";
import maps from "./maps";
import Cookies from "./cookies";
import popups from "./popups";
import browserAktualisierung from "./browserAktualisierung";

import '@fortawesome/fontawesome-free/css/solid.min.css'
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import 'awesome-notifications/dist/style.css'
import wait from "./wait";
import load from "./load";

document.addEventListener("DOMContentLoaded", () => load((async () => {
	wait()
	browserAktualisierung()
	popups()
	await Cookies.ueberpruefen()
	await maps()
	await inhalt()
	initialisieren()
	await firebase()
})()))
