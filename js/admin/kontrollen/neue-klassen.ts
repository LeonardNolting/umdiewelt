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
						const [klasse, groesse] = zeile.split(";");
						klassen[klasse] = {
							// Konvertiere Umlaute richtig (Ã¤ -> ä, ...)
							// (escape ist seit 2014 deprecated, d.h. falls irgendwann nicht mehr vorhanden, kann nicht mehr konvertiert werden)
							// (für Alternativen: https://stackoverflow.com/questions/26342123/replacement-for-javascript-escape)
							// KORREKTUR escape funktioniert nicht mit ÃŸ -> ß; da lehrer nie gebraucht wird, wird lehrer fortan nicht mehr gespeichert
							// lehrer: "escape" in window ? decodeURIComponent(escape(lehrer)) : lehrer,
							groesse,
							// Es spielt keine Rolle, was für E-Mail-Adressen benutzt werden (werden nur für Firebase Accounts benutzt, aber es werden nie E-Mails gesendet)
							email: klasse.replace(/[^a-zA-Z0-9]/gi, '').toLowerCase() + "@gy-ho.de",
							passwort: NeueKlassenKontrolle.passwortGenerieren()
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
}
