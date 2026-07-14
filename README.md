# LaburoPro

**Servicios verificados cerca de ti** — El marketplace boliviano de servicios locales.

LaburoPro conecta a clientes con proveedores verificados de servicios como plomeros, albañiles, electricistas, niñeras, tutores, fletes y más, en Santa Cruz, La Paz, Cochabamba y todo Bolivia.

🌐 [laburopro.com](https://laburopro.com)

---

## 🚀 Setup rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Anota tu **Project URL** y **anon public key** (en Settings → API).

### 3. Ejecutar el schema SQL

En el **SQL Editor** de tu proyecto Supabase, ejecuta los siguientes archivos en orden:

```
1. supabase/schema.sql   — Crea todas las tablas, RLS y triggers
2. supabase/seed.sql     — Inserta las ciudades y categorías iniciales
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SECRET_KEY=sb_secret_tu-clave-privada-del-servidor
RESEND_API_KEY=re_tu-clave-privada
RESEND_FROM_EMAIL="LaburoPro <notificaciones@updates.laburopro.com>"
RESEND_REPLY_TO=laburo.pro.bolivia@gmail.com
```

Las variables de Resend son opcionales. Al configurarlas, cada nuevo contacto de
WhatsApp genera una notificación por correo para el proveedor. El subdominio del
remitente debe estar verificado en Resend; si el servicio de correo no está
configurado o falla, el contacto se registra igualmente.

### 5. Correr localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## 👤 Crear el primer administrador

El rol `admin` **no se puede asignar desde la UI pública** por seguridad.

Para crear el primer admin:

1. Registra un usuario normal en `/registro`.
2. Ve al **SQL Editor** de Supabase y ejecuta:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'tu-email@ejemplo.com';
```

3. El usuario ahora tiene acceso a `/admin`.

---

## 📁 Estructura del proyecto

```
src/
  app/
    page.tsx                      — Homepage
    layout.tsx                    — Layout raíz
    globals.css                   — Estilos globales
    sitemap.ts                    — Sitemap dinámico
    robots.ts                     — robots.txt
    servicios/
      page.tsx                    — Todas las categorías
      [categoria]/
        page.tsx                  — Categoría con proveedores
        [ciudad]/
          page.tsx                — Categoría + ciudad
    proveedores/
      [slug]/
        page.tsx                  — Perfil público de proveedor
    registro/page.tsx             — Registro de proveedor
    login/page.tsx                — Login
    dashboard/
      page.tsx                    — Dashboard home
      perfil/page.tsx             — Editor de perfil
    admin/
      page.tsx                    — Admin home
      proveedores/page.tsx        — Gestión de proveedores
    privacidad/page.tsx           — Política de privacidad
    terminos/page.tsx             — Términos y condiciones
  components/
    layout/
      Header.tsx                  — Navbar sticky con móvil
      Footer.tsx
    ui/
      CategoryCard.tsx
      ProviderCard.tsx
      VerificationBadge.tsx
      WhatsAppButton.tsx
      EmptyState.tsx
      SearchBar.tsx
      CitySelector.tsx
    dashboard/
      DashboardShell.tsx
    admin/
      AdminShell.tsx
      AdminProviderActions.tsx    — Acciones de admin (cliente)
  lib/
    supabase/
      client.ts                   — Cliente browser
      server.ts                   — Cliente servidor
      middleware.ts               — Refresh de sesión
    constants.ts                  — Ciudades, categorías, config
    utils.ts                      — Helpers
  types/
    database.ts                   — Tipos TypeScript del schema
  middleware.ts                   — Protección de rutas
supabase/
  schema.sql                      — Schema completo con RLS
  seed.sql                        — Datos iniciales
.env.example                      — Variables requeridas
```

---

## 🏗️ Tecnologías

| Tecnología | Uso |
|---|---|
| [Next.js 16](https://nextjs.org) | App Router, Server Components |
| [TypeScript](https://www.typescriptlang.org) | Tipado estático |
| [Tailwind CSS v4](https://tailwindcss.com) | Estilos |
| [Supabase](https://supabase.com) | Auth, PostgreSQL, RLS |
| [Vercel / Cloudflare Pages](https://vercel.com) | Deploy |

---

## 🚢 Deploy

### Vercel (recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configurar variables de entorno en vercel.com → Settings → Environment Variables:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SECRET_KEY (solo servidor; nunca usar NEXT_PUBLIC_)
# RESEND_API_KEY (opcional; solo servidor)
# RESEND_FROM_EMAIL (opcional; remitente de un dominio verificado)
# RESEND_REPLY_TO (opcional)
```

### Cloudflare Pages

Para Cloudflare Pages con Next.js, usa el adaptador `@cloudflare/next-on-pages`:

```bash
npm install -D @cloudflare/next-on-pages
```

Consulta: [developers.cloudflare.com/pages/framework-guides/nextjs](https://developers.cloudflare.com/pages/framework-guides/nextjs)

---

## 📊 Base de datos

### Tablas principales

| Tabla | Descripción |
|---|---|
| `profiles` | Usuarios registrados (roles: provider, admin) |
| `categories` | Categorías de servicio (14 iniciales) |
| `cities` | Ciudades de Bolivia (10 iniciales) |
| `provider_profiles` | Perfiles públicos de proveedores |
| `leads` | Contactos generados (fuente: WhatsApp) |
| `reviews` | Reseñas de clientes |

### Row Level Security

- ✅ Visitantes pueden leer proveedores **aprobados y activos**
- ✅ Proveedores solo pueden editar **su propio perfil**
- ✅ Admins tienen acceso completo
- ✅ Ciudades y categorías son públicas
- ✅ La clave privada `secret`/`service_role` no se expone al frontend

---

## 🔒 Seguridad

- Sin claves `secret` o `service_role` en el frontend
- RLS habilitado en todas las tablas
- Rol `admin` solo asignable via SQL directo
- Contraseñas gestionadas por Supabase Auth
- Formularios con validación en cliente y en DB (constraints)

---

## 📞 Contacto

Para soporte o preguntas: laburo.pro.bolivia@gmail.com

---

*Hecho con ❤️ en Bolivia 🇧🇴*
