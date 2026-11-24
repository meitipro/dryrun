# Handoff

## Needs you

- **Make the repository public** so the portal link opens: `gh repo edit meitipro/dryrun --visibility public --accept-visibility-change-consequences`.
- **Send the portal entry.** `submission/portal.md` and `submission/form-fields.json`, with the logo at `submission/dryrun-icon-512.png`.

## Already done

- Contract deployed and frozen on Studio Next; do not redeploy or change `contracts/dryrun.py` without deciding to. A redeploy loses every rule set.
- Test accounts live in `~/.dryrun/accounts.json` on the build machine only.
- If Studio Next changes its runner again, reads stop answering (`execution failed`); the fix is a redeploy with the new header and a new `deployment.json`.
