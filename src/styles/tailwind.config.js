/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.webc', '_site/**/*'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    // ...
  ],
};
