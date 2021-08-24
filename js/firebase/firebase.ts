import {initializeApp} from "firebase/app";
import step from "../step";
import {Datenbank} from "./datenbank/datenbank";
import authentifizierung from "./authentifizierung";

export default async () => {
	step("Initialisiert Firebase")

	// noinspection SpellCheckingInspection
	initializeApp({
		apiKey: "AIzaSyB2ibUVgYItdBY0Lpmyo6dQMHy5N4wiwJw",
		authDomain: "fahrrad-schule.firebaseapp.com",
		databaseURL: "https://fahrrad-schule-default-rtdb.europe-west1.firebasedatabase.app",
		projectId: "fahrrad-schule",
		storageBucket: "fahrrad-schule.appspot.com",
		messagingSenderId: "585934420778",
		appId: "1:585934420778:web:28f589b7f8d4165cfa7c53",
		measurementId: "G-FSF7RJDSE7"
	});

	authentifizierung()
	Datenbank.initialisieren()
	Datenbank.Lesen.lesen()
}
