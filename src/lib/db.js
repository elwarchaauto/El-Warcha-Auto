import { supabase } from './supabaseClient';

// ============================================================
// SETTINGS
// ============================================================

export const getSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
};

export const updateSettings = async (updates) => {
  const { data, error } = await supabase
    .from('settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================================
// DEALERS
// ============================================================

export const getDealers = async () => {
  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getDealerById = async (id) => {
  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const createDealer = async (dealer) => {
  const { data, error } = await supabase
    .from('dealers')
    .insert([dealer])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateDealer = async (id, updates) => {
  const { data, error } = await supabase
    .from('dealers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteDealer = async (id) => {
  const { error } = await supabase
    .from('dealers')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============================================================
// CARS
// ============================================================

export const getCars = async (filters = {}) => {
  let query = supabase
    .from('cars')
    .select(`
      *,
      car_equipment (*),
      dealers (id, name, mobile, email, google_maps_link)
    `)
    .order('created_at', { ascending: false });

  if (filters.dealer_id) query = query.eq('dealer_id', filters.dealer_id);
  if (filters.status)    query = query.eq('status', filters.status);
  if (filters.condition) query = query.eq('condition', filters.condition);
  if (filters.brand)     query = query.eq('brand', filters.brand);
  if (filters.fuel_type) query = query.eq('fuel_type', filters.fuel_type);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getCarById = async (id) => {
  const { data, error } = await supabase
    .from('cars')
    .select(`
      *,
      car_equipment (*),
      dealers (*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const createCar = async (car, equipment) => {
  const { data: newCar, error: carError } = await supabase
    .from('cars')
    .insert([car])
    .select()
    .single();
  if (carError) throw carError;

  if (equipment) {
    const { error: eqError } = await supabase
      .from('car_equipment')
      .insert([{ car_id: newCar.id, ...equipment }]);
    if (eqError) throw eqError;
  }

  return newCar;
};

export const updateCar = async (id, carUpdates, equipmentUpdates) => {
  const { data, error } = await supabase
    .from('cars')
    .update(carUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

if (equipmentUpdates) {
  const { error: eqError } = await supabase
    .from('car_equipment')
    .upsert(
      { car_id: id, ...equipmentUpdates },
      { onConflict: 'car_id', ignoreDuplicates: false }
    );
  if (eqError) throw eqError;
}

  return data;
};

export const deleteCar = async (id) => {
  // Delete equipment first (foreign key)
  await supabase.from('car_equipment').delete().eq('car_id', id);

  // Delete photos from storage
  const { data: files } = await supabase.storage
    .from('car-photos')
    .list(id.toString());
  if (files && files.length > 0) {
    const paths = files.map(f => `${id}/${f.name}`);
    await supabase.storage.from('car-photos').remove(paths);
  }

  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============================================================
// PHOTO UPLOAD (Supabase Storage)
// ============================================================

export const uploadCarPhoto = async (carId, file) => {
  const fileExt = file.name.split('.').pop().toLowerCase();
  // unique filename using timestamp + random suffix to avoid collisions
  const fileName = `${carId}/${Date.now()}_${Math.random().toString(36).slice(2,7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('car-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('car-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const uploadDealerLogo = async (dealerId, file) => {
  const fileExt = file.name.split('.').pop().toLowerCase();
  const fileName = `${dealerId}/logo.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('dealer-logos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('dealer-logos')
    .getPublicUrl(fileName);

  return data.publicUrl;
};