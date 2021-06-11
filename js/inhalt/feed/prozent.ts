import m from "../../formatierung/einheit/m";
import zahl from "../../formatierung/zahl";

type FormulierungGenerator = (punkt: string, prozent: string, laenge: number) => string

// TODO emojis
const formulierungen: FormulierungGenerator[] = [
	(punkt: string, prozent: string) => `Wir haben ${prozent}% geschafft! Das entspricht etwa ${punkt}.`,
]

export default function (prozent: string, punkt: number, zufaelligerIndex: (length: number) => number): string {
	const punktFormatiert = m(punkt);
	return formulierungen[zufaelligerIndex(formulierungen.length)]!!(zahl(punktFormatiert.wert, 0) + " " + punktFormatiert.einheit, prozent, punkt)
}
