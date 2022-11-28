# Circle Checkout V1

This actions checks out your repository under `$GITHUB_WORKSPACE`, so your workflow can access it.

The way it does `git fetching` follows CircleCI's checkout approach. Hence `git describe --tags --long` works fine. Also, when we do PR, the "current commit SHA" will be the same as the latest pushed commit for that PR.
