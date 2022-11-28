import * as path from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fsHelper from './fs-helper'
import * as workflowContextHelper from './workflow-context-helper'
import {IGitSourceSettings} from './git-source-settings'

export async function getInputs(): Promise<IGitSourceSettings> {
  const result = ({} as unknown) as IGitSourceSettings

  // GitHub workspace
  let githubWorkspacePath = process.env['GITHUB_WORKSPACE']
  if (!githubWorkspacePath) {
    throw new Error('GITHUB_WORKSPACE not defined')
  }
  githubWorkspacePath = path.resolve(githubWorkspacePath)
  core.debug(`GITHUB_WORKSPACE = '${githubWorkspacePath}'`)
  fsHelper.directoryExistsSync(githubWorkspacePath, true)

  // Qualified repository
  const qualifiedRepository =
    core.getInput('repository') ||
    `${github.context.repo.owner}/${github.context.repo.repo}`
  core.debug(`qualified repository = '${qualifiedRepository}'`)
  const splitRepository = qualifiedRepository.split('/')
  if (
    splitRepository.length !== 2 ||
    !splitRepository[0] ||
    !splitRepository[1]
  ) {
    throw new Error(
      `Invalid repository '${qualifiedRepository}'. Expected format {owner}/{repo}.`
    )
  }
  result.repositoryOwner = splitRepository[0]
  result.repositoryName = splitRepository[1]

  // Repository path
  result.repositoryPath = core.getInput('path') || '.'
  result.repositoryPath = path.resolve(
    githubWorkspacePath,
    result.repositoryPath
  )
  if (
    !(result.repositoryPath + path.sep).startsWith(
      githubWorkspacePath + path.sep
    )
  ) {
    throw new Error(
      `Repository path '${result.repositoryPath}' is not under '${githubWorkspacePath}'`
    )
  }

  // Credentials for .netrc.
  result.actor = core.getInput('actor')
  result.token = core.getInput('token')

  // TODO(dio): Currently, we don't support pull_request "closed" event.
  // Note: in "closed" event, the ref from github.context is unqualifed like
  // "main" instead of "refs/heads/main".
  result.ref = github.context.ref
    .replace('refs/', '')
    .replace('/merge', '/head')
  result.commit = (await workflowContextHelper.getAfterSha()) || ''
  return result
}
