-- Add the category to existing installations without changing existing IDs.
INSERT INTO public.categories (name, slug, icon, description)
VALUES (
  'Técnicos de computadora',
  'tecnicos-de-computadora',
  '💻',
  'Reparación y mantenimiento de computadoras y laptops, instalación de programas y soporte técnico.'
)
ON CONFLICT (slug) DO NOTHING;
