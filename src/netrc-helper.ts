import * as os from 'os'
import * as path from 'path'
import {constants, promises as fs} from 'fs'
import {IGitSourceSettings} from './git-source-settings'

async function checkPermissions(p: string): Promise<void> {
  if (process.platform != 'linux' && process.platform != 'darwin') {
    return
  }
  try {
    const stat = await fs.stat(p)
    if (process.getuid && stat.uid != process.getuid()) {
      throw new Error('~/.netrc file owner does not match current user')
    }
    if (stat.mode & (constants.S_IRWXG | constants.S_IRWXO)) {
      throw new Error(
        '~/.netrc access too permissive: ' +
          'access permissions must restrict access to only the owner'
      )
    }
  } catch (err) {
    if (isErrnoException(err) && err.code == 'ENOENT') return
    else throw err
  }
}

function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  if ('code' in (e as any)) return true
  else return false
}

export async function createNetrc(settings: IGitSourceSettings): Promise<void> {
  const line = `machine github.com login ${settings.actor} password ${settings.token}\n`
  const netrc = path.resolve(os.homedir(), '.netrc')
  await checkPermissions(netrc)
  await fs.writeFile(netrc, line, {flag: 'a', mode: 0o600})
}
