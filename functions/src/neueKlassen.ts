import * as functions from "firebase-functions";
import {datenbank, region} from "./init";
import * as admin from "firebase-admin";

interface NeueKlassenDaten {
	schule: string
	klassen: { [klasse: string]: NeueKlasseDaten }
}

interface NeueKlasseDaten {
	lehrer: string
	email: string
	passwort: string
	groesse: string
}

export const neueKlassen = functions.region(region).https.onCall(async (daten: NeueKlassenDaten, context) => {
	if (context.auth?.uid !== "VJ1ubVp1kxSFQ75nXMOYa2WDIAL2") throw new functions.https.HttpsError('permission-denied', "Klassen können nur vom Admin erstellt werden.");

	const auth = admin.auth();
	const erstellteUser: string[] = [];
	const updates: { [ref: string]: any } = {};

	const revert = () => auth.deleteUsers(erstellteUser);

	for (let klasse in daten.klassen) {
		const klassenDaten = daten.klassen[klasse] as NeueKlasseDaten;
		await auth.createUser({
			email: klassenDaten.email,
			password: klassenDaten.passwort
		}).then(({uid}) => {
			updates["spezifisch/klassen/details/" + daten.schule + "/" + klasse] = {
				email: klassenDaten.email,
				uid,
				potAnzahlFahrer: klassenDaten.groesse
			};
			updates["spezifisch/klassen/liste/" + daten.schule + "/" + klasse] = true;
			erstellteUser.push(uid);
		})
			.catch(reason => revert().then(() => {
				throw new functions.https.HttpsError("internal", `Konnte Benutzer für Klasse ${klasse} (${klassenDaten.lehrer}, ${klassenDaten.email}, ${klassenDaten.groesse}, ${klassenDaten.passwort}) nicht erstellen: ${reason}`);
			}));
	}

	await datenbank.ref().update(updates).catch(reason => revert().then(() => {
		throw new functions.https.HttpsError('internal', `Konnte Klassen nicht erstellen, Datenbank gab folgenden Fehler: ${reason}`);
	}));
})
