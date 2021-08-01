import benachrichtigungen from "./benachrichtigungen";
import BenachrichtigungsLevel from "./benachrichtigungsLevel";
import BenachrichtigungsOptionen from "./benachrichtigungsOptionen";

export default function benachrichtigung(
	nachricht: string,
	level: BenachrichtigungsLevel = BenachrichtigungsLevel.INFO,
	optionen: BenachrichtigungsOptionen = {}
) {
	return benachrichtigungen[level](nachricht, optionen)
}
