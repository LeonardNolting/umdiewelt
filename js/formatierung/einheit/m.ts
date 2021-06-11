export default (wert: number): { wert: number, einheit: string } => Math.abs(wert) >= 2000 ? {
	wert: wert / 1000,
	einheit: "km"
} : {wert, einheit: "m"}
