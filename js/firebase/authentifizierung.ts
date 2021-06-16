import {getAuth, signInWithEmailAndPassword} from "firebase/auth";
import step from "../step";
import {email} from "../konfiguration";

export let angemeldet = () => false

export default function anmelden(passwort: string) {
	const auth = getAuth()
	angemeldet = () => auth.currentUser !== null

	return signInWithEmailAndPassword(auth, email, passwort)
		.then(({user}) => {
			step("Angemeldet")
			return user
		})
		.catch(error => {
			const errorCode = error.code;
			const errorMessage = error.message;
			step("Konnte nicht anmelden: " + errorCode + " " + errorMessage)
			throw error
		});
}
