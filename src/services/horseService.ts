import { supabase, calculateAge } from '@/lib/supabase'
import { Horse } from '@/types/horse'
import { Database } from '@/lib/supabase'

type HorseRow = Database['public']['Tables']['horses']['Row']
type HorseInsert = Database['public']['Tables']['horses']['Insert']
type HorseUpdate = Database['public']['Tables']['horses']['Update']

// Convert database row to Horse interface
const mapHorseRowToHorse = async (row: HorseRow): Promise<Horse> => {
  // Fetch related data
  const [imagesResult, videosResult, competitionsResult] = await Promise.all([
    supabase
      .from('horse_images')
      .select('*')
      .eq('horse_id', row.id)
      .order('is_primary', { ascending: false }),
    supabase
      .from('horse_videos')
      .select('*')
      .eq('horse_id', row.id),
    supabase
      .from('competitions')
      .select('*')
      .eq('horse_id', row.id)
      .order('date', { ascending: false })
  ])



  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    age: calculateAge(row.birth_year),
    birthYear: row.birth_year,
    color: row.color,
    gender: row.gender,
    height: row.height,
    weight: row.weight || undefined,
    price: row.price || undefined,
    status: row.status,
    description: row.description,
    pedigree: row.pedigree_sire || row.pedigree_dam ? {
      sire: row.pedigree_sire || '',
      dam: row.pedigree_dam || '',
      sireSire: row.pedigree_sire_sire || undefined,
      sireDam: row.pedigree_sire_dam || undefined,
      damSire: row.pedigree_dam_sire || undefined,
      damDam: row.pedigree_dam_dam || undefined,
      sireSireSire: row.pedigree_sire_sire_sire || undefined,
      sireSireDam: row.pedigree_sire_sire_dam || undefined,
      sireDamSire: row.pedigree_sire_dam_sire || undefined,
      sireDamDam: row.pedigree_sire_dam_dam || undefined,
      damSireSire: row.pedigree_dam_sire_sire || undefined,
      damSireDam: row.pedigree_dam_sire_dam || undefined,
      damDamSire: row.pedigree_dam_dam_sire || undefined,
      damDamDam: row.pedigree_dam_dam_dam || undefined
    } : undefined,
    health: {
      vaccinations: row.health_vaccinations,
      coggins: row.health_coggins,
      lastVetCheck: row.health_last_vet_check
    },
    training: {
      level: row.training_level,
      disciplines: row.training_disciplines
    },
    competitions: competitionsResult.data?.map(comp => ({
      id: comp.id,
      event: comp.event,
      date: comp.date,
      discipline: comp.discipline,
      placement: comp.placement,
      notes: comp.notes || undefined,
      equipeLink: comp.equipe_link || undefined
    })) || [],
    images: imagesResult.data?.map(img => ({
      id: img.id,
      url: img.url,
      caption: img.caption || undefined,
      isPrimary: img.is_primary
    })) || [],
    videos: videosResult.data?.map(video => ({
      id: video.id,
      url: video.url,
      caption: video.caption || undefined,
      thumbnail: video.thumbnail || undefined
    })) || [],
    location: row.location,
    dateAdded: row.date_added,
    // BLUP fields
    regno: row.regno || undefined,
    chipNumber: row.chip_number || undefined,
    wffsStatus: row.wffs_status !== null ? row.wffs_status : undefined,
    studBookNo: row.stud_book_no || undefined,
    lifeNo: row.life_no || undefined,
    foreignNo: row.foreign_no || undefined,
    owner: row.owner || undefined,
    breeder: row.breeder || undefined,
    blupUrl: row.blup_url || undefined,
    lastBlupSync: row.last_blup_sync || undefined
  }
}

