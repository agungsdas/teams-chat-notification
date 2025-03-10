const github = require('@actions/github');
const axios = require('axios');
const { capitalCase } = require('change-case');

const statusColorPalette = {
  success: "#2cbe4e",
  cancelled: "#ffc107",
  failure: "#ff0000"
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
  const checksUrl = `${repoUrl}/actions/runs/${ github.context.runId }`;

  let committerName = ''
  let committerEmail = ''
  let message = ''
  let environment = ref || 'undefined'

  if (github.context.eventName === 'push') {
    const pushPayload = github.context.payload || {}
    committerName = pushPayload.commits?.[0]?.committer?.name
    committerEmail = pushPayload.commits?.[0]?.committer?.email
    message = pushPayload.commits?.[0]?.message
  }

  if (environment.toLowerCase().includes('dev')) {
    environment = 'Dev'
  }
  if (environment.toLowerCase().includes('staging') || environment.toLowerCase().includes('release') || environment.toLowerCase().includes('hotfix')) {
    environment = 'Staging'
  }
  if (environment.toLowerCase().includes('production') || environment.toLowerCase().includes('master') || environment.toLowerCase().includes('main')) {
    environment = 'Production'
  }
  if (environment.toLowerCase().includes('non-production') || environment.toLowerCase().includes('nonproduction')) {
    environment = 'Non Production'
  }

  const body = {
    "type": "message",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": {
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          "type": "AdaptiveCard",
          "version": "1.4",
          "body": [
            {
              "type": "TextBlock",
              "text": `**${name}** <font color="${statusColorPalette[status]}">${statusText[status]}</font>`,
              "wrap": true,
              "size": "Large",
              "weight": "Bolder"
            },
            {
              "type": "FactSet",
              "facts": [
                {
                  "title": "Repository:",
                  "value": `[${capitalCase(repo)}](${repoUrl})`
                },
                {
                  "title": "Changes:",
                  "value": message
                },
                ...(committerName ? [{
                  "title": "Updated by:",
                  "value": `${committerName} (${committerEmail})`
                }] : []),
                {
                  "title": "Environment:",
                  "value": environment
                }
              ]
            }
          ],
          "actions": [
            textButton("Open Repository", repoUrl),
            textButton("Open Commit", eventUrl),
            textButton("Open Workflow", checksUrl)
          ]
        }
      }
    ]
  };

  const response = await axios.default.post(url, body);
  if (response.status !== 200) {
    throw new Error(`Teams Chat notification failed. response status=${response.status}`);
  }
}

module.exports = {
  notify,
}