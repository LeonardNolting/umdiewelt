import {fahrer} from "../firebase/lesen";

export default () => {
	// Eintragen autocomplete
	const datalist = document.getElementById("eintragen-fahrer")
	Object.keys(fahrer).forEach(fahrer => datalist.append(new Option(undefined, fahrer)))

	// Carousel ...
}
