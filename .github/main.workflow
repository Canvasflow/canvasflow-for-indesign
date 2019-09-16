workflow "Build" {
  on = "push"
  resolves = ["npm build"]
}

action "npm ci" {
  uses = "docker://node:alpine"
  runs = "npm"
  args = "ci"
}

action "npm build" {
  needs = "npm ci"
  uses = "docker://node:alpine"
  runs = "npm"
  args = "build"
}