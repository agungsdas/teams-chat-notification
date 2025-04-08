const github = require('@actions/github');
const axios = require('axios');
const { capitalCase } = require('change-case');

const statusColorPalette = {
  success: "Good",   
  cancelled: "Warning",
  failure: "Attention"
};

const statusText = {
  success: "Succeeded",
  cancelled: "Cancelled",
  failure: "Failed"
};

const notify = async (name, url, status, testflight, firebase, registerFirebase) => {
  const { owner, repo } = github.context.repo;
  const { eventName, sha, ref } = github.context;
  const { number } = github.context.issue;

  const repoUrl = `https://github.com/${owner}/${repo}`;
  const eventPath = eventName === 'pull_request' ? `/pull/${number}` : `/commit/${sha}`;
  const eventUrl = `${repoUrl}${eventPath}`;
  const checksUrl = `${repoUrl}/actions/runs/${github.context.runId}`;

  let committerName = "";
  let committerEmail = "";
  let message = "";
  let environment = ref || "undefined";

  if (github.context.eventName === "push") {
    const pushPayload = github.context.payload || {};
    committerName = pushPayload.commits?.[0]?.committer?.name || "Unknown";
    committerEmail = pushPayload.commits?.[0]?.committer?.email || "-";
    message = pushPayload.commits?.[0]?.message || "-";
  }

  if (environment.toLowerCase().includes("dev")) environment = "Dev";
  if (environment.toLowerCase().includes("staging") || environment.toLowerCase().includes("release") || environment.toLowerCase().includes("hotfix")) environment = "Staging";
  if (environment.toLowerCase().includes("production") || environment.toLowerCase().includes("master") || environment.toLowerCase().includes("main")) environment = "Production";
  if (environment.toLowerCase().includes("non-production") || environment.toLowerCase().includes("nonproduction")) environment = "Non Production";

  const body = {
    name,
    statusText: statusText[status],
    color: statusColorPalette[status],
    repo: capitalCase(repo),
    repoUrl,
    eventUrl,
    checksUrl,
    message,
    committerName,
    committerEmail,
    environment,
    testflight,
    firebase,
    registerFirebase,
  };

  const response = await axios.post(url, body);
  if (![200, 202].includes(response.status)) {
    throw new Error(`Teams notification failed. Response status=${response.status}`);
  }
};

module.exports = {
  notify
};
