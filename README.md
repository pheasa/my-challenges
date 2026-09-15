<br /><br />

<p align="center">
<a href="https://plane.so">
  <img src="https://media.docs.plane.so/logo/plane_github_readme.png" alt="Plane Logo" width="400">
</a>
</p>
<p align="center"><b>Modern project management for all teams</b></p>

<p align="center">
    <a href="https://plane.so/"><b>Website</b></a> •
    <a href="https://forum.plane.so"><b>Forum</b></a> •
    <a href="https://x.com/planepowers"><b>X</b></a> •
    <a href="https://docs.plane.so/"><b>Documentation</b></a>
</p>

<p>
    <a href="https://app.plane.so/#gh-light-mode-only" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-top.webp"
        alt="Plane Screens"
        width="100%"
      />
    </a>
</p>

Meet [Plane](https://plane.so/), an open-source project management tool to track issues, run ~sprints~ cycles, and manage product roadmaps without the chaos of managing the tool itself. 🧘‍♀️

> Plane is evolving every day. Your suggestions, ideas, and reported bugs help us immensely. Do not hesitate to join in the conversation on [Forum](https://forum.plane.so) or raise a GitHub issue. We read everything and respond to most.

## 🚀 Installation

Getting started with Plane is simple. Choose the setup that works best for you:

- **Plane Cloud**
  Sign up for a free account on [Plane Cloud](https://app.plane.so)—it's the fastest way to get up and running without worrying about infrastructure.

- **Self-host Plane**
  Prefer full control over your data and infrastructure? Install and run Plane on your own servers. Follow our detailed [deployment guides](https://developers.plane.so/self-hosting/overview) to get started.

| Installation methods | Docs link                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker               | [![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://developers.plane.so/self-hosting/methods/docker-compose)         |
| Kubernetes           | [![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)](https://developers.plane.so/self-hosting/methods/kubernetes) |
| Managed hosting      | [<img alt="Deploy with Zenith" src="https://cdn.zenith.hosting/buttons/deploy-with-zenith.svg" height="40">](https://zenith.hosting/host/plane)                                         |

`Instance admins` can configure instance settings with [God mode](https://developers.plane.so/self-hosting/govern/instance-admin).

## 🌟 Features

- **Work Items**
  Efficiently create and manage tasks with a robust rich text editor that supports file uploads. Enhance organization and tracking by adding sub-properties and referencing related issues.

- **Cycles**
  Maintain your team’s momentum with Cycles. Track progress effortlessly using burn-down charts and other insightful tools.

- **Modules**
  Simplify complex projects by dividing them into smaller, manageable modules.

- **Views**
  Customize your workflow by creating filters to display only the most relevant issues. Save and share these views with ease.

- **Pages**
  Capture and organize ideas using Plane Pages, complete with AI capabilities and a rich text editor. Format text, insert images, add hyperlinks, or convert your notes into actionable items.

- **Analytics**
  Access real-time insights across all your Plane data. Visualize trends, remove blockers, and keep your projects moving forward.

## 🛠️ Local Development (Docker Compose)

You can run the development environment using Docker Compose for infrastructure and backend services, paired with live code reloading.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose (v2.0+) installed and running
- [Node.js](https://nodejs.org/) (>= 20, recommended >= 22)
- [pnpm](https://pnpm.io/) (`corepack enable pnpm`)
- **Memory**: Minimum **12 GB RAM** recommended

### Step-by-Step Setup

#### 1. Setup Environment Files & Dependencies

Run the setup script to copy all `.env.example` files to `.env`, generate the Django `SECRET_KEY`, and install Node dependencies:

```bash
chmod +x setup.sh
./setup.sh
```

<details>
<summary>Manual setup without <code>setup.sh</code></summary>

- Copy `.env.example` to `.env` in the root directory and in `apps/api/`, `apps/web/`, `apps/space/`, `apps/admin/`, and `apps/live/`.
- Generate and add a random 50-character `SECRET_KEY="your-secret-key"` to `apps/api/.env`.
- Run `pnpm install`.
</details>

#### 2. Start Backend & Infrastructure Services (Development Mode)

Start the development containers using `docker-compose-local.yml`:

```bash
# Start in the background (detached mode)
docker compose -f docker-compose-local.yml up -d

# Or run in foreground to view live logs
docker compose -f docker-compose-local.yml up
```

**Services included in `docker-compose-local.yml`:**

- `plane-db`: PostgreSQL 15 (port `5432`)
- `plane-redis`: Valkey / Redis cache (port `6379`)
- `plane-mq`: RabbitMQ message broker (ports `5672`, `15672`)
- `plane-minio`: MinIO S3-compatible storage (ports `9000` & `9090`)
- `api`: Django API server with live code reload via volume mounts (port `8000`)
- `worker` & `beat-worker`: Celery workers for background and periodic tasks
- `migrator`: Applies database migrations automatically on startup

#### 3. Start Frontend Development Servers

In a new terminal window, start the frontend web applications with hot-reloading:

```bash
pnpm dev
```

#### 4. Access the Applications

- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Admin / God Mode**: [http://localhost:3001/god-mode/](http://localhost:3001/god-mode/) _(Register as instance admin here first)_
- **API Server**: [http://localhost:8000](http://localhost:8000)
- **MinIO Console**: [http://localhost:9090](http://localhost:9090)

---

### Useful Docker Compose Commands

- **View container logs:**

  ```bash
  # Follow logs from all services
  docker compose -f docker-compose-local.yml logs -f

  # Follow logs from a specific service (e.g. api or worker)
  docker compose -f docker-compose-local.yml logs -f api
  docker compose -f docker-compose-local.yml logs -f worker
  ```

- **Check container status:**

  ```bash
  docker compose -f docker-compose-local.yml ps
  ```

- **Stop containers:**

  ```bash
  docker compose -f docker-compose-local.yml down
  ```

- **Reset database and volumes (clean start):**

  ```bash
  docker compose -f docker-compose-local.yml down -v
  ```

- **Rebuild images:**
  ```bash
  docker compose -f docker-compose-local.yml build
  ```

> **Note:** For running a standalone minimal containerized deployment without local Node/pnpm, you can run `docker compose up -d` using the root `docker-compose.yml`.
>
> For full contributing guidelines and testing conventions, see [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md).

## ⚙️ Built with

[![React Router](https://img.shields.io/badge/-React%20Router-CA4245?logo=react-router&style=for-the-badge&logoColor=white)](https://reactrouter.com/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://www.djangoproject.com/)
[![Node JS](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org/en)

## 📸 Screenshots

  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-work-items.webp"
        alt="Plane Views"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-cycles.webp"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-modules.webp"
        alt="Plane Cycles and Modules"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-views.webp"
        alt="Plane Analytics"
        width="100%"
      />
    </a>
  </p>
   <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-analytics.webp"
        alt="Plane Pages"
        width="100%"
      />
    </a>
  </p>
</p>

## 📝 Documentation

Explore Plane's [product documentation](https://docs.plane.so/) and [developer documentation](https://developers.plane.so/) to learn about features, setup, and usage.

## ❤️ Community

Join the Plane community on [GitHub Discussions](https://github.com/orgs/makeplane/discussions) and our [Forum](https://forum.plane.so). We follow a [Code of conduct](https://github.com/makeplane/plane/blob/master/CODE_OF_CONDUCT.md) in all our community channels.

Feel free to ask questions, report bugs, participate in discussions, share ideas, request features, or showcase your projects. We’d love to hear from you!

## 🛡️ Security

If you discover a security vulnerability in Plane, please report it responsibly instead of opening a public issue. We take all legitimate reports seriously and will investigate them promptly. See [Security policy](https://github.com/makeplane/plane/blob/master/SECURITY.md) for more info.

To disclose any security issues, please email us at security@plane.so.

## 🤝 Contributing

There are many ways you can contribute to Plane:

- Report [bugs](https://github.com/makeplane/plane/issues/new?assignees=srinivaspendem%2Cpushya22&labels=%F0%9F%90%9Bbug&projects=&template=--bug-report.yaml&title=%5Bbug%5D%3A+) or submit [feature requests](https://github.com/makeplane/plane/issues/new?assignees=srinivaspendem%2Cpushya22&labels=%E2%9C%A8feature&projects=&template=--feature-request.yaml&title=%5Bfeature%5D%3A+).
- Review the [documentation](https://docs.plane.so/) and submit [pull requests](https://github.com/makeplane/docs) to improve it—whether it's fixing typos or adding new content.
- Talk or write about Plane or any other ecosystem integration and [let us know](https://forum.plane.so)!
- Show your support by upvoting [popular feature requests](https://github.com/makeplane/plane/issues).

Please read [CONTRIBUTING.md](https://github.com/makeplane/plane/blob/master/CONTRIBUTING.md) for details on the process for submitting pull requests to us.

### Repo activity

![Plane Repo Activity](https://repobeats.axiom.co/api/embed/2523c6ed2f77c082b7908c33e2ab208981d76c39.svg "Repobeats analytics image")

### We couldn't have done this without you.

<a href="https://github.com/makeplane/plane/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=makeplane/plane" />
</a>

## License

This project is licensed under the [GNU Affero General Public License v3.0](https://github.com/makeplane/plane/blob/master/LICENSE.txt).
