# Portainer frontend stack

This stack runs the three frontend images published by GitHub Actions. It does
not build from source and it does not contain runtime secrets.

## Portainer setup

1. Open **Stacks → Add stack → Git repository**.
2. Use the `LensExe/Lens-web` repository.
3. Select the `main` reference.
4. Set the Compose path to `deploy/portainer/frontend-stack.yml`.
5. Configure the GitHub Container Registry in Portainer with a token that has
   `read:packages` permission, then select that registry for this stack.
6. Add the stack variables below (or load them from a non-committed `.env`
   file):

   ```dotenv
   IMAGE_REGISTRY=ghcr.io
   IMAGE_OWNER=lensexe
   IMAGE_TAG=latest
   LANDING_HOST_PORT=5173
   PORTAL_HOST_PORT=5174
   ADMIN_HOST_PORT=5175
   ```

7. Deploy the stack. The images expose port `80` internally and are published
   on the host ports above.
8. In the stack's **Editor** tab, enable **Create a stack webhook** and save
   the copied URL as the GitHub Actions repository/environment secret
   `PORTAINER_WEBHOOK_URL`.

GitHub Actions publishes `latest` plus an immutable `sha-<commit>` tag. After
publishing, it calls the Portainer webhook with `IMAGE_TAG=sha-<commit>`, so the
stack redeploys the exact image built by that workflow instead of relying on a
mutable tag.

The `VITE_*` values are compiled into the frontend images at build time. Store
them as GitHub Actions **Environment variables** in the `production`
environment; Portainer only selects and runs the resulting images.
