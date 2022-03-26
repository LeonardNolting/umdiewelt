import * as functions from "firebase-functions";
import {datenbank, region} from "./init";

export const statistiken = functions.region(region).https.onCall(async (daten, context) => {
	if (context.auth?.uid !== "VJ1ubVp1kxSFQ75nXMOYa2WDIAL2") throw new functions.https.HttpsError('permission-denied', "Umfassende Statistiken können nur vom Admin angefordert werden.");

	// * Lege Schema fest
	const schulen: {
		name: string,
		klassen: {
			name: string,
			strecke: number,
			beteiligung: number,
			fahrer: {
				name: string,
				strecke: number
			}[]
		}[]
	}[] = [];

	// * Frage Daten ab
	const schulenSnap = await datenbank.ref("spezifisch/klassen/details").get();
	if (!schulenSnap.exists()) throw new functions.https.HttpsError(
		"failed-precondition",
		"Es gibt keine Daten, die angezeigt werden könnten."
	);

	const fahrer = (await datenbank.ref("spezifisch/fahrer").get()).val() as {
		[fahrer: string]: {
			schule: string,
			klasse: string,
			name: string,
			strecke: number,
			anzahlStrecken: number,
		}
	} | undefined | null;

	// * Ordne Daten nach Schema an
	schulenSnap.forEach(schuleSnap => {
		const schule = schuleSnap.key!;
		const klassen = Object.entries(schuleSnap.val() as {
			[klasse: string]: {
				strecke: number,
				anzahlStrecken: number,
				anzahlFahrer: number,
				potAnzahlFahrer: number,
				email: string,
				uid: string,
				fahrer: { [name: string]: string } | undefined | null
			}
		});
		schulen.push({
			name: schule,
			klassen: klassen.map(([klasse, klasseDaten]) => ({
				name: klasse,
				strecke: klasseDaten.strecke,
				beteiligung: (klasseDaten.anzahlFahrer / klasseDaten.potAnzahlFahrer) || 0,
				fahrer: Object.values(klasseDaten.fahrer ? klasseDaten.fahrer : {}).map(fahrerId => fahrer![fahrerId])
			}))
		})
	});

	// * Formatiere Daten zu CSV
	const zeile = (werte: [any?, any?, any?]): string => werte.map(wert => wert === undefined || wert === null ? "" : wert).join(";");

	return {
		csv: schulen.map(schule => {
			let abschnitt = zeile([schule.name]);
			abschnitt += "\n\n\n";
			abschnitt += schule.klassen.map(klasse => {
				let abschnitt = zeile([klasse.name, klasse.strecke || 0, klasse.beteiligung]);
				if (klasse.fahrer.length !== 0) {
					abschnitt += "\n";
					abschnitt += klasse.fahrer.map(fahrer => {
						return zeile([fahrer.name, fahrer.strecke]);
					}).join("\n");
				}
				return abschnitt;
			}).join("\n\n");
			return abschnitt;
		}).join("\n\n\n\n")
	};
});
