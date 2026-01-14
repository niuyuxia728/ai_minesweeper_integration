# Render manifest blueprint variants

I added two alternate manifest files you can try importing in Render if the GitHub importer rejects the top-level `databases:` key.

- `render.blueprint.services-postgres.yaml` — uses `type: postgresql` under `services:`.
- `render.blueprint.services-managed.yaml` — uses `type: managed-postgres` under `services:`.

To test locally:

1. Create and switch to your branch: `git checkout -b new-blueprint`
2. Commit these files and push: `git add . && git commit -m "Add Render manifest blueprint variants" && git push -u origin new-blueprint`
3. In Render, connect/import the `new-blueprint` branch and try the two files.

If Render still rejects both, the reliable fallback is to create the database from the Render dashboard and remove DB entries from the manifest.
