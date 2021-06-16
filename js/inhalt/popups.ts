import Popup from "../popup";

export default () => {
	Popup.hintergrund.addEventListener("click", () => {
		Popup.alleSchliessen()
	})
}
