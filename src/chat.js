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

const textButton = (text, url) => ({
  "@type": "OpenUri",
  "name": text,
  "targets": [{ "os": "default", "uri": url }]
});

const notify = async (name, url, status) => {
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
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": statusColorPalette[status],
    "summary": `${name} - ${statusText[status]}`,
    "sections": [
      {
        "activityTitle": `**${name}** - ${statusText[status]}`,
        "activitySubtitle": `Repository: [${capitalCase(repo)}](${repoUrl})`,
        "activityImage": "https://lh4.googleusercontent.com/proxy/rsAS0A1vd7G_oSylcCJEk6mhEup0sXYUKPU8M822YtQYPPa7sqIfMzKfg0X4sZa5WQ2FiO-HkgTsYg",
        "facts": [
          { "name": "Changes:", "value": message },
          ...(committerName ? [{ "name": "Updated by:", "value": `${committerName} (${committerEmail})` }] : []),
          { "name": "Environment:", "value": environment }
        ],
        "markdown": true
      }
    ],
    "potentialAction": [
      textButton("Open Repository", repoUrl),
      textButton("Open Commit", eventUrl),
      textButton("Open Workflow", checksUrl)
    ]
  };

  const response = await axios.post(url, body);
  if (response.status !== 200) {
    throw new Error(`Teams notification failed. Response status=${response.status}`);
  }
};

module.exports = {
  notify
};
