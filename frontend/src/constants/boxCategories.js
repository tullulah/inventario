import { 
  Wrench, 
  Zap, 
  Paintbrush, 
  Hammer, 
  Shirt, 
  Book, 
  Utensils, 
  Package, 
  Gamepad2,
  Music,
  Heart,
  Laptop,
  Home,
  Car,
  Baby,
  Briefcase,
  FileText,
  Camera,
  Scissors,
  Trees
} from 'lucide-react'

export const BOX_CATEGORIES = [
  { value: 'herramientas', label: 'Herramientas', icon: Wrench, color: '#f59e0b' },
  { value: 'electronica', label: 'Electrónica', icon: Zap, color: '#3b82f6' },
  { value: 'pintura', label: 'Pintura', icon: Paintbrush, color: '#ec4899' },
  { value: 'bricolaje', label: 'Bricolaje', icon: Hammer, color: '#8b5cf6' },
  { value: 'ropa', label: 'Ropa', icon: Shirt, color: '#06b6d4' },
  { value: 'libros', label: 'Libros', icon: Book, color: '#84cc16' },
  { value: 'cocina', label: 'Cocina', icon: Utensils, color: '#f97316' },
  { value: 'general', label: 'General', icon: Package, color: '#6b7280' },
  { value: 'juguetes', label: 'Juguetes', icon: Gamepad2, color: '#ef4444' },
  { value: 'musica', label: 'Música', icon: Music, color: '#a855f7' },
  { value: 'deporte', label: 'Deporte', icon: Heart, color: '#14b8a6' },
  { value: 'informatica', label: 'Informática', icon: Laptop, color: '#6366f1' },
  { value: 'hogar', label: 'Hogar', icon: Home, color: '#f59e0b' },
  { value: 'auto', label: 'Auto', icon: Car, color: '#ef4444' },
  { value: 'bebe', label: 'Bebé', icon: Baby, color: '#ec4899' },
  { value: 'oficina', label: 'Oficina', icon: Briefcase, color: '#0ea5e9' },
  { value: 'documentos', label: 'Documentos', icon: FileText, color: '#64748b' },
  { value: 'fotografia', label: 'Fotografía', icon: Camera, color: '#7c3aed' },
  { value: 'manualidades', label: 'Manualidades', icon: Scissors, color: '#f43f5e' },
  { value: 'jardin', label: 'Jardín', icon: Trees, color: '#22c55e' }
]

export const getCategoryIcon = (categoryValue) => {
  const category = BOX_CATEGORIES.find(cat => cat.value === categoryValue)
  return category || BOX_CATEGORIES.find(cat => cat.value === 'general')
}
