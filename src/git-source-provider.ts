import * as io from '@actions/io'
import * as core from '@actions/core'
import * as fsHelper from './fs-helper'
import * as urlHelper from './url-helper'
import * as gitCommandManager from './git-command-manager'
import * as netrcHelper from './netrc-helper'
import {IGitSourceSettings} from './git-source-settings'
import {IGitCommandManager} from './git-command-manager'

export async function getSource(settings: IGitSourceSettings): Promise<void> {
  // Repository URL
  core.info(
    `Syncing repository: ${settings.repositoryOwner}/${settings.repositoryName}`
  )
  // Remove conflicting file path
  if (fsHelper.fileExistsSync(settings.repositoryPath)) {
    await io.rmRF(settings.repositoryPath)
  }
  await io.mkdirP(settings.repositoryPath)

  // Git command manager
  core.startGroup('Getting Git version info')
  const git = await getGitCommandManager(settings)
  core.endGroup()

  // Set .netrc for accessing current actor's repository
  core.startGroup('Setting up access')
  await netrcHelper.createNetrc(settings)
  core.endGroup()

  if (git) {
    const repositoryUrl = urlHelper.getFetchUrl(settings)

    core.startGroup(`Initializing the repository ${repositoryUrl}`)
    await git.init()
    await git.remoteAdd('origin', repositoryUrl)
    core.endGroup()

    core.startGroup('Fetching the repository')
    await git.fetch(settings.ref)
    core.endGroup()

    core.startGroup('Checking out the ref')
    await git.checkout(settings.ref, settings.commit)
    core.endGroup()

    await git.log1("--format='%H'")
  }
  // TODO(dio): Handle if git is not initialized
}

async function getGitCommandManager(
  settings: IGitSourceSettings
): Promise<IGitCommandManager | undefined> {
  core.info(`Working directory is '${settings.repositoryPath}'`)
  try {
    return await gitCommandManager.createCommandManager(settings.repositoryPath)
  } catch (err) {
    // Otherwise fallback to REST API
    return undefined
  }
}
