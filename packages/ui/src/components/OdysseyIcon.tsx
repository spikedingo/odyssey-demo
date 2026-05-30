import Svg, { Circle, Path, Rect } from 'react-native-svg';

type OdysseyIconProps = {
  size?: number;
  variant?: 'mark' | 'badge';
};

/**
 * Odyssey brand mark — sage bowl with steam wisps on a warm cream or badge background.
 */
export function OdysseyIcon({ size = 24, variant = 'badge' }: OdysseyIconProps) {
  const showBadge = variant === 'badge';

  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      {showBadge ? (
        <Rect fill="#2e7230" height={32} rx={8} width={32} />
      ) : null}
      <Path
        d="M8 18.5c0-4.2 3.6-7.5 8-7.5s8 3.3 8 7.5"
        stroke={showBadge ? '#faf9f7' : '#2e7230'}
        strokeLinecap="round"
        strokeWidth={2.2}
      />
      <Path
        d="M7 19h18"
        stroke={showBadge ? '#faf9f7' : '#2e7230'}
        strokeLinecap="round"
        strokeWidth={2.2}
      />
      <Path
        d="M13 10.5c.4-1.2 1.2-2 2-2"
        stroke={showBadge ? '#d9edd9' : '#55aa55'}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
      <Path
        d="M16 9.5v-2.5"
        stroke={showBadge ? '#d9edd9' : '#55aa55'}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
      <Path
        d="M19 10.5c-.4-1.2-1.2-2-2-2"
        stroke={showBadge ? '#d9edd9' : '#55aa55'}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
      {!showBadge ? (
        <Circle cx={16} cy={16} fill="none" r={15} stroke="#e6e2dc" strokeWidth={1} />
      ) : null}
    </Svg>
  );
}
