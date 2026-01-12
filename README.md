<div align="center">

# XIANZE 2026

**A modern, production-ready event management system**

[![Backend](https://img.shields.io/badge/Backend-NestJS-ea2845?style=for-the-badge&logo=nestjs)](./backend)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-000000?style=for-the-badge&logo=next.js)](./frontend)
[![Database](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite)](./backend)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](./docker-compose.yml)

</div>

---

## 📖 What is XIANZE?

Xianze is an annual technical fest that brings together students from colleges across the region to showcase their creativity, innovation, and technical expertise. Organized by the Mind bender's Association from Department of Software Systems and Computer Science (PG) Since 2011, Xianze features an exciting mix of technical and non-technical events aimed at encouraging participants to think critically and collaborate effectively. The event provides a platform for undergraduate and postgraduate students to present innovative ideas, compete in challenging events, and explore the latest trends in technology.

## 📖 What is XIANZE EMS?

XIANZE EMS is an **admin-only event management system** designed for organizations that need to manage events, venues, and attendees. This repository contains the complete boilerplate for both the backend API and frontend application.

### Key Features

- 🔐 **Admin-only authentication** - Secure access for authorized administrators
- 📊 **Event management** - Create, update, and manage events (placeholder)
- 🎨 **Modern UI** - Built with Next.js and Tailwind CSS
- 🐳 **Docker-ready** - One-command deployment with Docker Compose
- 📝 **Comprehensive docs** - Beginner-friendly documentation

---

## 🏗️ Repository Structure

```
xianze/
├── backend/                 # NestJS API server
│   ├── src/                 # Source code
│   ├── docs/                # Backend-specific docs
│   ├── Dockerfile           # Backend container
│   └── *.md                 # Documentation files
│
├── frontend/                # Next.js web application
│   ├── app/                 # App Router pages
│   ├── docs/                # Frontend-specific docs
│   ├── Dockerfile           # Frontend container
│   └── *.md                 # Documentation files
│
├── docker-compose.yml       # Root orchestration
├── .editorconfig            # Editor settings
├── .prettierrc              # Code formatting
├── .eslintignore            # Linting exclusions
├── .husky/                  # Git hooks
└── README.md                # This file
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

| Tool                                                       | Version | Purpose                      |
| ---------------------------------------------------------- | ------- | ---------------------------- |
| [Docker](https://www.docker.com/get-started)               | 20.10+  | Container runtime            |
| [Docker Compose](https://docs.docker.com/compose/install/) | 2.0+    | Container orchestration      |
| [Node.js](https://nodejs.org/)                             | 20+     | Local development (optional) |
| [Git](https://git-scm.com/)                                | 2.30+   | Version control              |

### Running with Docker (Recommended)

The easiest way to run XIANZE is with Docker Compose:

```bash
# Production
./deploy.sh prod

# Development  
docker compose up -d        # Start backend + redis
cd frontend && bun run dev  # Start frontend locally

# Stop all services (keeps data)
docker compose down

# Stop and remove all data
docker compose down -v
```

---

## 💻 Local Development

For development without Docker, see the individual READMEs:

- [Backend Development Guide](./backend/README.md)
- [Frontend Development Guide](./frontend/README.md)

## 🐳 Docker Architecture

XIANZE uses a multi-container architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    xianze-network                           │
│                                                             │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │    frontend     │────────▶│    backend      │           │
│  │    (Next.js)    │         │    (NestJS)     │           │
│  │    Port: 3000   │         │    Port: 5000   │           │
│  └─────────────────┘         └────────┬────────┘           │
│                                       │                     │
│                              ┌────────▼────────┐           │
│                              │  sqlite-data    │           │
│                              │   (Volume)      │           │
│                              └─────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

| Service  | Port | Description             |
| -------- | ---- | ----------------------- |
| frontend | 3000 | Next.js web application |
| backend  | 5000 | NestJS API server       |

---

## 📚 Documentation

### Backend Documentation

| Document                                           | Description                      |
| -------------------------------------------------- | -------------------------------- |
| [README.md](./backend/README.md)                   | Getting started with the backend |
| [ARCHITECTURE.md](./backend/ARCHITECTURE.md)       | System design and patterns       |
| [CONTRIBUTING.md](./backend/CONTRIBUTING.md)       | How to contribute                |
| [DEPLOYMENT.md](./backend/DEPLOYMENT.md)           | Production deployment guide      |
| [SECURITY.md](./backend/SECURITY.md)               | Security considerations          |
| [TROUBLESHOOTING.md](./backend/TROUBLESHOOTING.md) | Common issues and solutions      |

### Frontend Documentation

| Document                                            | Description                       |
| --------------------------------------------------- | --------------------------------- |
| [README.md](./frontend/README.md)                   | Getting started with the frontend |
| [ARCHITECTURE.md](./frontend/ARCHITECTURE.md)       | Component structure and patterns  |
| [CONTRIBUTING.md](./frontend/CONTRIBUTING.md)       | How to contribute                 |
| [TROUBLESHOOTING.md](./frontend/TROUBLESHOOTING.md) | Common issues and solutions       |

---

## 🛠️ Tech Stack

### Backend

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Database**: [SQLite](https://www.sqlite.org/) - Lightweight, file-based database
- **ORM**: [TypeORM](https://typeorm.io/) - TypeScript-first ORM
- **Language**: TypeScript

### Frontend

- **Framework**: [Next.js 14+](https://nextjs.org/) - React framework with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Language**: TypeScript

### DevOps

- **Containerization**: Docker + Docker Compose
- **Code Quality**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

---

## 👥 Who is This For?

This repository is designed for:

- **Junior developers** learning enterprise project structure
- **Teams** needing a clean starting point for event management
- **DevOps engineers** exploring Docker-based deployments
- **Architects** evaluating NestJS + Next.js combinations

---

## 🤝 Contributing

We welcome contributions! Please read our contributing guides:

- [Backend Contributing Guide](./backend/CONTRIBUTING.md)
- [Frontend Contributing Guide](./frontend/CONTRIBUTING.md)

### Quick Contribution Steps

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with a clear message (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the XIANZE community**

</div>
