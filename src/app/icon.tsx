import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #7c6af7 0%, #34d399 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '108px',
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: '-4px',
          }}
        >
          B
        </span>
      </div>
    ),
    size
  );
}
