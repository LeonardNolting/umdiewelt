export default (wert: number): { wert: number, einheit: string } => {
	if (Math.abs(wert) < 2) return {
		wert: wert * 1000,
		einheit: "g"
	}; else if (Math.abs(wert) >= 2000) return {
		wert: wert / 1000,
		einheit: "Tonnen"
	}; else return {
		wert, einheit: "kg"
	}
}
