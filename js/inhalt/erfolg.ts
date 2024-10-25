import {umfang} from "../konfiguration";

export default (strecke: number) => {
	const nachricht1 = document.getElementById("nachricht");
	const nachricht2 = document.getElementById("nachricht3");
	const nachricht3 = document.getElementById("nachricht5");

	const show = (el: HTMLElement) => el.classList.add("sichtbar"),
		hide = (el: HTMLElement) => el.classList.remove("sichtbar")

	if (strecke < umfang) {
		hide(nachricht1)
		hide(nachricht2)
		hide(nachricht3)
	} else if (strecke < 2 * umfang) {
		show(nachricht1)
		hide(nachricht2)
		hide(nachricht3)
	} else if (strecke < 3 * umfang) {
		hide(nachricht1)
		show(nachricht2)
		hide(nachricht3)
	} else {
		hide(nachricht1)
		hide(nachricht2)
		show(nachricht3)
	}
}
