import {getAuth, signInWithEmailAndPassword} from "firebase/auth";
import step from "../step";

export default function anmelden(passwort: string) {
	const auth = getAuth(),
		email = "leonard.nolting@gymhoes.de"

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
