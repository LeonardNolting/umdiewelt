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
import Cookie from "../cookie";
import {eintragenTextSetzen} from "../inhalt/eintragen";

export let auth: Auth

/**
 * angemeldet: User
 * nicht angemeldet: null
 * unbekannt: undefined
 */
export let user: User | null | undefined

export default () => {
	auth = getAuth()
	onAuthStateChanged(auth, newUser => {
		user = newUser
		if (newUser === null) {
			Cookie.kill("fahrer")
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
		if (error.code === "auth/wrong-password") benachrichtigung("Falsches Passwort. Bitte versuchen Sie es erneut.", BenachrichtigungsLevel.WARNUNG)
		else benachrichtigung("Konnte nicht anmelden: " + error.code + " " + error.message, BenachrichtigungsLevel.ALARM)
		throw error;
	}
}
