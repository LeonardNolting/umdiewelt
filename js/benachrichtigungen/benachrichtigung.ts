import benachrichtigungen from "./benachrichtigungen";
import BenachrichtigungsLevel from "./benachrichtigungsLevel";
import BenachrichtigungsOptionen from "./benachrichtigungsOptionen";

let init = false
export default function benachrichtigung(
	nachricht: string,
	level: BenachrichtigungsLevel = BenachrichtigungsLevel.INFO,
	optionen: BenachrichtigungsOptionen = {}
) {
	if (!init) {
		init = true
		import('@fortawesome/fontawesome-free/css/solid.min.css')
		import('@fortawesome/fontawesome-free/css/fontawesome.min.css')
		import('awesome-notifications/dist/style.css')
	}
	return benachrichtigungen[level](nachricht, optionen)
}
