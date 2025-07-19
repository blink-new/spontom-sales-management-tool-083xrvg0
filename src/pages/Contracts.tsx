import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Filter, Send, FileText, Edit, Trash2, CheckCircle, Eye } from 'lucide-react'
import { blink } from '@/blink/client'
import type { Contract } from '@/types'

export function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewContract, setPreviewContract] = useState<Contract | null>(null)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    customer_name: '',
    customer_email: '',
    amount: '',
    content: ''
  })

  useEffect(() => {
    loadContracts()
  }, [])

  useEffect(() => {
    filterContracts()
  }, [filterContracts])

  const loadContracts = async () => {
    try {
      const data = await blink.db.contracts.list({
        orderBy: { created_at: 'desc' }
      })
      setContracts(data)
    } catch (error) {
      console.error('Error loading contracts:', error)
    }
  }

  const filterContracts = useCallback(() => {
    let filtered = contracts

    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter)
    }

    setFilteredContracts(filtered)
  }, [contracts, searchTerm, statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const contractData = {
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'draft' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (editingContract) {
        await blink.db.contracts.update(editingContract.id, contractData)
      } else {
        await blink.db.contracts.create(contractData)
      }

      await loadContracts()
      resetForm()
    } catch (error) {
      console.error('Error saving contract:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contract?')) {
      try {
        await blink.db.contracts.delete(id)
        await loadContracts()
      } catch (error) {
        console.error('Error deleting contract:', error)
      }
    }
  }

  const handleSendForSignature = async (contract: Contract) => {
    try {
      // Simulate sending email with contract link
      const signatureUrl = `https://spontom-sales.blink.new/sign/${contract.id}`
      
      await blink.db.contracts.update(contract.id, {
        status: 'sent',
        signature_url: signatureUrl,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updated_at: new Date().toISOString()
      })
      
      // Send email via Blink notifications
      await blink.notifications.email({
        to: contract.customer_email,
        subject: `Contract Ready for Signature: ${contract.title}`,
        html: `
          <h2>Contract Ready for Your Signature</h2>
          <p>Dear ${contract.customer_name},</p>
          <p>Your contract "${contract.title}" is ready for signature.</p>
          <p><strong>Contract Amount:</strong> $${contract.amount.toLocaleString()}</p>
          <p>Please click the link below to review and sign the contract:</p>
          <p><a href="${signatureUrl}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Sign Contract</a></p>
          <p>This link will expire in 30 days.</p>
          <p>Best regards,<br>Spontom Sales Team</p>
        `,
        text: `Contract Ready for Your Signature\n\nDear ${contract.customer_name},\n\nYour contract "${contract.title}" is ready for signature.\nContract Amount: $${contract.amount.toLocaleString()}\n\nPlease visit: ${signatureUrl}\n\nThis link will expire in 30 days.\n\nBest regards,\nSpontom Sales Team`
      })
      
      await loadContracts()
      alert(`Contract sent to ${contract.customer_email} for signature!`)
    } catch (error) {
      console.error('Error sending contract:', error)
      alert('Failed to send contract. Please try again.')
    }
  }

  const handleMarkAsSigned = async (contract: Contract) => {
    try {
      await blink.db.contracts.update(contract.id, {
        status: 'signed',
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      await loadContracts()
      alert('Contract marked as signed!')
    } catch (error) {
      console.error('Error updating contract:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      customer_name: '',
      customer_email: '',
      amount: '',
      content: ''
    })
    setEditingContract(null)
    setIsAddDialogOpen(false)
  }

  const startEdit = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      title: contract.title,
      customer_name: contract.customer_name,
      customer_email: contract.customer_email,
      amount: contract.amount.toString(),
      content: contract.content
    })
    setIsAddDialogOpen(true)
  }

  const showPreview = (contract: Contract) => {
    setPreviewContract(contract)
    setIsPreviewDialogOpen(true)
  }

  const getStatusColor = (status: Contract['status']) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'signed': 'bg-green-100 text-green-800',
      'expired': 'bg-red-100 text-red-800'
    }
    return colors[status]
  }

  const getDefaultContractTemplate = () => {
    return `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on [DATE] between Spontom ("Company") and [CUSTOMER_NAME] ("Client").

1. SERVICES
Company agrees to provide the following services:
- [Describe services here]

2. PAYMENT TERMS
Total Contract Value: $[AMOUNT]
Payment Schedule: [Payment terms]

3. TERM
This agreement shall commence on [START_DATE] and continue until [END_DATE].

4. RESPONSIBILITIES
Company Responsibilities:
- [List company responsibilities]

Client Responsibilities:
- [List client responsibilities]

5. TERMS AND CONDITIONS
- [Additional terms and conditions]

By signing below, both parties agree to the terms outlined in this agreement.

Company: Spontom
Signature: ___________________ Date: ___________

Client: [CUSTOMER_NAME]
Signature: ___________________ Date: ___________`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contracts & E-Signatures</h1>
          <p className="text-gray-600">Create, send, and manage contracts with digital signatures</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContract ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Contract Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Service Agreement, Sales Contract..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Contract Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Customer Email *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="content">Contract Content *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, content: getDefaultContractTemplate() })}
                  >
                    Use Template
                  </Button>
                </div>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={15}
                  placeholder="Enter the contract terms and conditions..."
                  className="font-mono text-sm"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingContract ? 'Update Contract' : 'Create Contract'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contracts</p>
                <p className="text-2xl font-bold">{contracts.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Signature</p>
                <p className="text-2xl font-bold">
                  {contracts.filter(c => c.status === 'sent').length}
                </p>
              </div>
              <Send className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Signed Contracts</p>
                <p className="text-2xl font-bold">
                  {contracts.filter(c => c.status === 'signed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  ${contracts.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-green-600 text-2xl font-bold">$</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent for Signature</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts ({filteredContracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.title}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contract.customer_name}</div>
                      <div className="text-sm text-gray-500">{contract.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>${contract.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contract.status)}>
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(contract.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => showPreview(contract)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {contract.status === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSendForSignature(contract)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                      {contract.status === 'sent' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMarkAsSigned(contract)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Signed
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => startEdit(contract)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(contract.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contract Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Preview: {previewContract?.title}</DialogTitle>
          </DialogHeader>
          {previewContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{previewContract.customer_name}</p>
                  <p className="text-sm text-gray-500">{previewContract.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium text-lg">${previewContract.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(previewContract.status)}>
                    {previewContract.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{new Date(previewContract.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="border rounded-lg p-6 bg-white">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {previewContract.content
                    .replace(/\[CUSTOMER_NAME\]/g, previewContract.customer_name)
                    .replace(/\[AMOUNT\]/g, previewContract.amount.toLocaleString())
                    .replace(/\[DATE\]/g, new Date().toLocaleDateString())
                  }
                </pre>
              </div>
              {previewContract.signature_url && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">Signature Link:</p>
                  <p className="text-sm font-mono break-all">{previewContract.signature_url}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}