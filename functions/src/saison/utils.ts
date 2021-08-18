import {region} from "../init";

export const project = JSON.parse(process.env.FIREBASE_CONFIG!).projectId
export const queueName = 'countdowns'
export const url = (functionName: string) => `https://${region}-${project}.cloudfunctions.net/${functionName}`
export const seconds = (datum: number) => (datum - Date.now()) / 1000
