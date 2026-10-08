# Portainer frontend stack

This stack runs the three frontend images published by GitHub Actions. It does
not build from source. Each image uses Nginx to serve its static SPA on port 80;
you can access the published host ports directly by server IP for now. A
separate, public-facing reverse proxy such as Caddy is optional when domains
and HTTPS are ready.

## Portainer setup

1. Open **Stacks → Add stack → Repository**.
2. Select the configured `lens-frontend` Git source (or use the
   `LensExe/Lens-web` repository directly).
3. Select `refs/heads/main`.
4. Set the Compose path to `deploy/portainer/frontend-stack.yml`.
5. Ensure Portainer has an authenticated GitHub Container Registry entry with
   permission to pull these packages. Do not put the registry token in this
   repository or the Compose file.
6. The Compose file defaults to the following values, so no stack environment
   variables are required unless you want to override them:

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

GitHub Actions publishes `latest` plus an immutable `sha-<commit>` tag. After
publishing, GitHub Actions does not call Portainer or deploy containers.
Portainer CE does not automatically redeploy when the Git repository or a
`latest` image changes. After all three publish jobs succeed, open the stack
and choose **Pull and redeploy** to fetch and run the new images. The immutable
`sha-<commit>` tags remain available for a manual rollback by overriding
`IMAGE_TAG` in the stack. No `PORTAINER_WEBHOOK_URL` secret is needed.

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

The `VITE_*` values are compiled into the frontend images at build time. This
workflow reads them from GitHub Actions **Environment secrets** in the
`Deploy-FE` environment; Portainer only selects and runs the resulting images.
Although they are stored as GitHub secrets, Vite exposes these values in
browser code, so use only public URLs and flags here, never passwords, tokens,
or other credentials. Changing one requires rebuilding and publishing the
images before Portainer redeploys them.

Configure these secrets under **GitHub → Settings → Environments → Deploy-FE →
Environment secrets**:

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
