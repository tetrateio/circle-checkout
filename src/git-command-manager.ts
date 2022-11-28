import * as io from '@actions/io'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fsHelper from './fs-helper'
import {GitVersion} from './git-version'

// Auth header not supported before 2.9
// Wire protocol v2 not supported before 2.18
export const MinimumGitVersion = new GitVersion('2.18')

export interface IGitCommandManager {
  init(): Promise<void>
  remoteAdd(remoteName: string, remoteUrl: string): Promise<void>
  fetch(ref: string): Promise<void>
  checkout(ref: string, startPoint: string): Promise<void>
  log1(format?: string): Promise<string>
}

export async function createCommandManager(
  workingDirectory: string
): Promise<IGitCommandManager> {
  return await GitCommandManager.createCommandManager(workingDirectory)
}

class GitCommandManager {
  // See: this.execGit where this env is being used.
  private gitEnv = {
    GIT_TERMINAL_PROMPT: '0', // Disable git prompt
    GCM_INTERACTIVE: 'Never' // Disable prompting for git credential manager
  }
  private gitPath = ''
  private workingDirectory = ''
  // Private constructor; use createCommandManager()
  private constructor() {}

  static async createCommandManager(
    workingDirectory: string
  ): Promise<GitCommandManager> {
    const result = new GitCommandManager()
    await result.initializeCommandManager(workingDirectory)
    return result
  }

  private async initializeCommandManager(
    workingDirectory: string
  ): Promise<void> {
    this.workingDirectory = workingDirectory
    this.gitEnv['GIT_LFS_SKIP_SMUDGE'] = '1'
    this.gitPath = await io.which('git', true)
    core.debug('Getting git version')
    let gitVersion = new GitVersion()
    let gitOutput = await this.execGit(['version'])
    let stdout = gitOutput.stdout.trim()
    if (!stdout.includes('\n')) {
      const match = stdout.match(/\d+\.\d+(\.\d+)?/)
      if (match) {
        gitVersion = new GitVersion(match[0])
      }
    }
    if (!gitVersion.isValid()) {
      throw new Error('Unable to determine git version')
    }
    // Minimum git version
    if (!gitVersion.checkMinimum(MinimumGitVersion)) {
      throw new Error(
        `Minimum required git version is ${MinimumGitVersion}. Your git ('${this.gitPath}') is ${gitVersion}`
      )
    }
    // Set the user agent
    const gitHttpUserAgent = `git/${gitVersion} (tetrate-circleci-checkout)`
    core.debug(`Set git useragent to: ${gitHttpUserAgent}`)
    this.gitEnv['GIT_HTTP_USER_AGENT'] = gitHttpUserAgent
  }

  async init(): Promise<void> {
    await this.execGit(['init', this.workingDirectory])
  }

  async remoteAdd(remoteName: string, remoteUrl: string): Promise<void> {
    await this.execGit(['remote', 'add', remoteName, remoteUrl])
  }

  async fetch(ref: string): Promise<void> {
    await this.execGit([
      '-c',
      'protocol.version=2',
      'fetch',
      '--force',
      'origin',
      `+refs/${ref}:refs/remotes/origin/${ref}`
    ])
  }

  async checkout(ref: string, startPoint: string): Promise<void> {
    const args = ['checkout', '--progress', '--force']
    if (startPoint) {
      args.push('-B', ref, startPoint)
    } else {
      args.push(ref)
    }

    await this.execGit(args)
  }

  async log1(format?: string): Promise<string> {
    let args = format ? ['log', '-1', format] : ['log', '-1']
    let silent = format ? false : true
    const output = await this.execGit(args, false, silent)
    return output.stdout
  }

  private async execGit(
    args: string[],
    allowAllExitCodes = false,
    silent = false
  ): Promise<GitOutput> {
    fsHelper.directoryExistsSync(this.workingDirectory, true)

    const result = new GitOutput()

    const env = {}
    for (const key of Object.keys(process.env)) {
      env[key] = process.env[key]
    }
    for (const key of Object.keys(this.gitEnv)) {
      env[key] = this.gitEnv[key]
    }

    const stdout: string[] = []

    const options = {
      cwd: this.workingDirectory,
      env,
      silent,
      ignoreReturnCode: allowAllExitCodes,
      listeners: {
        stdout: (data: Buffer) => {
          stdout.push(data.toString())
        }
      }
    }

    result.exitCode = await exec.exec(`"${this.gitPath}"`, args, options)
    result.stdout = stdout.join('')
    return result
  }
}

class GitOutput {
  stdout = ''
  exitCode = 0
}
