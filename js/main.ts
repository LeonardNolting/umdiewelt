import firebase from "./firebase/firebase";
import inhalt from "./inhalt/inhalt";
import Cookies from "./cookies";
import popups from "./popups";
import browserAktualisierung from "./browserAktualisierung";

import wait from "./wait";
import load from "./load";
import {Eintragung} from "./eintragen";
import welt from "./welt/welt";

const anzeigen = welt()

document.addEventListener("DOMContentLoaded", async () => {
	wait()
	await anzeigen()
	browserAktualisierung()
	popups()
	// * Es werden keine weiteren Cookies gespeichert, neben denen von der Schulhomepage. Ein Cookie-Hinweis ist deshalb nicht nötig.
	// await Cookies.ueberpruefen()

	await load((async () => {
		// await maps() // TODO erst wenn autocomplete/distance matrix benötigt wird
		await inhalt()
		await firebase()
		await Eintragung.vorbereiten()
	})())
})