// Convert Horse interface to database insert
const mapHorseToInsert = (
  horse: Omit<Horse, 'id' | 'dateAdded'>,
  userId: string,
  organizationId: string
): HorseInsert => {
  return {
    name: horse.name,
    breed: horse.breed,
    birth_year: horse.birthYear,
    color: horse.color,
    gender: horse.gender,
    height: horse.height,
    weight: horse.weight || null,
    price: horse.price || null,
    status: horse.status,
    description: horse.description,
    pedigree_sire: horse.pedigree?.sire || null,
    pedigree_dam: horse.pedigree?.dam || null,
    pedigree_sire_sire: horse.pedigree?.sireSire || null,
    pedigree_sire_dam: horse.pedigree?.sireDam || null,
    pedigree_dam_sire: horse.pedigree?.damSire || null,
    pedigree_dam_dam: horse.pedigree?.damDam || null,
    pedigree_sire_sire_sire: horse.pedigree?.sireSireSire || null,
    pedigree_sire_sire_dam: horse.pedigree?.sireSireDam || null,
    pedigree_sire_dam_sire: horse.pedigree?.sireDamSire || null,
    pedigree_sire_dam_dam: horse.pedigree?.sireDamDam || null,
    pedigree_dam_sire_sire: horse.pedigree?.damSireSire || null,
    pedigree_dam_sire_dam: horse.pedigree?.damSireDam || null,
    pedigree_dam_dam_sire: horse.pedigree?.damDamSire || null,
    pedigree_dam_dam_dam: horse.pedigree?.damDamDam || null,
    health_vaccinations: horse.health.vaccinations,
    health_coggins: horse.health.coggins,
    health_last_vet_check: horse.health.lastVetCheck,
    training_level: horse.training.level,
    training_disciplines: horse.training.disciplines,
    location: horse.location,
    date_added: new Date().toISOString().split('T')[0],
    user_id: userId,
    organization_id: organizationId,
  }
}

