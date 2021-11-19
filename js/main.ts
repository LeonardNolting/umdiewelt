import firebase from "./firebase/firebase";
import inhalt from "./inhalt/inhalt";
import Cookies from "./cookies";
import popups from "./popups";
import browserAktualisierung from "./browserAktualisierung";

import '@fortawesome/fontawesome-free/css/solid.min.css'
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import 'awesome-notifications/dist/style.css'
import wait from "./wait";
import load from "./load";
import {Eintragung} from "./eintragen";
import welt from "./welt/welt";

document.addEventListener("DOMContentLoaded", async () => {
	wait()
	browserAktualisierung()
	popups()
	await Cookies.ueberpruefen()

	await load((async () => {
		// await maps() // TODO erst wenn autocomplete/distance matrix benötigt wird
		await welt()
		await inhalt()
		await firebase()
		await Eintragung.vorbereiten()
	})())
})
