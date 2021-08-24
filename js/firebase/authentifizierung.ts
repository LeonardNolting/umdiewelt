import {
	Auth,
	browserLocalPersistence,
	getAuth,
	inMemoryPersistence,
	onAuthStateChanged,
	setPersistence, signInWithEmailAndPassword
} from "firebase/auth";
import {Eintragung} from "../eintragen";
import step from "../step";
import {adminEmail} from "../konfiguration";
import benachrichtigung from "../benachrichtigungen/benachrichtigung";
import BenachrichtigungsLevel from "../benachrichtigungen/benachrichtigungsLevel";
import Cookie from "../cookie";

export let auth: Auth

export default () => {
	auth = getAuth()
	onAuthStateChanged(auth, user => {
		Eintragung.user = user
		if (user === null) Cookie.kill("fahrer")
		step(user ? "Angemeldet als " + (user.email === adminEmail ? "Admin" : "Teilnehmer") : "Abgemeldet")
	})
}

export async function authentifizieren(email: string, passwort: string, angemeldetBleiben: boolean | undefined) {
	if (angemeldetBleiben !== undefined) await setPersistence(auth, angemeldetBleiben ? browserLocalPersistence : inMemoryPersistence)
	try {
		await signInWithEmailAndPassword(auth, email, passwort);
	} catch (error) {
		if (error.code === "auth/wrong-password") benachrichtigung("Falsches Passwort. Bitte versuchen Sie es erneut.", BenachrichtigungsLevel.WARNUNG)
		else benachrichtigung("Konnte nicht anmelden: " + error.code + " " + error.message, BenachrichtigungsLevel.ALARM)
		throw error;
	}
}