export const horseService = {
  // Get all horses for the organization (RLS will enforce access)
  async getHorses(organizationId: string): Promise<Horse[]> {
    const { data, error } = await supabase
      .from('horses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    const horses = await Promise.all(data.map(mapHorseRowToHorse))
    return horses
  },

  // Get a single horse by ID
  async getHorse(id: string): Promise<Horse | null> {
    const { data, error } = await supabase
      .from('horses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }

    return mapHorseRowToHorse(data)
  },

  // Create a new horse
  async createHorse(
    horse: Omit<Horse, 'id' | 'dateAdded'>,
    userId: string,
    organizationId: string
  ): Promise<Horse> {
    const horseData = mapHorseToInsert(horse, userId, organizationId)

    const { data, error } = await supabase
      .from('horses')
      .insert(horseData)
      .select()
      .single()

    if (error) throw error

    // Insert images
    if (horse.images.length > 0) {
      const imageData = horse.images.map(img => ({
        horse_id: data.id,
        url: img.url,
        caption: img.caption || null,
        is_primary: img.isPrimary
      }))

      const { error: imageError } = await supabase
        .from('horse_images')
        .insert(imageData)

      if (imageError) throw imageError
    }

    // Insert videos
    if (horse.videos && horse.videos.length > 0) {
      const videoData = horse.videos.map(video => ({
        horse_id: data.id,
        url: video.url,
        caption: video.caption || null,
        thumbnail: video.thumbnail || null
      }))

      const { error: videoError } = await supabase
        .from('horse_videos')
        .insert(videoData)

      if (videoError) throw videoError
    }

    // Insert competitions
    if (horse.competitions && horse.competitions.length > 0) {
      const competitionData = horse.competitions.map(comp => ({
        horse_id: data.id,
        event: comp.event,
        date: comp.date,
        discipline: comp.discipline,
        placement: comp.placement,
        notes: comp.notes || null,
        equipe_link: comp.equipeLink || null
      }))

      const { error: compError } = await supabase
        .from('competitions')
        .insert(competitionData)

      if (compError) throw compError
    }

    return mapHorseRowToHorse(data)
  },

  // Update a horse
  async updateHorse(id: string, updates: Partial<Horse>): Promise<Horse> {
    const updateData: HorseUpdate = {
      name: updates.name,
      breed: updates.breed,
      birth_year: updates.birthYear,
      color: updates.color,
      gender: updates.gender,
      height: updates.height,
      weight: updates.weight || null,
      price: updates.price || null,
      status: updates.status,
      description: updates.description,
      pedigree_sire: updates.pedigree?.sire || null,
      pedigree_dam: updates.pedigree?.dam || null,
      pedigree_sire_sire: updates.pedigree?.sireSire || null,
      pedigree_sire_dam: updates.pedigree?.sireDam || null,
      pedigree_dam_sire: updates.pedigree?.damSire || null,
      pedigree_dam_dam: updates.pedigree?.damDam || null,
      pedigree_sire_sire_sire: updates.pedigree?.sireSireSire || null,
      pedigree_sire_sire_dam: updates.pedigree?.sireSireDam || null,
      pedigree_sire_dam_sire: updates.pedigree?.sireDamSire || null,
      pedigree_sire_dam_dam: updates.pedigree?.sireDamDam || null,
      pedigree_dam_sire_sire: updates.pedigree?.damSireSire || null,
      pedigree_dam_sire_dam: updates.pedigree?.damSireDam || null,
      pedigree_dam_dam_sire: updates.pedigree?.damDamSire || null,
      pedigree_dam_dam_dam: updates.pedigree?.damDamDam || null,
      health_vaccinations: updates.health?.vaccinations,
      health_coggins: updates.health?.coggins,
      health_last_vet_check: updates.health?.lastVetCheck,
      training_level: updates.training?.level,
      training_disciplines: updates.training?.disciplines,
      location: updates.location,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('horses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Handle competitions update
    if (updates.competitions !== undefined) {
      // Delete existing competitions
      await supabase
        .from('competitions')
        .delete()
        .eq('horse_id', id)

      // Insert new competitions
      if (updates.competitions.length > 0) {
        const competitionData = updates.competitions.map(comp => ({
          horse_id: id,
          event: comp.event,
          date: comp.date,
          discipline: comp.discipline,
          placement: comp.placement,
          notes: comp.notes || null,
          equipe_link: comp.equipeLink || null
        }))

        const { error: compError } = await supabase
          .from('competitions')
          .insert(competitionData)

        if (compError) throw compError
      }
    }

    return mapHorseRowToHorse(data)
  },

  // Delete a horse
  async deleteHorse(id: string): Promise<void> {
    // Delete related records first
    await Promise.all([
      supabase.from('horse_images').delete().eq('horse_id', id),
      supabase.from('horse_videos').delete().eq('horse_id', id),
      supabase.from('competitions').delete().eq('horse_id', id)
    ])

    const { error } = await supabase
      .from('horses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Add image to horse
  async addHorseImage(horseId: string, image: { url: string; caption?: string; isPrimary: boolean }): Promise<void> {
    const { data, error } = await supabase
      .from('horse_images')
      .insert({
        horse_id: horseId,
        url: image.url,
        caption: image.caption || null,
        is_primary: image.isPrimary
      })
      .select()

    if (error) throw error
  },

  // Remove image from horse
  async removeHorseImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('horse_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error
  },

  // Add video to horse
  async addHorseVideo(horseId: string, video: { url: string; caption?: string; thumbnail?: string }): Promise<void> {
    const { error } = await supabase
      .from('horse_videos')
      .insert({
        horse_id: horseId,
        url: video.url,
        caption: video.caption || null,
        thumbnail: video.thumbnail || null
      })

    if (error) throw error
  },

  // Remove video from horse
  async removeHorseVideo(videoId: string): Promise<void> {
    const { error } = await supabase
      .from('horse_videos')
      .delete()
      .eq('id', videoId)

    if (error) throw error
  },

  // Add competition to horse
  async addCompetition(horseId: string, competition: {
    event: string;
    date: string;
    discipline: string;
    placement: string;
    notes?: string;
    equipeLink?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('competitions')
      .insert({
        horse_id: horseId,
        event: competition.event,
        date: competition.date,
        discipline: competition.discipline,
        placement: competition.placement,
        notes: competition.notes || null,
        equipe_link: competition.equipeLink || null
      })

    if (error) throw error
  },

  // Remove competition from horse
  async removeCompetition(competitionId: string): Promise<void> {
    const { error } = await supabase
      .from('competitions')
      .delete()
      .eq('id', competitionId)

    if (error) throw error
  }
} 