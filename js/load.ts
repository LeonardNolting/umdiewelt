const toLoad: Promise<any>[] = []

export default async function (promise: Promise<void>) {
	document.wait = true
	toLoad.push(promise)
	promise.finally(() => {
		toLoad.splice(toLoad.indexOf(promise), 1)
		if (toLoad.length === 0) document.wait = false
	})
}
