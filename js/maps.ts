import step from "./step";
import {Loader} from "@googlemaps/js-api-loader";
import {apiSchluessel as apiKey, region, sprache as language, version} from "./konfiguration";

export default () => {
	step("Lädt Google Maps")

	return new Loader({apiKey, version, language, region, libraries: ["places"]}).load()
}
