import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {datenbank, region} from "./init";

async function passeStreckeUndAnzahlStreckenAn(data: { strecke: number, fahrer: string }, negativ: boolean = false) {
	const laufend = (await datenbank.ref("allgemein/saisons/laufend").get()).val()

	// Eintragen neuer Saison löscht allerhand Strecken - aber soll nicht Statistiken wieder runterzählen
	if (laufend === null) return

	const delta = data.strecke
	const fahrer = data.fahrer
	const richtung = negativ ? -1 : 1
	const streckeIncrement = admin.database.ServerValue.increment(delta * richtung)
	const anzahlStreckenIncrement = admin.database.ServerValue.increment(1 * richtung)
	const {schule, klasse} = (await datenbank.ref("spezifisch/fahrer/" + fahrer).get()).val()
	const updates: { [ref: string]: any } = {}
	updates["spezifisch/klassen/details/" + schule + "/" + klasse + "/strecke"] = streckeIncrement
	updates["spezifisch/klassen/details/" + schule + "/" + klasse + "/anzahlStrecken"] = anzahlStreckenIncrement
	updates["allgemein/saisons/details/" + laufend + "/strecke"] = streckeIncrement
	updates["allgemein/saisons/details/" + laufend + "/anzahlStrecken"] = anzahlStreckenIncrement
	updates["allgemein/saisons/details/" + laufend + "/schulen/details/" + schule + "/strecke"] = streckeIncrement
	updates["allgemein/saisons/details/" + laufend + "/schulen/details/" + schule + "/anzahlStrecken"] = anzahlStreckenIncrement
	updates["allgemein/strecke"] = streckeIncrement
	updates["allgemein/anzahlStrecken"] = anzahlStreckenIncrement
	const streckenVonFahrer = Object.values((await datenbank.ref("spezifisch/strecken/").get()).val() || {}).filter(((strecke) => (strecke as {fahrer: string})["fahrer"] == fahrer));
	if (streckenVonFahrer.length == 0) updates["spezifisch/fahrer/" + fahrer] = null;
	else {
		updates["spezifisch/fahrer/" + fahrer + "/strecke"] = streckeIncrement
		updates["spezifisch/fahrer/" + fahrer + "/anzahlStrecken"] = anzahlStreckenIncrement
	}
	await datenbank.ref().update(updates)
}

export const onStreckenChange = functions.region(region).database.ref("/spezifisch/strecken")
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
			promises.push(passeStreckeUndAnzahlStreckenAn(after[key]));
		}
		for (const key of deletedKeys) {
			promises.push(passeStreckeUndAnzahlStreckenAn(before[key], true));
		}

		return Promise.all(promises);
	});

