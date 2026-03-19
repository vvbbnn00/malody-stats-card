> **Animated SVG stats cards for Malody profiles**

# Malody Stats Card

[中文](README_cn.md) | English

> **Warning**
>
> This project is unofficial, non-profit, and open source. If you believe any content here is infringing or inappropriate, please contact the maintainer.

Malody Stats Card renders a Malody player's profile as an animated SVG card that can be embedded in blogs, profile pages, or dashboards.

The project currently supports two data providers:

- `legacy` (default): uses the older Malody community API and requires account credentials in `.env`
- `web-v2-experimental`: uses the newer `malody.mugzone.net` web API through a guest session and is marked experimental

> **Animation note**
>
> Cards are animated SVGs. Some preview tools or social platforms may only show the first frame. For visual verification, open the SVG directly in a browser.

## Features

- Animated SVG profile cards
- JSON profile endpoints for integrations and debugging
- Provider-based cache isolation between `legacy` and `web-v2-experimental`
- Automatic cache schema migration with backup on first upgrade
- Route and adapter tests for both existing and experimental behavior

## Endpoints

| Purpose | Endpoint | Notes |
| --- | --- | --- |
| Legacy profile JSON | `/profile?uid=[UID]` | Default provider |
| Legacy card SVG | `/card/default/[UID]` | Animated SVG |
| Experimental profile JSON | `/profile?uid=[UID]&provider=web-v2-experimental` | Same shape as legacy, normalized from the new web API |
| Experimental card SVG | `/card/default/[UID]?provider=web-v2-experimental` | Same card renderer, experimental data source |
| Experimental profile JSON shortcut | `/experimental/profile?uid=[UID]` | Shortcut for the experimental provider |
| Experimental card SVG shortcut | `/experimental/card/default/[UID]` | Shortcut for the experimental provider |

## Query Parameters

| Name | Applies to | Description |
| --- | --- | --- |
| `uid` | `/profile`, `/experimental/profile` | Malody user ID |
| `hide` | card endpoints | Comma-separated modes to hide, for example `hide=4,5` |
| `provider` | `/profile`, `/card/default/[UID]` | Currently supports `legacy` and `web-v2-experimental` |

The card renderer currently recognizes these mode IDs when present: `0`, `3`, `4`, `5`, `6`, `7`, `8`, `9`. Invalid `hide` entries are ignored.

## Response Headers

| Header | Meaning |
| --- | --- |
| `X-Cache` | `HIT` or `MISS` for card responses |
| `X-Malody-Provider` | Which provider served the response |
| `X-Malody-Experimental` | Present and set to `true` for experimental responses |

## Local Sanity Checks

Assuming the service is running at `http://127.0.0.1:3000`, these URLs are useful for quick manual checks:

- Legacy profile JSON: [http://127.0.0.1:3000/profile?uid=178813](http://127.0.0.1:3000/profile?uid=178813)
- Legacy card SVG: [http://127.0.0.1:3000/card/default/178813](http://127.0.0.1:3000/card/default/178813)
- Legacy card with hidden modes: [http://127.0.0.1:3000/card/default/178813?hide=4,5,8,9](http://127.0.0.1:3000/card/default/178813?hide=4,5,8,9)
- Experimental profile JSON: [http://127.0.0.1:3000/profile?uid=178813&provider=web-v2-experimental](http://127.0.0.1:3000/profile?uid=178813&provider=web-v2-experimental)
- Experimental profile shortcut: [http://127.0.0.1:3000/experimental/profile?uid=178813](http://127.0.0.1:3000/experimental/profile?uid=178813)
- Experimental card SVG: [http://127.0.0.1:3000/experimental/card/default/178813](http://127.0.0.1:3000/experimental/card/default/178813)
- Invalid provider example: [http://127.0.0.1:3000/profile?uid=178813&provider=future](http://127.0.0.1:3000/profile?uid=178813&provider=future)

If you want to inspect headers:

```bash
curl -i "http://127.0.0.1:3000/card/default/178813"
curl -i "http://127.0.0.1:3000/profile?uid=178813&provider=web-v2-experimental"
curl -i "http://127.0.0.1:3000/experimental/card/default/178813"
```

## Embedding

Replace `https://your-host.example.com` and `[UID]` with your own values.

### Markdown

```markdown
[![Malody Stats Card](https://your-host.example.com/card/default/[UID])](https://malody.mugzone.net/player/[UID])
```

### HTML

```html
<a href="https://malody.mugzone.net/player/[UID]">
    <img src="https://your-host.example.com/card/default/[UID]" alt="Malody Stats Card">
</a>
```

### Experimental Provider Example

```markdown
[![Malody Stats Card](https://your-host.example.com/card/default/[UID]?provider=web-v2-experimental)](https://malody.mugzone.net/player/[UID])
```

## Provider Notes

### `legacy` provider

- Default behavior for `/profile` and `/card/default/[UID]`
- Uses the older Malody API endpoints
- Requires `.env` credentials
- Recommended when you want the most established behavior in this project

### `web-v2-experimental` provider

- Uses the newer `https://malody.mugzone.net/` web API through guest access
- Does not require account credentials for basic profile fetches
- Response shape is normalized so the current card renderer can keep working
- Experimental by design and may break if the upstream site changes

## How to Obtain a UID

The current public player page is:

```text
https://malody.mugzone.net/player/[UID]
```

You can usually obtain a UID by opening a player's profile page and copying the numeric ID from the URL.

## Private Deployment

### Option A: Docker Compose

1. Clone this repository.
2. If you want to use the default `legacy` provider, create a `.env` file in the project root:

   ```env
   uid=
   username=
   password=
   PORT=3000
   ```

3. Start the service:

   ```bash
   docker compose up -d
   ```

4. Open `http://localhost:3000/card/default/[UID]`.

The compose file in this repository is [`docker-compose.yaml`](docker-compose.yaml).
The container reads credentials from `.env` at runtime, and the file is not copied into the image.
By default, profile cache and image cache are persisted with Docker named volumes, which avoids common Linux bind-mount permission issues while keeping the container on a non-root user.
If you want to use host bind mounts instead, prepare the directories on the host before starting the container:

```bash
mkdir -p database cache
sudo chown -R 100:101 database cache
```

The container runs as UID/GID `100:101`.

### Option B: Direct Execution

1. Clone this repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. If you want to use the default `legacy` provider, create `.env`:

   ```env
   uid=
   username=
   password=
   PORT=3000
   ```

   If you only plan to test `web-v2-experimental`, the legacy credentials can be omitted.

4. Start the service:

   ```bash
   npm run start
   ```

5. Open `http://localhost:3000/card/default/[UID]`.

## Cache, Storage, and Migration

- Profile and token cache are stored in `database/malody.db`
- Downloaded images are cached in `cache/`
- The datastore is schema-versioned
- On the first migration from the old cache schema, the project creates `database/malody.db.bak-v1`
- Cache records are isolated by provider so `legacy` and `web-v2-experimental` do not overwrite each other

By default, cached profile and image data are reused for 2 hours.

## Tests

Run the automated test suite with:

```bash
npm test
```

Current tests cover:

- Basic route behavior
- Invalid parameter handling
- Card route cache headers
- Experimental provider routing
- New web API normalization
- Datastore migration and provider isolation

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Acknowledgements

- [Malody](https://malody.mugzone.net/)
- [flagicons](https://github.com/lipis/flag-icons)
- [github-readme-stats](https://github.com/anuraghazra/github-readme-stats)
