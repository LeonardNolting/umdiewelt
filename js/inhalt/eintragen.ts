import {Eintragung} from "../eintragen";

const element = document.getElementById("eintragen") as HTMLDivElement & { dataset: { text: string } }

export default () => {
	document.getElementById("eintragen-shortcut").addEventListener("click", () => Eintragung.eintragen())
	element.addEventListener("click", () => Eintragung.eintragen())
}

export const eintragenTextSetzen = (text: string | null) => {
	/*if (text === null) delete element.dataset.text
	else element.dataset.text = text*/
}
