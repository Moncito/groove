import { supabase } from './supabase'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

export async function uploadHabitProof(uri: string, userId: string): Promise<string> {
  const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  const filePath = `proofs/${fileName}`

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  })

  const { data, error } = await supabase.storage
    .from('habit-proofs')
    .upload(filePath, decode(base64), {
      contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('habit-proofs')
    .getPublicUrl(filePath)

  return publicUrl
}
