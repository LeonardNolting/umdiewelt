import {onChildAdded, onValue, ref, Unsubscribe} from "firebase/database";
import Datenbank from "../../firebase/datenbank";
import {getFunctions, httpsCallable} from "firebase/functions";
import Kontrolle from "./kontrolle";
import {getApp} from "firebase/app";
import {download} from "../../verschieden";

export default class NeueKlassenKontrolle extends Kontrolle {
	constructor() {
		super("neue-klassen", "Neue Klassen können nur eingetragen werden, wenn eine aktuelle Saison existiert.");
	}

	private aktuellListener: Unsubscribe
	private aktuell: string | undefined = undefined

	protected init() {
		return new Promise<void>(resolve =>
			this.aktuellListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktuell"), snap => {
				this.aktuell = snap.val();
				this.erlaubt = this.aktuell !== null
				resolve()
			})
		)
	}

	async destroy() {
		this.aktuellListener?.()
	}

	protected async submit(): Promise<string> {
		const dateien = (this.element("dateien") as HTMLInputElement).files ?? [];
		const schule = this.element("schule").value;

		const klassen = {};

		await new Promise(resolve => {
			const reader = new FileReader();
			for (let datei: File of dateien) {
				reader.addEventListener('load', (event) => {
					const text = event.target.result as string;
					const zeilen = text.match(/[^\r\n]+/g);
					for (let zeile of zeilen) {
						const [klasse, lehrer, groesse, email, passwort] = zeile.split(";");
						if (klasse in klassen) throw "Klasse " + klasse + " kam mehrmals vor!";
						klassen[klasse] = {
							lehrer,
							groesse,
							email: email ? email : NeueKlassenKontrolle.einzigartigeEmailVonLehrer(
								lehrer,
								["hip@gy-ho.de", ...Object.values(klassen).map(klasse => klasse["email"] as string)]
							),
							passwort: passwort ? passwort : NeueKlassenKontrolle.passwortGenerieren()
						};
					}
					resolve()
				});
				// * Dateien müssen in UTF-8 csv kodiert sein (Excel: "Speichern unter" CSV UTF-8 ...)
				reader.readAsText(datei);
			}
		})

		if (Object.keys(klassen).length === 0) throw "Die Tabelle ist leer."

		const functions = getFunctions(getApp(), "europe-west1");
		const neueKlassenErstellen = httpsCallable(functions, 'neueKlassen');
		return neueKlassenErstellen({schule, klassen})
			.then(() => {
				download("Passwörter " + new Date().getFullYear(), Object.entries(klassen).map(([klasse, daten]) => {
					const {lehrer, passwort} = daten
					return [klasse, lehrer, passwort].join(";");
				}).join("\n"))
				return "Klassen erstellt 👍 Eine CSV-Datei mit den Passwörtern steht zum Speichern bereit.";
			})
			.catch((reason) => Promise.reject(reason));
	}

	protected async vorbereiten() {
		this.element("schule").innerHTML = ""
		const aktuell = this.aktuell;
		if (aktuell === null || aktuell === undefined)
			throw new Error("Sollte eigentlich nicht vorkommen. Wenn aktuell === null, ist kontrolle.erlaubt = false. Wenn aktuell === undefined, wurde noch nicht initialisiert. In beiden Fällen sollte man hier nicht landen.")

		onChildAdded(
			ref(Datenbank.datenbank, "allgemein/saisons/details/" + aktuell + "/schulen/liste"),
			snap => this.element("schule").append(new Option(snap.key, snap.key))
		)
	}

	private static zifferGenerieren(): number {
		return Math.floor(Math.random() * 10)
	}

	private static passwortGenerieren(): string {
		return "UDW-" + this.zifferGenerieren() + this.zifferGenerieren() + "-" + this.zifferGenerieren() + this.zifferGenerieren() + "-" + this.zifferGenerieren()
	}

	/**
	 * Eigentlich sollten die E-Mail-Adressen den Tatsächlichen der Lehrer entsprechen, aber hier tun wir nur so, da es momentan keine Rolle spielt. Die Ergebnisse imitieren also nur die echten Adressen.
	 * @param lehrer
	 * @param existierendeEmails
	 * @private
	 */
	private static einzigartigeEmailVonLehrer(lehrer: string, existierendeEmails: string[]): string {
		let suffix: number | null = null
		let email: string
		do {
			email = this.emailVonLehrer(lehrer, suffix?.toString() ?? "")
			suffix = suffix == null ? 2 : suffix + 1
		} while (existierendeEmails.includes(email))
		return email
	}

	private static emailVonLehrer(lehrer: string, suffix: string): string {
		const woerter = lehrer.split(" ")
		let name = woerter[woerter.length - 1]

		name = name.replace(/\u00dc/g, "Ue") // Ü
		name = name.replace(/\u00fc/g, "ue") // ü
		name = name.replace(/\u00c4/g, "Ae") // Ä
		name = name.replace(/\u00e4/g, "ae") // ä
		name = name.replace(/\u00d6/g, "Oe") // Ö
		name = name.replace(/\u00f6/g, "oe") // ö
		name = name.replace(/\u00df/g, "ss") // ß

		return name.substr(0, 3).toLowerCase() + suffix + "@gy-ho.de"
	}
}
