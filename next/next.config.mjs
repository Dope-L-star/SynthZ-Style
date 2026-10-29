/* Next.js en modo export estático. Este segundo guard también cubre variables cargadas desde .env.* por Next. */
import { CLARITY_PROJECT_ID_DEFAULT, isClarityAllowed } from './lib/clarity-client.mjs';

const clarityRequested = process.env.NEXT_PUBLIC_CLARITY_ENABLED === 'true';
const clarityBuildAllowed = isClarityAllowed({
  enabled: clarityRequested,
  audience18Plus: process.env.NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS === 'true',
  adultOnlyRelease: process.env.NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE === 'true',
  ageControlVerified: process.env.NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED === 'true',
  privacyReviewed: process.env.NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED === 'true',
  projectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || CLARITY_PROJECT_ID_DEFAULT,
});
if (clarityRequested && !clarityBuildAllowed) {
  throw new Error('Build bloqueado: Microsoft Clarity requiere release solo 18+, edición adulta, control de edad validado, privacidad revisada e ID válido.');
}

export default {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false,
  poweredByHeader: false,
  reactStrictMode: true,
};
