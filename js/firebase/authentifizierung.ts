import {
	Auth,
	browserLocalPersistence,
	getAuth,
	inMemoryPersistence,
	onAuthStateChanged,
	setPersistence,
	signInWithEmailAndPassword, User
} from "firebase/auth";
import step from "../step";
import {adminEmail} from "../konfiguration";
import benachrichtigung from "../benachrichtigungen/benachrichtigung";
import BenachrichtigungsLevel from "../benachrichtigungen/benachrichtigungsLevel";
import Storage from "../storage";
import {eintragenTextSetzen} from "../inhalt/eintragen";
import global from "../global";

export let auth: Auth

export default () => {
	auth = getAuth()
	onAuthStateChanged(auth, newUser => {
		global.user = newUser
		if (newUser === null) {
			Storage.kill("fahrer")
			eintragenTextSetzen(null)
		}
		step(newUser ? "Angemeldet als " + (newUser.email === adminEmail ? "Admin" : "Teilnehmer") : "Abgemeldet")
	})
}

export async function authentifizieren(email: string, passwort: string, angemeldetBleiben: boolean | undefined) {
	if (angemeldetBleiben !== undefined) await setPersistence(auth, angemeldetBleiben ? browserLocalPersistence : inMemoryPersistence)
	try {
		await signInWithEmailAndPassword(auth, email, passwort);
	} catch (error) {
		if (error.code === "auth/wrong-password") benachrichtigung("Falsches Passwort. Bitte erneut versuchen.", BenachrichtigungsLevel.WARNUNG)
		else benachrichtigung("Konnte nicht anmelden: " + error.code + " " + error.message, BenachrichtigungsLevel.ALARM)
		throw error;
	}
}
