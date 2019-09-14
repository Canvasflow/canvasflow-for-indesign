workflow "Test my code" {
  on = "push"
  resolves = ["npm test"]
}

action "npm test" {
  runs = "npm"
  args = "test"
}