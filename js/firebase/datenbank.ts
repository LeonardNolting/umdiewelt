import {getAnalytics} from "firebase/analytics";
import {getDatabase, ref, Reference} from "firebase/database";
import step from "../step";

export let refs: {
	fahrer: Reference;
	strecken: Reference;
	bestimmt: {
		fahrer: (name: string) => Reference;
		strecken: (nummer: number) => Reference;
		routen: (nummer: number) => Reference
	};
	strecke: Reference
}

export default function datenbank() {
	step("Verbindet mit Datenbank")

	const analytics = getAnalytics()
	const datenbank = getDatabase()
	refs = {
		strecke: ref(datenbank, "strecke"),
		fahrer: ref(datenbank, "fahrer"),
		strecken: ref(datenbank, "strecken"),

		bestimmt: {
			fahrer: (name: string) => ref(datenbank, "fahrer/" + name),
			strecken: (nummer: number) => ref(datenbank, "strecken/" + nummer),
			routen: (nummer: number) => ref(datenbank, "routen/" + nummer)
		}
	}

	return datenbank
}
