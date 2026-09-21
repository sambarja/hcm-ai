# Auto-push hook for hcm-ai-pm (one-time setup)

This installs a Claude Code hook that auto-commits and pushes after every edit to `hcm-ai-pm/`.
Claude cannot install this itself (harness blocks agents from modifying their own settings).

## Steps

1. Create the folder `c:\Users\Samu\OneDrive\Pictures\Documents\supervaise meeting notes\.claude\` if it doesn't exist.

2. Copy `settings.local.json.template` (in this same folder) to that new folder, renamed to `settings.local.json`:

   PowerShell one-liner:
   ```powershell
   New-Item -ItemType Directory -Force -Path "c:\Users\Samu\OneDrive\Pictures\Documents\supervaise meeting notes\.claude" | Out-Null
   Copy-Item "c:\Users\Samu\OneDrive\Pictures\Documents\supervaise meeting notes\HRIS\hcm-ai-pm\settings.local.json.template" "c:\Users\Samu\OneDrive\Pictures\Documents\supervaise meeting notes\.claude\settings.local.json"
   ```

3. In Claude Code, type `/hooks` and press Enter. This reloads the config so the hook becomes active this session. (Alternatively, restart Claude Code.)

4. Test: ask Claude to touch any file under `HRIS/hcm-ai-pm/`. You should see the status message "Auto-pushing hcm-ai-pm..." in the spinner. `git log` in that repo should show a new `auto: sync from claude code ...` commit.

## What the hook does

- Fires after every `Edit`, `Write`, or `MultiEdit` tool call
- Extracts the file path from the tool input
- If path contains `hcm-ai-pm`, cd into that repo
- If `git status --porcelain` is non-empty (there are actual changes), `git add -A`, commit with a timestamp message, and `git push origin main`
- Silently swallows failures (network, conflict, auth) so it never blocks Claude's turn

## To disable later

Delete `.claude\settings.local.json` at the workspace root, or use `/hooks` to toggle it off.
