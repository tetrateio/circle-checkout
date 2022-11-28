export interface IGitSourceSettings {
  /**
   * The location on disk where the repository will be placed
   */
  repositoryPath: string

  /**
   * The repository owner
   */
  repositoryOwner: string

  /**
   * The repository name
   */
  repositoryName: string

  /**
   * ref
   */
  ref: string

  /**
   * The commit to checkout
   */
  commit: string

  /**
   * The current actor
   */
  actor: string

  /**
   * The current token
   */
  token: string
}
