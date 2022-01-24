import NeueSaisonKontrolle from "./kontrollen/neue-saison";
import SaisonstartKontrolle from "./kontrollen/zeit/start";
import NeueKlasseKontrolle from "./kontrollen/neue-klasse";
import NeueSchuleKontrolle from "./kontrollen/neue-schule";
import SaisonendeKontrolle from "./kontrollen/zeit/ende";
import SaisonLoeschenKontrolle from "./kontrollen/saison-loeschen";
import TestnachrichtKontrolle from "./kontrollen/testnachricht";
import StreckeLoeschenKontrolle from "./kontrollen/strecke-loeschen";
import Kontrolle from "./kontrollen/kontrolle";
import load from "../load";
import {onAuthStateChanged, signOut} from "firebase/auth";
import {auth, authentifizieren} from "../firebase/authentifizierung";
import Popup from "../popup";
import global from "../global";
import {adminPopup} from "../inhalt/admin";
import {adminEmail} from "../konfiguration";

const popup = document.getElementById("popup-anmelden-admin") as HTMLFormElement
const submit = adminPopup["submit"]

const kontrollen = [
	new NeueSaisonKontrolle(),
	new NeueKlasseKontrolle(),
	new NeueSchuleKontrolle(),
	new SaisonstartKontrolle(),
	new SaisonendeKontrolle(),
	new SaisonLoeschenKontrolle(),
	new TestnachrichtKontrolle(),
	new StreckeLoeschenKontrolle()
]

export const aktivieren = async () => {
	document.body.classList.add("admin")
	await Promise.all(kontrollen.map(kontrolle => kontrolle.initialisieren()))
	Kontrolle.fieldset.disabled = false
}

export const deaktivieren = () => {
	document.body.classList.remove("admin")
}

export const oeffnen = async () => {
	if (global.user !== undefined) {
		if (global.user !== null) {
			// Muss Teilnehmer sein, sonst könnte nicht auf diesen Knopf geklickt werden -> abmelden
			await load(signOut(auth))
		}
		Popup.oeffnen(popup)
	} else await load(new Promise(resolve => {
		// Sonst halt warten und nochmal probieren...
		const listener = onAuthStateChanged(auth, async newUser => {
			listener()
			global.user = newUser
			Popup.oeffnen(popup)
			resolve()
		})
	}))
}

let vorbereitet = false
export const vorbereiten = () => {
	if (vorbereitet) return
	vorbereitet = true

	popup.onsubmit = async event => {
		// Wir machen's dynamisch!
		event.preventDefault()

		// Verhindert versehentliches doppeltes Bestätigen
		submit.disabled = true;

		const passwort = popup["passwort"].value

		await load(authentifizieren(adminEmail, passwort, false)
			.then(() => {
				Popup.schliessen(popup)
				popup["passwort"].value = ""
				aktivieren()
			})
			.finally(() => submit.disabled = false))
	}

	document.getElementById("admin-abmelden").onclick = () => load(signOut(auth).then(deaktivieren))
	Kontrolle.form.onsubmit = event => event.preventDefault()
}

export { Kontrolle }
