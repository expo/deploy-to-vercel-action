import * as core from '@actions/core'
import { exec, removeSchema } from './helpers.js'

import config from './config.js'

const {
	VERCEL_TOKEN,
	PRODUCTION,
	VERCEL_SCOPE,
	VERCEL_ORG_ID,
	VERCEL_PROJECT_ID,
	SHA,
	USER,
	REPOSITORY,
	REF,
	TRIM_COMMIT_MESSAGE,
	BUILD_ENV,
	PREBUILT,
	WORKING_DIRECTORY,
	FORCE
} = config

const init = () => {
	core.info('Setting environment variables for Vercel CLI')
	core.exportVariable('VERCEL_ORG_ID', VERCEL_ORG_ID)
	core.exportVariable('VERCEL_PROJECT_ID', VERCEL_PROJECT_ID)

	let deploymentUrl

	const deploy = async (commit) => {
		let commandArguments = [ `--token=${ VERCEL_TOKEN }` ]

		if (VERCEL_SCOPE) {
			commandArguments.push(`--scope=${ VERCEL_SCOPE }`)
		}

		if (PRODUCTION) {
			commandArguments.push('--prod')
		}

		if (PREBUILT) {
			commandArguments.push('--prebuilt')
		}

		if (FORCE) {
			commandArguments.push('--force')
		}

		if (commit) {
			const metadata = [
				`githubCommitAuthorName=${ commit.authorName }`,
				`githubCommitAuthorLogin=${ commit.authorLogin }`,
				`githubCommitMessage=${ TRIM_COMMIT_MESSAGE ? commit.commitMessage.split(/\r?\n/)[0] : commit.commitMessage }`,
				`githubCommitOrg=${ USER }`,
				`githubCommitRepo=${ REPOSITORY }`,
				`githubCommitRef=${ REF }`,
				`githubCommitSha=${ SHA }`,
				`githubOrg=${ USER }`,
				`githubRepo=${ REPOSITORY }`,
				`githubDeployment=1`
			]

			metadata.forEach((item) => {
				commandArguments = commandArguments.concat([ '--meta', item ])
			})
		}

		if (BUILD_ENV) {
			BUILD_ENV.forEach((item) => {
				commandArguments = commandArguments.concat([ '--build-env', item ])
			})
		}

		core.info('Starting deploy with Vercel CLI')
		const output = await exec('vercel', commandArguments, WORKING_DIRECTORY)
		const parsed = output.match(/(?<=https?:\/\/)(.*)/g)[0]

		if (!parsed) throw new Error('Could not parse deploymentUrl')

		deploymentUrl = parsed

		return deploymentUrl
	}

	const assignAlias = async (aliasUrl) => {
		const commandArguments = [ `--token=${ VERCEL_TOKEN }`, 'alias', 'set', deploymentUrl, removeSchema(aliasUrl) ]

		if (VERCEL_SCOPE) {
			commandArguments.push(`--scope=${ VERCEL_SCOPE }`)
		}

		const output = await exec('vercel', commandArguments, WORKING_DIRECTORY)

		return output
	}

	const getDeployment = async () => {
		const url = `https://api.vercel.com/v11/now/deployments/get?url=${ deploymentUrl }`
		const options = {
			headers: {
				Authorization: `Bearer ${ VERCEL_TOKEN }`
			}
		}

		const res = await fetch(url, options)

		if (!res.ok) {
			throw new Error(`Vercel API request failed with status ${ res.status }`)
		}

		return res.json()
	}

	return {
		deploy,
		assignAlias,
		deploymentUrl,
		getDeployment
	}
}

export { init }