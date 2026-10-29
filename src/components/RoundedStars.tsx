import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

// Same curved contour and rounding threshold as the web component.
export function RoundedStars({
  value,
  size = 23,
}: {
  value: number;
  size?: number;
}) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
        " de 5 estrelas"
      }
      style={{ flexDirection: "row", gap: 2 }}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= Math.round(value);
        const color = filled ? "#FFC52C" : "#C9C5B8";
        return (
          <Svg
            key={i}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill={filled ? color : "none"}
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M12 2.3c.42 0 .8.25.98.65l2.55 5.16 5.7.83c.95.14 1.32 1.3.64 1.97l-4.12 4.02.98 5.67c.16.94-.82 1.65-1.66 1.21L12 19.14l-5.07 2.67c-.84.44-1.82-.27-1.66-1.21l.97-5.67-4.12-4.02c-.68-.67-.31-1.83.64-1.97l5.7-.83L11.02 2.95c.18-.4.56-.65.98-.65Z" />
          </Svg>
        );
      })}
    </View>
  );
}
