import {onValue, push, ref, serverTimestamp, set} from "firebase/database";
import {Authentifizierung} from "../authentifizierung/authentifizierung";
import {Datenbank} from "./datenbank";
import FahrerAuthentifizierung from "../authentifizierung/fahrerAuthentifizierung";
import Route from "../../model/route";

/**
 *
 * @param schule
 * @param klasse
 * @param name
 * @return id ID des existierenden Fahrers
 */
function fahrerBekommen(schule: string, klasse: string, name: string): Promise<string | null> {
	const ref = ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/fahrer/" + name)
	return new Promise(resolve =>
		onValue(ref, snap => resolve(snap.val()), {onlyOnce: true}))
}

/**
 *
 * @param schule
 * @param klasse
 * @param name
 * @return id ID des neuen Fahrers
 */
function fahrerErstellen(schule: string, klasse: string, name: string): Promise<string> {
	const ref = ref(Datenbank.datenbank, "spezifisch/fahrer");
	return push(ref, {schule, klasse, name}).then(({key}) => key)
}

/**
 *
 * @param fahrer
 * @param strecke
 * @return id ID der neuen Strecke
 */
function streckeErstellen(fahrer: string, strecke: number): Promise<string> {
	return push(ref(Datenbank.datenbank, "spezifisch/strecken"), {
		fahrer,
		strecke,
		zeitpunkt: serverTimestamp()
	}).then(({key}) => key)
}

function routeErstellen(strecke: string, route: Route) {
	return set(ref(Datenbank.datenbank, "spezifisch/routen/" + strecke), route)
}

export async function eintragen(
	laenge: number,
	name: string,
	route?: Route
) {
	if (!Authentifizierung.authentifizierung.autorisiertEinzutragen)
		throw new Error("Authentifizierung ist nicht ausreichend.")

	const {schule, klasse} = Authentifizierung.authentifizierung as FahrerAuthentifizierung

	const fahrer = await fahrerBekommen(schule, klasse, name) || await fahrerErstellen(schule, klasse, name)
	const strecke = await streckeErstellen(fahrer, laenge)

	if (route) {
		// TODO überlegen: sind immer beide Orte gegeben? entsprechend spezifisch/orte updaten...
		await routeErstellen(strecke, route)
	}
}
