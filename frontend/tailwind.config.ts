import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    ink:"#071018",panel:"#0c1721",line:"#23303a",mint:"#b3edcb",muted:"#91a3af",
    amber:"#f8c989",rose:"#f49c9c"
  } } },
  plugins: []
} satisfies Config;
