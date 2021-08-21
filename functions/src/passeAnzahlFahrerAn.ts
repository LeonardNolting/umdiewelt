import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {datenbank, region} from "./init";

async function passeAnzahlFahrerAn(data: { schule: string, klasse: string, name: string }, fahrer: string, negativ: boolean = false) {
	const increment = admin.database.ServerValue.increment(negativ ? -1 : 1)
	const laufend = (await datenbank.ref("allgemein/saisons/laufend").get()).val()

	// Eintragen neuer Saison löscht allerhand Fahrer - aber soll nicht Statistiken wieder runterzählen
	if (laufend === null) return

	const updates: { [ref: string]: any } = {}
	updates["spezifisch/klassen/details/" + data.schule + "/" + data.klasse + "/anzahlFahrer"] = increment
	updates["spezifisch/klassen/details/" + data.schule + "/" + data.klasse + "/fahrer/" + data.name] = negativ ? null : fahrer
	updates["allgemein/saisons/details/" + laufend + "/anzahlFahrer"] = increment
	updates["allgemein/saisons/details/" + laufend + "/schulen/details/" + data.schule + "/anzahlFahrer"] = increment
	updates["allgemein/anzahlFahrer"] = increment
	await datenbank.ref().update(updates)
}

const passeAnzahlFahrerAnRef = functions.region(region).database.ref("/spezifisch/fahrer/{fahrer}")
export const increment = passeAnzahlFahrerAnRef.onCreate((snap, context) => passeAnzahlFahrerAn(snap.val(), context.params.fahrer))
export const decrement = passeAnzahlFahrerAnRef.onDelete((snap, context) => passeAnzahlFahrerAn(snap.val(), context.params.fahrer, true))
