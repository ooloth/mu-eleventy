/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.webc', '_site/**/*'],
  plugins: [require('@tailwindcss/typography')],
};
