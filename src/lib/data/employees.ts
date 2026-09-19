import { supabase } from '../supabase/client';
import { PublicEmployee } from '../../types/employee';

/**
 * Retrieves the list of active employees safely via the public view.
 * Does not expose mobile numbers.
 */
export async function getActiveEmployees(): Promise<PublicEmployee[]> {
  const { data, error } = await supabase
    .from('public_employee_directory')
    .select('id, name, department')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching active employees:', error);
    return [];
  }

  return data as PublicEmployee[];
}
