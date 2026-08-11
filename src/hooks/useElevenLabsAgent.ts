'use client'

/**
 * Re-exports the AICallContext type for convenience.
 * The actual ElevenLabs logic lives inside <AICallModal />.
 * 
 * This file can be expanded in the future to add:
 * - Server-side webhook tool handlers
 * - Client tool registrations
 * - Call history tracking
 */
export type { AICallContext } from '@/components/AICallModal'
