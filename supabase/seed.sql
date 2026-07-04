-- ============================================================
-- LaburoPro — Seed Data
-- Run AFTER schema.sql in your Supabase SQL editor
-- ============================================================

-- ============================================================
-- CITIES
-- ============================================================
INSERT INTO public.cities (name, slug, department) VALUES
  ('Santa Cruz',   'santa-cruz',  'Santa Cruz'),
  ('La Paz',       'la-paz',      'La Paz'),
  ('Cochabamba',   'cochabamba',  'Cochabamba'),
  ('El Alto',      'el-alto',     'La Paz'),
  ('Sucre',        'sucre',       'Chuquisaca'),
  ('Tarija',       'tarija',      'Tarija'),
  ('Oruro',        'oruro',       'Oruro'),
  ('Potosí',       'potosi',      'Potosí'),
  ('Trinidad',     'trinidad',    'Beni'),
  ('Cobija',       'cobija',      'Pando')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO public.categories (name, slug, icon, description) VALUES
  ('Albañiles',                        'albaniles',               '🧱', 'Construcción, reparaciones y acabados de albañilería.'),
  ('Plomeros',                         'plomeros',                '🔧', 'Instalación y reparación de tuberías y sistemas de agua.'),
  ('Carpinteros',                      'carpinteros',             '🪵', 'Muebles a medida, reparaciones y trabajos en madera.'),
  ('Electricistas',                    'electricistas',           '⚡', 'Instalaciones eléctricas, reparaciones y certificaciones.'),
  ('Pintores',                         'pintores',                '🎨', 'Pintura de interiores y exteriores, acabados y texturizados.'),
  ('Limpieza',                         'limpieza',                '🧹', 'Limpieza de hogares, oficinas y locales comerciales.'),
  ('Empleadas Domésticas',             'empleadas-domesticas',    '🏠', 'Servicios domésticos de confianza para el hogar.'),
  ('Niñeras',                          'nineras',                 '👶', 'Cuidado y atención profesional de niños.'),
  ('Cuidadores de Adultos Mayores',    'cuidadores-adultos-mayores', '👴', 'Atención especializada y compañía para adultos mayores.'),
  ('Fletes y Mudanzas',                'fletes-y-mudanzas',       '🚚', 'Transporte de muebles, mudanzas y fletes locales.'),
  ('Gestores de Trámites',             'gestores-tramites',       '📋', 'Ayuda con trámites administrativos y legales.'),
  ('Mecánicos',                        'mecanicos',               '🔩', 'Reparación y mantenimiento de vehículos.'),
  ('Tutores',                          'tutores',                 '📚', 'Clases particulares y apoyo escolar para todas las edades.'),
  ('Comida Casera y Catering',         'comida-casera-catering',  '🍽️', 'Almuerzos, cenas y catering para eventos.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SAMPLE PROVIDERS (for local development)
-- These are dummy records — NOT linked to real auth users.
-- In production, providers are created through the dashboard.
-- 
-- NOTE: These will fail if user_id FK constraint is active.
-- To test, create a real user first and replace the user_id.
-- Or comment out this section for production use.
-- ============================================================

-- To insert sample providers, first create test users in Supabase Auth dashboard,
-- then insert their profiles and provider_profiles using their real UUIDs.

-- Example (replace UUIDs with real ones):
-- INSERT INTO public.provider_profiles (
--   user_id, category_id, city_id, display_name, slug,
--   zone, description, years_experience, price_reference,
--   whatsapp, availability, is_approved, is_verified
-- )
-- SELECT
--   'YOUR-USER-UUID-HERE',
--   c.id,
--   ci.id,
--   'Juan Pérez — Plomería',
--   'juan-perez-plomeria-scz',
--   'Plan 3000',
--   'Plomero con 8 años de experiencia en Santa Cruz. Especializado en instalaciones y reparaciones urgentes.',
--   8,
--   'Desde Bs 80 la hora',
--   '59178901234',
--   'Lunes a sábado, 7am–6pm',
--   true,
--   true
-- FROM public.categories c, public.cities ci
-- WHERE c.slug = 'plomeros' AND ci.slug = 'santa-cruz';
