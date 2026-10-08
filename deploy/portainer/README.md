# Portainer frontend stack

This stack runs the three frontend images published by GitHub Actions. It does
not build from source. Each image uses Caddy to serve its static SPA on port 80;
you can access the published host ports directly by server IP for now. A
separate, public-facing reverse proxy such as Caddy is optional when domains
and HTTPS are ready. Nginx is not used in the frontend images.

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
8. In the stack settings, enable **GitOps updates**, choose **Polling**, set a
   fetch interval, and enable **Re-pull image**. Portainer will monitor the
   `main` branch and pull the images again when it detects a repository update.

GitHub Actions publishes `latest` plus an immutable `sha-<commit>` tag. After
publishing, GitHub Actions does not call Portainer or deploy containers.
Portainer handles stack updates through GitOps polling and re-pulls the
`latest` images. The immutable `sha-<commit>` tags remain available for a
manual rollback by setting `IMAGE_TAG` in Portainer. No
`PORTAINER_WEBHOOK_URL` secret is needed.

Polling is not synchronized with image publishing: Portainer could notice the
new Git commit before all three image builds finish. Choose a fetch interval
longer than the usual image build time to reduce this risk. For a guaranteed
ordering, an on-demand trigger after publishing (such as a Portainer webhook)
would be needed.

### Optional later: domains and HTTPS

When domains are ready, configure a public-facing Caddy instance to proxy each
domain to the matching published port. If Caddy runs directly on the Docker
host, for example:

```caddyfile
lens.example.com {
    reverse_proxy 127.0.0.1:5173
}

app.example.com {
    reverse_proxy 127.0.0.1:5174
}

admin.example.com {
    reverse_proxy 127.0.0.1:5175
}
```

If Caddy runs in a container, `127.0.0.1` refers to that Caddy container, not
the Docker host. Use an address reachable from that container or attach the
services to a shared Docker network and proxy by service name. Until then, use
`http://<SERVER_IP>:5173`, `http://<SERVER_IP>:5174`, and
`http://<SERVER_IP>:5175` directly.

The `VITE_*` values are compiled into the frontend images at build time. Store
them as GitHub Actions **Environment variables** in the `production`
environment; Portainer only selects and runs the resulting images. Since Vite
exposes these values in browser code, they must be public URLs and flags, never
passwords, tokens, or other secrets. Changing one requires rebuilding and
publishing the images before Portainer redeploys them.

Configure these variables under **GitHub → Settings → Environments →
production → Environment variables**:

```dotenv
VITE_BACKEND_API_URL=http://<SERVER_IP>:3000
VITE_API_URL=http://<SERVER_IP>:3000
VITE_API_MOCKING=disabled
VITE_LANDING_URL=http://<SERVER_IP>:5173
VITE_PORTAL_URL=http://<SERVER_IP>:5174
VITE_ADMIN_URL=http://<SERVER_IP>:5175
```

`VITE_API_URL` can be omitted to use `VITE_BACKEND_API_URL`. The workflow
requires the backend and three frontend URLs, then builds each app image with
those values. A push to `main` rebuilds and publishes all three images; the
publish job is restricted to `main`. Manually dispatching the workflow from
another branch only runs quality checks.
