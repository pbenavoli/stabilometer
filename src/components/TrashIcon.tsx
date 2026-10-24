import Svg, { Path } from 'react-native-svg';

/** Material Design "delete" glyph. */
export function TrashIcon({ size = 24, color = '#202733' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill={color} />
    </Svg>
  );
}
