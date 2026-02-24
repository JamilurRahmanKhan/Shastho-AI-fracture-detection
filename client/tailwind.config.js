/* The code snippet you provided is a configuration file for Tailwind CSS with the DaisyUI plugin.
Here's a breakdown of what it does: */
/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
}

