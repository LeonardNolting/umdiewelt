import quellen from "./quellen";
import faktenVorbereiten from "./fakten";
import step from "../step";
import cookies from "./cookies";

const observer = new IntersectionObserver(((eintraege, observer) => {
	eintraege.filter(eintrag => eintrag.isIntersecting).forEach(eintrag => {
		eintrag.target.classList.add("gesehen")
		observer.unobserve(eintrag.target)
	})
}), {
	// rootMargin: "0px 0px -10% 0px"

	/*rootMargin: '0px 0px -10px 0px',
	threshold: 0.5*/

	rootMargin: '0px 0px -50px 0px',
	threshold: 0.3
})

export default () => {
	step("Lädt Inhalt")

	document.querySelectorAll("#inhalt .verspaetet").forEach(element => observer.observe(element))

	cookies()
	faktenVorbereiten(...document.getElementById("fakten-anzeige").querySelector("section").querySelectorAll("data"))
	quellen()
}
