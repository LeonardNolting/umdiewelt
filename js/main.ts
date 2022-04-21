import firebase from "./firebase/firebase";
import inhalt from "./inhalt/inhalt";
import Cookies from "./cookies";
import popups from "./popups";
import browserAktualisierung from "./browserAktualisierung";

import wait from "./wait";
import load from "./load";
import {Eintragung} from "./eintragen";
import welt from "./welt/welt";
import * as lazySizes from "lazysizes";

const anzeigen = welt()

document.addEventListener("DOMContentLoaded", async () => {
	lazySizes.init()
	document.addEventListener('lazybeforeunveil', function (e) {
		const bg = (e.target as HTMLElement).dataset["bg"];
		if (bg) {
			(e.target as HTMLElement).style.backgroundImage = 'url(' + bg + ')';
		}
	});

	wait()
	await anzeigen()
	browserAktualisierung()
	popups()
	await Cookies.ueberpruefen()

	await load((async () => {
		// await maps() // TODO erst wenn autocomplete/distance matrix benötigt wird
		await inhalt()
		await firebase()
		await Eintragung.vorbereiten()
	})())
})
