import quellen from "./quellen";
import {bereiteFaktenVor as fakten} from "./fakten";
import step from "../step";
import cookies from "./cookies";
import admin from "./admin";
import eintragen from "./eintragen";

export const observer = new IntersectionObserver(((eintraege, observer) => {
	eintraege.filter(eintrag => eintrag.isIntersecting).forEach(eintrag => {
		eintrag.target.classList.add("gesehen")
		observer.unobserve(eintrag.target)
	})
}), {
	// rootMargin: "0px 0px -10% 0px"

	/*rootMargin: '0px 0px -10px 0px',
	threshold: 0.5*/

	rootMargin: '0px 0px -150px 0px',
	threshold: 0.3
})

export default async () => {
	step("Lädt Inhalt")

	document.querySelectorAll("#inhalt .verspaetet").forEach(element => observer.observe(element))

	cookies()
	fakten(...document.getElementById("fakten").querySelectorAll("data"))
	quellen()
	eintragen()
	await admin()
}
