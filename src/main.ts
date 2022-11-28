import * as path from 'path'
import * as core from '@actions/core'
import * as coreCommand from '@actions/core/lib/command'
import * as gitSourceProvider from './git-source-provider'
import * as inputHelper from './input-helper'
import * as stateHelper from './state-helper'

async function run(): Promise<void> {
  try {
    const sourceSettings = await inputHelper.getInputs()

    try {
      // Register problem matcher
      coreCommand.issueCommand(
        'add-matcher',
        {},
        path.join(__dirname, 'problem-matcher.json')
      )
    } finally {
      // Register problem matcher
      coreCommand.issueCommand(
        'add-matcher',
        {},
        path.join(__dirname, 'problem-matcher.json')
      )
    }
    await gitSourceProvider.getSource(sourceSettings)
  } catch (error) {
    core.setFailed(`${(error as any)?.message ?? error}`)
  }
}
async function cleanup(): Promise<void> {}

// Main
if (!stateHelper.IsPost) {
  run()
}
// Post
else {
  cleanup()
}
