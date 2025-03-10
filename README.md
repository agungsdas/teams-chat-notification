# Teams Chat Notification for GitHub Actions
Sends a Teams Chat notification.

## Usage
### Parameters
|Name|Required|Description|
|:---:|:---:|:---|
|name|true|Job name. Used for notification titles.|
|url|true|Teams Chat Webhook URL.|
|status|true|Job status. Available values are `success`, `failure`, `cancelled`. We recommend using `${{ job.status }}`|

### Examples
```yaml
- name: Teams Chat Notification
  uses: agungsdas/teams-chat-notification@master
  with:
    name: Build
    url: ${{ secrets.TEAMS_CHAT_WEBHOOK }}
    status: ${{ job.status }}
  if: always()
```
