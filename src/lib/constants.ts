export const CITIES = [
  { name: 'Santa Cruz', slug: 'santa-cruz', department: 'Santa Cruz' },
  { name: 'La Paz', slug: 'la-paz', department: 'La Paz' },
  { name: 'Cochabamba', slug: 'cochabamba', department: 'Cochabamba' },
  { name: 'El Alto', slug: 'el-alto', department: 'La Paz' },
  { name: 'Sucre', slug: 'sucre', department: 'Chuquisaca' },
  { name: 'Tarija', slug: 'tarija', department: 'Tarija' },
  { name: 'Oruro', slug: 'oruro', department: 'Oruro' },
  { name: 'Potosí', slug: 'potosi', department: 'Potosí' },
  { name: 'Trinidad', slug: 'trinidad', department: 'Beni' },
  { name: 'Cobija', slug: 'cobija', department: 'Pando' },
] as const

export const CATEGORIES = [
  { name: 'Albañiles', slug: 'albaniles', icon: '🧱', description: 'Construcción, reparaciones y acabados de albañilería.' },
  { name: 'Plomeros', slug: 'plomeros', icon: '🔧', description: 'Instalación y reparación de tuberías y sistemas de agua.' },
  { name: 'Carpinteros', slug: 'carpinteros', icon: '🪵', description: 'Muebles a medida, reparaciones y trabajos en madera.' },
  { name: 'Electricistas', slug: 'electricistas', icon: '⚡', description: 'Instalaciones eléctricas, reparaciones y certificaciones.' },
  { name: 'Pintores', slug: 'pintores', icon: '🎨', description: 'Pintura de interiores y exteriores, acabados y texturizados.' },
  { name: 'Limpieza', slug: 'limpieza', icon: '🧹', description: 'Limpieza de hogares, oficinas y locales comerciales.' },
  { name: 'Empleadas Domésticas', slug: 'empleadas-domesticas', icon: '🏠', description: 'Servicios domésticos de confianza para el hogar.' },
  { name: 'Niñeras', slug: 'nineras', icon: '👶', description: 'Cuidado y atención profesional de niños.' },
  { name: 'Cuidadores de Adultos Mayores', slug: 'cuidadores-adultos-mayores', icon: '👴', description: 'Atención especializada y compañía para adultos mayores.' },
  { name: 'Fletes y Mudanzas', slug: 'fletes-y-mudanzas', icon: '🚚', description: 'Transporte de muebles, mudanzas y fletes locales.' },
  { name: 'Gestores de Trámites', slug: 'gestores-tramites', icon: '📋', description: 'Ayuda con trámites administrativos y legales.' },
  { name: 'Mecánicos', slug: 'mecanicos', icon: '🔩', description: 'Reparación y mantenimiento de vehículos.' },
  { name: 'Tutores', slug: 'tutores', icon: '📚', description: 'Clases particulares y apoyo escolar para todas las edades.' },
  { name: 'Comida Casera y Catering', slug: 'comida-casera-catering', icon: '🍽️', description: 'Almuerzos, cenas y catering para eventos.' },
] as const

export const SITE_NAME = 'LaburoPro'
export const SITE_URL = 'https://laburopro.com'
export const SITE_TAGLINE = 'Servicios verificados cerca de ti'
export const SITE_DESCRIPTION = 'Encuentra plomeros, albañiles, fletes, cuidadores, tutores, mecánicos y más en Bolivia. Proveedores verificados en Santa Cruz, La Paz, Cochabamba y todo el país.'

export const NAV_LINKS = [
  { label: 'Buscar trabajador', href: '/servicios' },
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Ofrecer mi trabajo', href: '/registro' },
]

export const WHATSAPP_BASE_URL = 'https://wa.me/'
