workflow "Build " {
  on = "push"
  resolves = ["npm build"]
}

action "npm ci" {
  runs = "npm"
  args = "ci"
}

action "npm build" {
  needs = "npm ci"
  runs = "npm"
  args = "run build"
}