const { screens } = require('tailwindcss/defaultTheme');

const withOpacity = (variableName) => {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
};

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xxs: '400px',
        xs: '450px',
        '1.5xl': '1440px',
        xxl: '1600px',
        ...screens
      }
    }
  },
  plugins: []
};
