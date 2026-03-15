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

  // Normalize car_equipment: Supabase may return it as object or array depending on FK naming
  return (data || []).map(car => ({
    ...car,
    car_equipment: car.car_equipment
      ? Array.isArray(car.car_equipment)
        ? car.car_equipment
        : [car.car_equipment]
      : [],
  }));
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

  return {
    ...data,
    car_equipment: data.car_equipment
      ? Array.isArray(data.car_equipment)
        ? data.car_equipment
        : [data.car_equipment]
      : [],
  };
};

export const createCar = async (car, equipment) => {
  // Insert car
  const { data: newCar, error: carError } = await supabase
    .from('cars')
    .insert([car])
    .select()
    .single();
  if (carError) throw carError;

  // Insert equipment
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
    // Strip any non-equipment columns (id, car_id) that may have come from a Supabase join
    const { id: _id, car_id: _cid, ...cleanEq } = equipmentUpdates;
    const { error: eqError } = await supabase
      .from('car_equipment')
      .update(cleanEq)
      .eq('car_id', id);
    if (eqError) throw eqError;
  }

  return data;
};

export const deleteCar = async (id) => {
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
  const fileExt = file.name.split('.').pop();
  const fileName = `${carId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('car-photos')
    .upload(fileName, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('car-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const uploadDealerLogo = async (dealerId, file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${dealerId}/logo.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('dealer-logos')
    .upload(fileName, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('dealer-logos')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// ============================================================
// CATALOGUE TEMPLATES
// ============================================================

export const getCatalogueTemplates = async () => {
  const { data, error } = await supabase
    .from('catalogue_templates')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const saveCatalogueTemplate = async (template) => {
  if (template.id) {
    // Update existing
    const { data, error } = await supabase
      .from('catalogue_templates')
      .update({ ...template, updated_at: new Date().toISOString() })
      .eq('id', template.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // Insert new
    const { id: _id, ...rest } = template;
    const { data, error } = await supabase
      .from('catalogue_templates')
      .insert([rest])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const deleteCatalogueTemplate = async (id) => {
  const { error } = await supabase
    .from('catalogue_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const uploadCatalogueAsset = async (templateId, slotKey, file) => {
  const ext  = file.name.split('.').pop();
  const path = `${templateId}/${slotKey}.${ext}`;
  const { error } = await supabase.storage
    .from('catalogue-assets')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage
    .from('catalogue-assets')
    .getPublicUrl(path);
  return data.publicUrl;
};
