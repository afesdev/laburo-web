# OficiosApp Web

Frontend web del portafolio de profesionales. Cliente de la app móvil con catálogo de servicios, publicaciones, promociones y administración.

## Stack

- **React 19** + **TypeScript 6**
- **Vite 8** — build tool
- **Tailwind CSS v4** — estilos
- **React Router v7** — routing SPA
- **TanStack React Query** — data fetching
- **Zustand** — estado global
- **Axios** — HTTP client
- **date-fns** — fechas
- **Lucide React** — íconos

## Scripts

```bash
npm run dev      # dev server
npm run build    # tsc + vite build
npm run lint     # ESLint
npm run preview  # preview build local
```

## Estructura

```
src/
├── components/   # Componentes reutilizables
│   └── layout/   # Layouts (App, Admin, Navbar, Sidebar)
├── lib/          # Utilidades, API client
├── pages/        # Páginas por módulo
│   ├── admin/    # Panel admin (dashboard, promos, usuarios, denuncias, verificaciones)
│   ├── auth/     # Login, registro, recuperación
│   ├── feed/     # Feed principal
│   ├── mapa/     # Mapa de profesionales
│   ├── perfil/   # Perfil de usuario
│   └── ...       # Search, favoritos, publicaciones, promociones
├── store/        # Zustand stores
└── types/        # Tipos compartidos
```

## Deploy (Vercel)

1. Conectar repo de GitHub
2. Root: `oficios-web`
3. Build: `npm run build`
4. Output: `dist`
5. Env: `VITE_API_URL` = URL del backend (ej. `https://.../api/v1`)
