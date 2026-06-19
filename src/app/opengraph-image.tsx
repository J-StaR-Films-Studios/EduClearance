import { ImageResponse } from 'next/og';

import { APP_NAME } from '@/lib/site';

export const alt = `${APP_NAME} social preview`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          background: 'linear-gradient(135deg, #0b1221 0%, #10203d 55%, #11335d 100%)',
          color: '#ffffff',
          padding: '64px',
          fontFamily: 'Arial, sans-serif',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              display: 'flex',
              width: '84px',
              height: '84px',
              borderRadius: '18px',
              background: '#ffffff',
              color: '#0b1221',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              fontWeight: 800,
            }}
          >
            EC
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '54px', fontWeight: 800 }}>{APP_NAME}</div>
            <div style={{ fontSize: '24px', color: '#cbd5e1' }}>Private transfer-clearance checks for Nigerian schools</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px' }}>
          <div style={{ fontSize: '60px', fontWeight: 800, lineHeight: 1.08 }}>
            Protect your school before admitting a new student
          </div>
          <div style={{ fontSize: '28px', lineHeight: 1.35, color: '#dbeafe' }}>
            Run paid clearance checks, report unresolved issues, and coordinate school-to-school follow-up in one secure workflow.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
