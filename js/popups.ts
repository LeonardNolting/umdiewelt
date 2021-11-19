import {Popup} from "./popup";

export default () => {
	Popup.hintergrund.addEventListener("click", () => {
		if (!Popup.offenes().classList.contains("wichtig"))
			Popup.alleSchliessen()
	})
}
