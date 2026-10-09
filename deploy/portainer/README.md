# Portainer frontend stack

This stack runs the three frontend images published by GitHub Actions. It does
not build from source. Each image uses Caddy to serve its static SPA on port 80.
Domain routing is configured separately in the Lens-backend repository's
`deploy/Caddyfile` and `deploy/docker-compose.caddy.yml`.

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
   LANDING_HOST_PORT=5143
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

### Domain binding through Caddy

All domain-to-service routes are centralized in the Lens-backend repository's
`deploy/Caddyfile`; its separate `deploy/docker-compose.caddy.yml` stack owns
public ports `80/443`. FE, backend, and routed infra services only join the
shared `lens-proxy` network; their Compose files do not contain Caddy labels.

All routed containers and the gateway must join the same external Docker
network named `lens-proxy`. Create it once on the Portainer Docker host before
deploying the updated stacks (Portainer **Networks → Add network**, driver
`bridge`, name `lens-proxy`; or `docker network create lens-proxy`).

Set FE domain variables in the dedicated Caddy stack's Portainer environment:

```dotenv
LANDING_DOMAIN=www.example.com
PORTAL_DOMAIN=app.example.com
ADMIN_DOMAIN=admin.example.com
```

If these are omitted, the Compose file uses `.localhost` names for local/test
deployment. Replace them with real hostnames when DNS is ready. Add an A record
for each hostname pointing to the VPS public IP; open inbound TCP `80` and `443`
in the VPS firewall/security group. Caddy obtains and renews HTTPS certificates
automatically. The FE containers still publish their existing host ports for
direct testing; restrict those host ports after confirming domain access.

The current Lens-backend Portainer infra stack includes Keycloak and MinIO, but
does not deploy Kong. If Kong is in another stack, its proxy service must join
`lens-proxy`; the Caddyfile expects `lens-kong:8000` by default and can be
changed with `KONG_UPSTREAM` in the Caddy stack. Do not expose Kong Admin API
ports `8001/8002`. MinIO Console is also an admin interface; restrict its
hostname/access where possible.

After choosing domains, update the related application configuration too:

- Set the frontend GitHub `Deploy-FE` environment's public `VITE_*_URL` values
  to the HTTPS domains, such as the Kong hostname for `VITE_BACKEND_API_URL`
  and `VITE_API_URL`, then rebuild/publish the images and pull/redeploy the
  frontend stack. Vite values are compiled into the images; changing Caddy
  alone does not update them.
- In the backend Portainer stack, keep the internal S3 endpoint pointed at
  MinIO (for example `http://lens-minio:9000`) and set its public S3 endpoint to
  `https://<MINIO_S3_DOMAIN>` so presigned URLs use the public hostname.
- Configure Keycloak's public hostname and proxy-header handling for
  `KEYCLOAK_DOMAIN`, and update OAuth/Google redirect URIs and backend CORS to
  the final HTTPS hostnames.

Until DNS and Caddy are ready, the services remain available at their direct
host ports, subject to the existing firewall rules.

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
VITE_LANDING_URL=http://<SERVER_IP>:5143
VITE_PORTAL_URL=http://<SERVER_IP>:5174
VITE_ADMIN_URL=http://<SERVER_IP>:5175
```

`VITE_API_URL` can be omitted to use `VITE_BACKEND_API_URL`. The workflow
requires the backend and three frontend URLs, then builds each app image with
those values. A push to `main` rebuilds and publishes all three images; the
publish job is restricted to `main`. Manually dispatching the workflow from
another branch only runs quality checks.
