// @ts-check
// Sidebar de la GUÍA (las páginas escritas a mano). La referencia de endpoints
// la genera redocusaurus en /reference/ y se enlaza desde el navbar, no aquí.

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guiaSidebar: [
    {
      type: 'category',
      label: 'Primeros pasos',
      collapsed: false,
      items: ['intro', 'quickstart'],
    },
    {
      type: 'category',
      label: 'Fundamentos',
      collapsed: false,
      items: ['autenticacion', 'errores'],
    },
    {
      type: 'category',
      label: 'La plataforma',
      collapsed: false,
      items: ['conceptos'],
    },
  ],
};

module.exports = sidebars;
