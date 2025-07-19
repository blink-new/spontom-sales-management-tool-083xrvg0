import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Send, 
  Mail, 
  Inbox, 
  Archive, 
  Trash2, 
  Reply, 
  Forward,
  Search,
  Calendar
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { Customer, Lead } from '@/types'

interface EmailMessage {
  id: string
  to: string
  from: string
  subject: string
  content: string
  html_content?: string
  status: 'draft' | 'sent' | 'delivered' | 'failed'
  sent_at?: string
  created_at: string
  user_id: string
  customer_id?: string
  lead_id?: string
  thread_id?: string
}

export function Email() {
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('inbox')
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    content: '',
    recipient_type: 'custom' as 'custom' | 'customer' | 'lead',
    recipient_id: ''
  })

  useEffect(() => {
    loadEmails()
    loadCustomers()
    loadLeads()
  }, [])

  const loadEmails = async () => {
    try {
      const data = await blink.db.emails.list({
        orderBy: { created_at: 'desc' }
      })
      setEmails(data)
    } catch (error) {
      console.error('Error loading emails:', error)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await blink.db.customers.list()
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadLeads = async () => {
    try {
      const data = await blink.db.leads.list()
      setLeads(data)
    } catch (error) {
      console.error('Error loading leads:', error)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let recipientEmail = formData.to
      let recipientName = ''
      
      // Get recipient email based on type
      if (formData.recipient_type === 'customer' && formData.recipient_id) {
        const customer = customers.find(c => c.id === formData.recipient_id)
        if (customer) {
          recipientEmail = customer.email
          recipientName = customer.name
        }
      } else if (formData.recipient_type === 'lead' && formData.recipient_id) {
        const lead = leads.find(l => l.id === formData.recipient_id)
        if (lead) {
          recipientEmail = lead.email
          recipientName = lead.name
        }
      }

      // Send email via Blink notifications
      const result = await blink.notifications.email({
        to: recipientEmail,
        subject: formData.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #16a34a;">
              <h1 style="color: #16a34a; margin: 0;">Spontom</h1>
            </div>
            <div style="padding: 30px 20px;">
              ${formData.content.replace(/\n/g, '<br>')}
            </div>
            <div style="background: #f8f9fa; padding: 15px 20px; text-align: center; font-size: 12px; color: #666;">
              <p>This email was sent from Spontom Sales Management System</p>
            </div>
          </div>
        `,
        text: formData.content
      })

      // Save email to database
      await blink.db.emails.create({
        to: recipientEmail,
        from: 'noreply@spontom.com',
        subject: formData.subject,
        content: formData.content,
        status: result.success ? 'sent' : 'failed',
        sent_at: result.success ? new Date().toISOString() : undefined,
        created_at: new Date().toISOString(),
        customer_id: formData.recipient_type === 'customer' ? formData.recipient_id : undefined,
        lead_id: formData.recipient_type === 'lead' ? formData.recipient_id : undefined
      })

      // Update last contact for customer/lead
      if (formData.recipient_type === 'customer' && formData.recipient_id) {
        await blink.db.customers.update(formData.recipient_id, {
          last_contact: new Date().toISOString()
        })
      }

      await loadEmails()
      resetForm()
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      to: '',
      subject: '',
      content: '',
      recipient_type: 'custom',
      recipient_id: ''
    })
    setIsComposeOpen(false)
  }

  const getFilteredEmails = () => {
    let filtered = emails

    if (searchTerm) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch (activeTab) {
      case 'sent':
        return filtered.filter(email => email.status === 'sent' || email.status === 'delivered')
      case 'drafts':
        return filtered.filter(email => email.status === 'draft')
      case 'failed':
        return filtered.filter(email => email.status === 'failed')
      default:
        return filtered
    }
  }

  const getStatusColor = (status: EmailMessage['status']) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getRecipientName = (email: EmailMessage) => {
    if (email.customer_id) {
      const customer = customers.find(c => c.id === email.customer_id)
      return customer ? `${customer.name} (${customer.company || 'Customer'})` : email.to
    }
    if (email.lead_id) {
      const lead = leads.find(l => l.id === email.lead_id)
      return lead ? `${lead.name} (${lead.company || 'Lead'})` : email.to
    }
    return email.to
  }

  const filteredEmails = getFilteredEmails()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email</h1>
          <p className="text-gray-600">Send and manage email communications with customers and leads</p>
        </div>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Compose Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Compose Email</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient_type">Recipient Type</Label>
                  <Select 
                    value={formData.recipient_type} 
                    onValueChange={(value) => setFormData({ ...formData, recipient_type: value as any, recipient_id: '', to: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Email</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  {formData.recipient_type === 'custom' ? (
                    <>
                      <Label htmlFor="to">To *</Label>
                      <Input
                        id="to"
                        type="email"
                        value={formData.to}
                        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                        placeholder="recipient@example.com"
                        required
                      />
                    </>
                  ) : formData.recipient_type === 'customer' ? (
                    <>
                      <Label htmlFor="customer">Customer *</Label>
                      <Select 
                        value={formData.recipient_id} 
                        onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <>
                      <Label htmlFor="lead">Lead *</Label>
                      <Select 
                        value={formData.recipient_id} 
                        onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.name} - {lead.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Email subject"
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  placeholder="Type your message here..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Emails</p>
                <p className="text-2xl font-bold">{emails.length}</p>
              </div>
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent Today</p>
                <p className="text-2xl font-bold">
                  {emails.filter(e => 
                    e.sent_at && 
                    new Date(e.sent_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold">{emails.filter(e => e.status === 'delivered' || e.status === 'sent').length}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold">{emails.filter(e => e.status === 'failed').length}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Interface */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Email Management</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="inbox" className="flex items-center space-x-2">
                <Inbox className="h-4 w-4" />
                <span>All Emails</span>
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Sent</span>
              </TabsTrigger>
              <TabsTrigger value="drafts" className="flex items-center space-x-2">
                <Archive className="h-4 w-4" />
                <span>Drafts</span>
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex items-center space-x-2">
                <Trash2 className="h-4 w-4" />
                <span>Failed</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{getRecipientName(email)}</p>
                          <p className="text-sm text-gray-500">{email.to}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {email.content.substring(0, 100)}...
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(email.status)}>
                          {email.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {email.sent_at 
                              ? new Date(email.sent_at).toLocaleDateString()
                              : 'Not sent'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" title="View email">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Reply">
                            <Reply className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Forward">
                            <Forward className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}