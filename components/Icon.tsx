import Svg, { Circle, Path } from "react-native-svg";

import { IconName, IconProps } from "@/types/components";

// Icon shapes on a 24×24 grid, drawn as lines. Taken from Lucide (https://lucide.dev, ISC license).
// To add one: copy the inner elements of the icon's SVG from lucide.dev, and add its name to IconName.
const shapes: Record<IconName, React.ReactNode> = {
  edit: (
    <>
      <Path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <Path d="m15 5 4 4" />
    </>
  ),
  more: (
    <>
      <Circle cx="12" cy="5" r="1" />
      <Circle cx="12" cy="12" r="1" />
      <Circle cx="12" cy="19" r="1" />
    </>
  ),
  check: <Path d="M20 6 9 17l-5-5" />,
};

export default function Icon({ name, color, size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name]}
    </Svg>
  );
}
