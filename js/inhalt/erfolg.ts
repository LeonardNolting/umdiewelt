import {umfang} from "../konfiguration";

export default (strecke: number) => {
	document.getElementById("nachricht").classList[strecke >= umfang ? "add" : "remove"]("sichtbar")
}
