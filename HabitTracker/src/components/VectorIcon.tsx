import React from 'react';
import Svg, { Path, Circle, Polyline, Line, Rect, Polygon } from 'react-native-svg';

export type IconName =
  | 'dashboard'
  | 'analytics'
  | 'achievements'
  | 'health'
  | 'mind'
  | 'productivity'
  | 'fitness'
  | 'routine'
  | 'streak'
  | 'plus'
  | 'minus'
  | 'close'
  | 'trash'
  | 'award'
  | 'crown'
  | 'rocket'
  | 'check'
  | 'target'
  | 'trophy'
  | 'lock'
  | 'star'
  | 'gem'
  | 'sun'
  | 'moon'
  | 'leaf'
  | 'sparkles'
  | 'tasks'
  | 'menu'
  | 'settings';

interface VectorIconProps {
  name: IconName;
  color: string;
  size?: number;
}

export const VectorIcon: React.FC<VectorIconProps> = ({ name, color, size = 20 }) => {
  // Render custom thin-stroke SVG vectors matching the Lucide / Feather icon style
  switch (name) {
    case 'tasks':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="9 11 12 14 22 4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'dashboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polygon
            points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'analytics':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'achievements':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4 22h16"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 2a6 6 0 0 0-6 6v3.5c0 3 2.5 5.5 6 5.5s6-2.5 6-5.5V8a6 6 0 0 0-6-6z"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'health':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'mind':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="12" r="1" fill={color} />
        </Svg>
      );
    case 'productivity':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect
            x="2"
            y="7"
            width="20"
            height="14"
            rx="2"
            ry="2"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'fitness':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="6.5" y1="6.5" x2="17.5" y2="17.5" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <Line x1="18" y1="13.5" x2="13.5" y2="18" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <Line x1="10.5" y1="6" x2="6" y2="10.5" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <Circle cx="5" cy="5" r="2.5" stroke={color} strokeWidth="1.5" fill="none" />
          <Circle cx="19" cy="19" r="2.5" stroke={color} strokeWidth="1.5" fill="none" />
        </Svg>
      );
    case 'routine':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
          <Polyline
            points="12 6 12 12 16 14"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'streak':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      );
    case 'minus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'award':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="8" r="7" stroke={color} strokeWidth="2" fill="none" />
          <Polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'crown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M3 20h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'rocket':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M21 2c-2 2-5 3-7 4L8 12c-1.5 1.5-2.5 3.5-3 5.5L3 21l3.5-2c2-0.5 4-1.5 5.5-3l6-6c1-2 2-5 4-7z"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M12 12L9 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M16 8L13 11" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M9 21h-3a3 3 0 0 1-3-3v-3" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'target':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
          <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" fill="none" />
          <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 22h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 2a6 6 0 0 0-6 6v3.5c0 3 2.5 5.5 6 5.5s6-2.5 6-5.5V8a6 6 0 0 0-6-6z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'gem':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polygon points="6 3 18 3 22 9 12 22 2 9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="11 3 8 9 2 9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="13 3 16 9 22 9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="8 9 12 22 16 9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" fill="none" />
          <Line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-13.9.2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 22L12 17" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'sparkles':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 3l1 2.5L8.5 6 6 7l-1 2.5L4 7l-2.5-1L4 5z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M19 17l1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return null;
  }
};
