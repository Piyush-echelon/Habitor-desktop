import React from 'react';

// Lightweight mapping of react-native-svg to HTML5 SVG DOM elements
export const Svg: React.FC<any> = ({ children, width, height, ...props }) => {
  return (
    <svg width={width} height={height} {...props}>
      {children}
    </svg>
  );
};

export const Circle: React.FC<any> = ({ cx, cy, r, stroke, strokeWidth, strokeDasharray, strokeDashoffset, strokeLinecap, fill, transform, ...props }) => {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeDashoffset={strokeDashoffset}
      strokeLinecap={strokeLinecap}
      fill={fill}
      transform={transform}
      {...props}
    />
  );
};

export const Path: React.FC<any> = (props) => <path {...props} />;
export const Polyline: React.FC<any> = (props) => <polyline {...props} />;
export const Line: React.FC<any> = (props) => <line {...props} />;
export const Rect: React.FC<any> = (props) => <rect {...props} />;
export const Polygon: React.FC<any> = (props) => <polygon {...props} />;
export const Defs: React.FC<any> = (props) => <defs {...props} />;
export const LinearGradient: React.FC<any> = (props) => <linearGradient {...props} />;
export const Stop: React.FC<any> = (props) => <stop {...props} />;

export default Svg;
