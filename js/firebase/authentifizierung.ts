import {getAuth, signInWithEmailAndPassword} from "firebase/auth";
import step from "../step";
import {email} from "../konfiguration";

export let authentifiziert = () => false

export default function authentifizieren(passwort: string) {
	const auth = getAuth()
	authentifiziert = () => auth.currentUser !== null

	return signInWithEmailAndPassword(auth, email, passwort)
		.then(({user}) => {
			step("Authentifiziert")
			return user
		})
		.catch(error => {
			const errorCode = error.code;
			const errorMessage = error.message;
			step("Konnte nicht anmelden: " + errorCode + " " + errorMessage)
			throw error
		});
}
