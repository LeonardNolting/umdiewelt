import {Eintragung} from "../eintragen";

const div = document.getElementById("mitwirken") as HTMLDivElement & { dataset: { text: string } }

export default () => div.addEventListener("click", () => Eintragung.eintragen())

export const mitwirkenTextSetzen = (text: string | null) => {
	if (text === null) delete div.dataset.text
	else div.dataset.text = text
}
