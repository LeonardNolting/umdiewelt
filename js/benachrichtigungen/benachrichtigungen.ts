// noinspection TypeScriptCheckImport
import AWN from "awesome-notifications"

const benachrichtigungen = new AWN({
	position: "bottom-left",
	maxNotifications: 4,
	labels: {
		tip: "Tipp",
		info: "Info",
		warning: "Achtung",
		success: "Erfolg",
		alert: "Fehler",
		async: "Lädt...",
	},
	messages: {
		async: "Bitte warten Sie einen Moment",
		"async-block": "Lädt..."
	}
})

export default benachrichtigungen
