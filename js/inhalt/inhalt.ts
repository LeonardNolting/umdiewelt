import quellen from "./quellen";
import step from "../step";
import cookies from "./cookies";
import admin from "./admin";
import eintragen from "./eintragen";
import streckenbeschreibungen from "./streckenbeschreibungen";

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

export const observerCheckIfVisible = new IntersectionObserver((eintraege, observer) => {
	eintraege.forEach(eintrag => {
		eintrag.target.classList[eintrag.isIntersecting ? "add" : "remove"]("isVisible")
	})
}, {
	root: null,
	rootMargin: "0px",
	threshold: [0]
})

export const observerCheckIfVisibleMargin = new IntersectionObserver((eintraege, observer) => {
	eintraege.forEach(eintrag => {
		eintrag.target.classList[eintrag.isIntersecting ? "add" : "remove"]("isVisibleMargin")
	})
}, {
	root: null,
	rootMargin: "50%",
	threshold: [0]
})

export default async () => {
	step("Lädt Inhalt")

	document.querySelectorAll("#inhalt .verspaetet").forEach(element => observer.observe(element))

	document.querySelectorAll(".checkIfVisible").forEach(element => observerCheckIfVisible.observe(element))
	document.querySelectorAll(".checkIfVisibleMargin").forEach(element => observerCheckIfVisibleMargin.observe(element))

	document.addEventListener('mousemove', e => {
		document.documentElement.style.setProperty("--mouse-x", (e.clientX / window.innerWidth).toFixed(3));
		document.documentElement.style.setProperty("--mouse-y", (e.clientY / window.innerHeight).toFixed(3));
	})

	cookies()
	quellen()
	eintragen()
	streckenbeschreibungen()
	admin()
}
