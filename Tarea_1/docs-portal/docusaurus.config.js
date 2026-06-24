// @ts-check
// Configuración del portal de documentación (Docusaurus 3 + Redoc).
// La referencia de la API se embebe desde static/openapi.json (el MISMO spec que
// sirve Swagger UI), de modo que nunca se desincroniza con el código del backend.

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Reserva Inteligente — API',
  tagline: 'Plataforma distribuida de gestión y análisis de restaurantes',
  favicon: 'img/favicon.svg',

  url: 'http://localhost',
  baseUrl: '/',

  // No reventar el build por un enlace roto durante el desarrollo del portal.
  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // La guía vive en la raíz del sitio.
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
    [
      'redocusaurus',
      /** @type {import('redocusaurus').PresetEntry} */
      ({
        specs: [
          {
            id: 'reserva-api',
            spec: 'static/openapi.json',
            route: '/reference/',
          },
        ],
        // Acento turquesa/tiffany también dentro de la referencia Redoc
        // (tono medio, legible tanto en modo claro como oscuro).
        theme: {
          primaryColor: '#0FB5A6',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Reserva Inteligente',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'guiaSidebar',
            position: 'left',
            label: 'Guía',
          },
          {
            to: '/reference/',
            label: 'Referencia API',
            position: 'left',
          },
          {
            href: 'https://github.com/sebro08/Reserva-Inteligente-de-Restaurantes',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentación',
            items: [
              { label: 'Overview', to: '/' },
              { label: 'Autenticación', to: '/autenticacion' },
              { label: 'Quickstart', to: '/quickstart' },
              { label: 'Referencia API', to: '/reference/' },
            ],
          },
          {
            title: 'Plataforma',
            items: [
              { label: 'Conceptos', to: '/conceptos' },
              { label: 'Modelo de errores', to: '/errores' },
            ],
          },
        ],
        copyright: `Reserva Inteligente de Restaurantes · Bases de Datos 2 · ${new Date().getFullYear()}`,
      },
      prism: {
        additionalLanguages: ['bash', 'json'],
      },
    }),
};

module.exports = config;
