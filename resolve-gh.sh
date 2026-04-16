#!/bin/bash
set -e

echo "1. Fetching master JSON via gh api..."
/opt/homebrew/bin/gh api repos/obsidianmd/obsidian-releases/contents/community-plugins.json?ref=master --jq .content | base64 --decode > master.json

echo "2. Injecting our plugin into JSON..."
/usr/bin/python3 -c "
import json
with open('master.json') as f:
    data = json.load(f)
data = [p for p in data if p.get('id') != 'side-bookmark']
data.append({
    'id': 'side-bookmark',
    'name': 'Side Bookmark',
    'author': 'bcs1037',
    'description': 'A sidebar bookmark browser. Browse websites and manage bookmarks right in the sidebar.',
    'repo': 'BCS1037/side-bookmark'
})
with open('master_new.json', 'w') as f:
    json.dump(data, f, indent=2)
"
echo "" >> master_new.json

echo "3. Fetching PR branch SHA..."
SHA=$(/opt/homebrew/bin/gh api repos/BCS1037/obsidian-releases/contents/community-plugins.json?ref=add-side-bookmark-plugin --jq .sha)

echo "4. Building payload.json..."
/usr/bin/python3 -c "
import json, base64
with open('master_new.json', 'rb') as f:
    content = f.read()
b64 = base64.b64encode(content).decode('utf-8')
payload = {
    'message': 'chore: resolve merge conflict with master',
    'content': b64,
    'sha': '$SHA',
    'branch': 'add-side-bookmark-plugin'
}
with open('payload.json', 'w') as f:
    json.dump(payload, f)
"

echo "5. PUTting resolved file to PR branch via gh api..."
/opt/homebrew/bin/gh api -X PUT repos/BCS1037/obsidian-releases/contents/community-plugins.json --input payload.json

echo "Done!"
