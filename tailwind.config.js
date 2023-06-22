/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.webc', '_site/**/*'],
  theme: {
    extend: {
      boxShadow: {
        /* solid shadow, glow shadow */
        glow: '0 0 0 0.15em #fda4af, 0 0 1.75em 0 #fda4af',
      },
    },
  },
};
