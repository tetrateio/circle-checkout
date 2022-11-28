import * as assert from 'assert'
import {IGitSourceSettings} from './git-source-settings'

export function getFetchUrl(settings: IGitSourceSettings): string {
  assert.ok(
    settings.repositoryOwner,
    'settings.repositoryOwner must be defined'
  )
  assert.ok(settings.repositoryName, 'settings.repositoryName must be defined')
  return `https://github.com/${settings.repositoryOwner}/${settings.repositoryName}.git`
}
