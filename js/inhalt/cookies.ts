import {Cookies} from "../cookies";

export default () => {
	document.getElementById("cookies").addEventListener("click",
		() => Cookies.fragen(true)
	)
}
