import {umfang} from "../konfiguration";

export default (strecke: number) => {
	const nachricht1 = document.getElementById("nachricht");
	const nachricht2 = document.getElementById("nachricht3");

	const show = (el: HTMLElement) => el.classList.add("sichtbar"),
		hide = (el: HTMLElement) => el.classList.remove("sichtbar")

	if (strecke < umfang) {
		hide(nachricht1)
		hide(nachricht2)
	} else if (strecke < 2 * umfang) {
		show(nachricht1)
		hide(nachricht2)
	} else {
		hide(nachricht1)
		show(nachricht2)
	}
}
