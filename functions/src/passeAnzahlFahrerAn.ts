import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {datenbank, region} from "./init";

async function passeAnzahlFahrerAn(data: { schule: string, klasse: string, name: string }, fahrer: string, negativ: boolean = false) {
	const increment = admin.database.ServerValue.increment(negativ ? -1 : 1)
	const laufend = (await datenbank.ref("allgemein/saisons/laufend").get()).val()

	// Eintragen neuer Saison löscht allerhand Fahrer - aber soll nicht Statistiken wieder runterzählen
	if (laufend === null) return

	const existed = !!(await datenbank.ref("spezifisch/klassen/details/" + data.schule + "/" + data.klasse + "/fahrer/" + data.name).get()).val();

	const updates: { [ref: string]: any } = {}
	if ((existed && negativ) || (!existed && !negativ)) {
		updates["spezifisch/klassen/details/" + data.schule + "/" + data.klasse + "/anzahlFahrer"] = increment
		updates["spezifisch/klassen/details/" + data.schule + "/" + data.klasse + "/fahrer/" + data.name] = negativ ? null : fahrer
		updates["allgemein/saisons/details/" + laufend + "/anzahlFahrer"] = increment
		updates["allgemein/saisons/details/" + laufend + "/schulen/details/" + data.schule + "/anzahlFahrer"] = increment
		updates["allgemein/anzahlFahrer"] = increment
	}
	await datenbank.ref().update(updates)
}

export const onFahrerChange = functions.region(region).database.ref("/spezifisch/fahrer")
	.onWrite(async (change) => {
		if (!change.after.exists()) return null; // Bulk delete skip

		const before = change.before.val() || {};
		const after = change.after.val() || {};

		const beforeKeys = Object.keys(before);
		const afterKeys = Object.keys(after);

		const addedKeys = afterKeys.filter(key => !before[key]);
		const deletedKeys = beforeKeys.filter(key => !after[key]);

		const promises = [];
		for (const key of addedKeys) {
			promises.push(passeAnzahlFahrerAn(after[key], key));
		}
		for (const key of deletedKeys) {
			promises.push(passeAnzahlFahrerAn(before[key], key, true));
		}

		return Promise.all(promises);
	});

