export const colors = {
  ink: "#251F18",
  muted: "#756F65",
  bg: "#F7F5EE",
  line: "#E8E3D9",
  yellow: "#FFCF25",
  orange: "#FC6741",
  green: "#1F845D",
  card: "#FFFEFA",
  nav: "#24211C",
  danger: "#A92D2D",
};
export const fonts = {
  body: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  bold: "DMSans_700Bold",
  heading: "Outfit_700Bold",
  display: "Outfit_800ExtraBold",
};
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
