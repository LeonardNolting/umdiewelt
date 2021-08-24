const toLoad: Promise<any>[] = []

export default async function (wert: Promise<void> | void) {
	const promise = new Promise(async resolve => {
		await wert
		resolve()
	})
	document.wait = true
	toLoad.push(promise)
	promise.finally(() => {
		toLoad.splice(toLoad.indexOf(promise), 1)
		if (toLoad.length === 0) document.wait = false
	})
}
