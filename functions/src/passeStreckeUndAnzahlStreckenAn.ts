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
	updates["spezifisch/fahrer/" + fahrer + "/strecke"] = streckeIncrement
	updates["spezifisch/fahrer/" + fahrer + "/anzahlStrecken"] = anzahlStreckenIncrement
	updates["spezifisch/klassen/details/" + schule + "/" + klasse + "/strecke"] = streckeIncrement
	updates["spezifisch/klassen/details/" + schule + "/" + klasse + "/anzahlStrecken"] = anzahlStreckenIncrement
	updates["allgemein/saisons/details/" + laufend + "/strecke"] = streckeIncrement
	updates["allgemein/saisons/details/" + laufend + "/anzahlStrecken"] = anzahlStreckenIncrement
	updates["allgemein/saisons/details/" + laufend + "/schulen/details/" + schule + "/strecke"] = streckeIncrement
	updates["allgemein/saisons/details/" + laufend + "/schulen/details/" + schule + "/anzahlStrecken"] = anzahlStreckenIncrement
	updates["allgemein/strecke"] = streckeIncrement
	updates["allgemein/anzahlStrecken"] = anzahlStreckenIncrement
	await datenbank.ref().update(updates)
}

const passeStreckeUndAnzahlStreckenAnRef = functions.region(region).database.ref("/spezifisch/strecken/{strecke}")
export const increment = passeStreckeUndAnzahlStreckenAnRef.onCreate(snap => passeStreckeUndAnzahlStreckenAn(snap.val()))
export const decrement = passeStreckeUndAnzahlStreckenAnRef.onDelete(snap => passeStreckeUndAnzahlStreckenAn(snap.val(), true))
