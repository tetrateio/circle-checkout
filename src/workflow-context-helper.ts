import * as fs from 'fs'
import * as core from '@actions/core'

/**
 * Gets the after SHA from an event.
 */
export async function getAfterSha(): Promise<string | undefined> {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH
    if (!eventPath) {
      core.debug(`GITHUB_EVENT_PATH is not defined`)
      return
    }
    const content = await fs.promises.readFile(eventPath, {encoding: 'utf8'})
    const event = JSON.parse(content)
    return event?.after || event?.pull_request?.head?.sha
  } catch (err) {
    core.debug(
      `Unable to load after SHA from GITHUB_EVENT_PATH: ${(err as any)
        .message || err}`
    )
  }
}
