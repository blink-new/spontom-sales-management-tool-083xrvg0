export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  value?: number
  probability?: number
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  industry?: string
  total_value?: number
  status: 'active' | 'inactive' | 'prospect'
  last_contact?: string
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Contract {
  id: string
  title: string
  customer_id: string
  customer_name: string
  value: number
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled'
  content: string
  expiry_date?: string
  sent_date?: string
  signed_date?: string
  signature_url?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface ImportData {
  id: string
  filename: string
  type: 'leads' | 'customers' | 'contracts'
  status: 'processing' | 'completed' | 'failed'
  total_records: number
  processed_records: number
  errors?: string[]
  created_at: string
  user_id: string
}