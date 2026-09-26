/**
 * Application-wide constants.
 * Centralised so they are easy to update and reference consistently.
 */

/** Backend API base URL — proxied via Vite in development */
export const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '/api/v1'

/** Application display name */
export const APP_NAME = 'LegalAI'

/** Application tagline */
export const APP_TAGLINE = 'AI-Powered Legal Document Assistant'

/** Maximum file upload size in bytes (20 MB) */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

/** Human-readable max file size */
export const MAX_FILE_SIZE_LABEL = '20 MB'

/** Accepted file MIME types and extensions */
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
} as const

/** Legal disclaimer text — shown consistently across the application */
export const LEGAL_DISCLAIMER =
  'LegalAI provides legal information, not legal advice. ' +
  'It is not a substitute for a qualified legal professional. ' +
  'Always consult a licensed attorney for advice specific to your situation.'

/** Risk severity levels */
export const RISK_LEVELS = ['high', 'medium', 'low'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

