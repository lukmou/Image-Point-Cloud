# DepthCloud - Image to 3D Point Cloud Converter

## Overview

DepthCloud is a web application that converts 2D images into interactive 3D point cloud visualizations. Users upload an image, the server processes it to generate a depth map, and the result is rendered as a navigable 3D point cloud using Three.js. The app has three main pages: a home page for uploading images, a viewer page for interacting with the 3D visualization, and a gallery page for browsing previous conversions.

## User Preferences

Preferred communication style: Simple, everyday language.
Interface design: Grayscale 3D software aesthetic with professional dark theme.
Logo: 3D rendered white sphere.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router) with three routes: `/` (Home/Upload), `/view/:id` (3D Viewer), `/gallery` (Browse all uploads)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **3D Rendering**: Three.js via `@react-three/fiber` and `@react-three/drei` for the point cloud visualization. Custom GLSL shaders handle depth-based vertex displacement and point coloring
- **State Management**: TanStack React Query for server state. The upload viewer polls the API every 2 seconds while status is "pending" or "processing"
- **Animations**: Framer Motion for UI transitions
- **Styling**: Tailwind CSS with CSS variables for theming (dark theme by default). Custom fonts: Space Grotesk (display) and Inter (body)
- **Path aliases**: `@/*` → `client/src/*`, `@shared/*` → `shared/*`, `@assets` → `attached_assets/`

### Backend
- **Framework**: Express.js running on Node with TypeScript (tsx)
- **File Uploads**: Multer with disk storage, files saved to `uploads/` directory at project root, served statically at `/uploads`
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod schemas for response validation. The shared route definitions are consumed by both client and server
- **Depth Map Processing**: Server-side image processing pipeline (uses `@xenova/transformers` for ML-based depth estimation). Upload goes through states: `pending` → `processing` → `completed`/`failed`
- **Development**: Vite dev server with HMR proxied through Express in development mode
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`

### Database
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema**: Single `uploads` table with fields: `id` (serial PK), `originalUrl` (text), `depthMapUrl` (text, nullable), `status` (text, default "pending"), `fileName` (text), `createdAt` (timestamp)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization
- **Storage Layer**: `DatabaseStorage` class in `server/storage.ts` implements `IStorage` interface with CRUD operations for uploads

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/uploads` | List all uploads |
| GET | `/api/uploads/:id` | Get single upload |
| POST | `/api/uploads` | Create upload (multipart form data) |
| POST | `/api/uploads/:id/process` | Trigger depth map processing |

### Build System
- Development: `tsx server/index.ts` with Vite middleware for HMR
- Production build: Vite builds frontend, esbuild bundles server with selective dependency bundling (allowlist pattern to reduce cold start syscalls)
- Output: `dist/public/` (client), `dist/index.cjs` (server)

## External Dependencies

- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable using `pg` Pool
- **@xenova/transformers**: Hugging Face Transformers.js for client-side/server-side ML model inference (depth map generation)
- **Replit Plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` (dev only)
- **File Storage**: Local filesystem (`uploads/` directory) for uploaded images and generated depth maps
- **Google Fonts**: Space Grotesk, Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter loaded via CDN