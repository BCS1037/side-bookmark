import json, urllib.request, urllib.error, base64, os
token = os.popen("/opt/homebrew/bin/gh auth token").read().strip()
headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json"}

new_plugin = {
  "id": "side-bookmark",
  "name": "Side Bookmark",
  "author": "bcs1037",
  "description": "A sidebar bookmark browser. Browse websites and manage bookmarks right in the sidebar.",
  "repo": "BCS1037/side-bookmark"
}

try:
    # 1. Fetch latest community-plugins.json from obsidianmd master
    req_master = urllib.request.Request("https://api.github.com/repos/obsidianmd/obsidian-releases/contents/community-plugins.json?ref=master", headers=headers)
    with urllib.request.urlopen(req_master) as res:
        master_file = json.loads(res.read().decode())
        master_content = base64.b64decode(master_file["content"]).decode()
        master_data = json.loads(master_content)
    
    # 2. Add our plugin (if not already there)
    master_data = [p for p in master_data if p.get("id") != "side-bookmark"]
    master_data.append(new_plugin)
    
    # Sort plugins by id (Obsidian guidelines say append to bottom, but to avoid conflict differences let's just append)
    new_content_bytes = json.dumps(master_data, indent=2).encode()
    # Add a newline at the end because obsidian uses prettier
    new_content_bytes += b'\n'
    new_content_b64 = base64.b64encode(new_content_bytes).decode()
    
    # 3. Get the file sha in our PR branch to know what we're replacing
    req_pr = urllib.request.Request("https://api.github.com/repos/BCS1037/obsidian-releases/contents/community-plugins.json?ref=add-side-bookmark-plugin", headers=headers)
    with urllib.request.urlopen(req_pr) as res:
        pr_file = json.loads(res.read().decode())
        pr_sha = pr_file["sha"]

    # 4. PUT the file to our PR branch with the merged content
    update_payload = {
        "message": "chore: resolve conflict by syncing with master",
        "content": new_content_b64,
        "sha": pr_sha,
        "branch": "add-side-bookmark-plugin"
    }
    req_put = urllib.request.Request(
        "https://api.github.com/repos/BCS1037/obsidian-releases/contents/community-plugins.json",
        data=json.dumps(update_payload).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req_put) as res_put:
        print("Successfully resolved conflict and updated file via API.")
        
except Exception as e:
    import traceback
    traceback.print_exc()
    if hasattr(e, 'read'):
        print("Response body:", e.read().decode())
