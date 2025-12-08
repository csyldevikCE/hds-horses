import { supabase, calculateAge } from '@/lib/supabase'
import { Horse } from '@/types/horse'
import { Database } from '@/lib/supabase'

type HorseRow = Database['public']['Tables']['horses']['Row']
type HorseInsert = Database['public']['Tables']['horses']['Insert']
type HorseUpdate = Database['public']['Tables']['horses']['Update']

// Helper to add timeout to promises
const withTimeout = <T>(promise: PromiseLike<T>, ms: number, errorMsg: string): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMsg)), ms)
  )
  return Promise.race([Promise.resolve(promise), timeout])
}

// Convert database row to Horse interface
const mapHorseRowToHorse = async (row: HorseRow): Promise<Horse> => {
  // Fetch related data - each query has its own timeout (5 seconds)
  // Use Promise.allSettled so one failure doesn't block others
  let imagesResult: { data: any[] | null; error: any } = { data: [], error: null }
  let videosResult: { data: any[] | null; error: any } = { data: [], error: null }
  let competitionsResult: { data: any[] | null; error: any } = { data: [], error: null }

  try {
    const results = await Promise.allSettled([
      withTimeout(
        supabase
          .from('horse_images')
          .select('*')
          .eq('horse_id', row.id)
          .order('is_primary', { ascending: false })
          .then(r => r),
        5000,
        'Timeout fetching images'
      ),
      withTimeout(
        supabase
          .from('horse_videos')
          .select('*')
          .eq('horse_id', row.id)
          .then(r => r),
        5000,
        'Timeout fetching videos'
      ),
      withTimeout(
        supabase
          .from('competitions')
          .select('*')
          .eq('horse_id', row.id)
          .order('date', { ascending: false })
          .then(r => r),
        5000,
        'Timeout fetching competitions'
      )
    ])

    // Extract results safely
    if (results[0].status === 'fulfilled') imagesResult = results[0].value
    if (results[1].status === 'fulfilled') videosResult = results[1].value
    if (results[2].status === 'fulfilled') competitionsResult = results[2].value
  } catch (error) {
    // On error, continue with empty arrays - horse data is still valid
    console.warn(`Failed to fetch related data for horse ${row.id}:`, error)
  }



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
    // Add timeout to the main query (15 seconds)
    const queryPromise = supabase
      .from('horses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .then(result => result)

    const { data, error } = await withTimeout(
      queryPromise,
      15000,
      'Timeout fetching horses list'
    )

    if (error) throw error
    if (!data || data.length === 0) return []

    // Use Promise.allSettled to prevent one horse from blocking the entire list
    // Process in smaller batches to avoid overwhelming the connection
    const BATCH_SIZE = 5
    const horses: Horse[] = []

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(batch.map(mapHorseRowToHorse))

      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        if (result.status === 'fulfilled') {
          horses.push(result.value)
        } else {
          // If mapping fails, create a minimal horse object from the row data
          console.warn(`Failed to fully load horse ${batch[j].id}:`, result.reason)
          const row = batch[j]
          horses.push({
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
            pedigree: undefined,
            health: {
              vaccinations: row.health_vaccinations,
              coggins: row.health_coggins,
              lastVetCheck: row.health_last_vet_check
            },
            training: {
              level: row.training_level,
              disciplines: row.training_disciplines
            },
            competitions: [],
            images: [],
            videos: [],
            location: row.location,
            dateAdded: row.date_added,
          })
        }
      }
    }

    return horses
  },

  // Get a single horse by ID
  async getHorse(id: string): Promise<Horse | null> {
    // Add timeout to the query (10 seconds)
    const queryPromise = supabase
      .from('horses')
      .select('*')
      .eq('id', id)
      .single()
      .then(result => result)

    const { data, error } = await withTimeout(
      queryPromise,
      10000,
      'Timeout fetching horse details'
    )

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
      // BLUP fields
      regno: updates.regno !== undefined ? updates.regno : undefined,
      chip_number: updates.chipNumber !== undefined ? updates.chipNumber : undefined,
      wffs_status: updates.wffsStatus !== undefined ? updates.wffsStatus : undefined,
      stud_book_no: updates.studBookNo !== undefined ? updates.studBookNo : undefined,
      life_no: updates.lifeNo !== undefined ? updates.lifeNo : undefined,
      foreign_no: updates.foreignNo !== undefined ? updates.foreignNo : undefined,
      owner: updates.owner !== undefined ? updates.owner : undefined,
      breeder: updates.breeder !== undefined ? updates.breeder : undefined,
      blup_url: updates.blupUrl !== undefined ? updates.blupUrl : undefined,
      last_blup_sync: updates.lastBlupSync !== undefined ? updates.lastBlupSync : undefined,
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

  // Delete a horse and all related data
  async deleteHorse(id: string): Promise<void> {
    // First, get all vet_visits for this horse to delete their documents
    const { data: vetVisits } = await supabase
      .from('vet_visits')
      .select('id')
      .eq('horse_id', id)

    // Delete vet_visit_documents for all vet visits of this horse
    if (vetVisits && vetVisits.length > 0) {
      const vetVisitIds = vetVisits.map(v => v.id)
      await supabase
        .from('vet_visit_documents')
        .delete()
        .in('vet_visit_id', vetVisitIds)
    }

    // Get all share_links to delete their views
    const { data: shareLinks } = await supabase
      .from('share_links')
      .select('id')
      .eq('horse_id', id)

    // Delete share_link_views for all share links of this horse
    if (shareLinks && shareLinks.length > 0) {
      const shareLinkIds = shareLinks.map(s => s.id)
      await supabase
        .from('share_link_views')
        .delete()
        .in('share_link_id', shareLinkIds)
    }

    // Delete all directly related records in parallel
    await Promise.all([
      supabase.from('horse_images').delete().eq('horse_id', id),
      supabase.from('horse_videos').delete().eq('horse_id', id),
      supabase.from('competitions').delete().eq('horse_id', id),
      supabase.from('vaccinations').delete().eq('horse_id', id),
      supabase.from('vet_visits').delete().eq('horse_id', id),
      supabase.from('horse_xrays').delete().eq('horse_id', id),
      supabase.from('veterinary_documents').delete().eq('horse_id', id),
      supabase.from('share_links').delete().eq('horse_id', id),
    ])

    // Finally delete the horse itself
    const { error } = await supabase
      .from('horses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Add image to horse
  async addHorseImage(horseId: string, image: { url: string; caption?: string; isPrimary: boolean }): Promise<void> {
    const { error } = await supabase
      .from('horse_images')
      .insert({
        horse_id: horseId,
        url: image.url,
        caption: image.caption || null,
        is_primary: image.isPrimary
      })

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