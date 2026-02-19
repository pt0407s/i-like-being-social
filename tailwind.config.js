export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#202225',
          darker: '#2f3136',
          darkest: '#36393f',
          blurple: '#5865F2',
          green: '#3ba55d',
          gray: '#4e5058',
          lightgray: '#b9bbbe',
        }
      }
    },
  },
  plugins: [],
}
