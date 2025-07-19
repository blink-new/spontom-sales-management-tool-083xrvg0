import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Users, UserCheck, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { blink } from '@/blink/client'
import Papa from 'papaparse'

export function ImportData() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<'leads' | 'customers' | 'contracts'>('leads')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: number
    errors: string[]
    total: number
  } | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResults(null)
    }
  }

  const downloadTemplate = (type: string) => {
    const templates = {
      leads: 'name,email,phone,company,source,status,value,probability,notes\nJohn Smith,john@example.com,555-0123,TechCorp,Website,new,25000,75,Interested in our premium package\nSarah Johnson,sarah@company.com,555-0124,ABC Inc,Referral,qualified,15000,60,Follow up next week',
      customers: 'name,email,phone,company,address,industry,total_value,status,notes\nMike Wilson,mike@business.com,555-0125,Business Solutions,123 Main St,Technology,50000,active,Long-term client\nLisa Brown,lisa@startup.com,555-0126,StartupCo,456 Oak Ave,Software,25000,prospect,Potential for growth',
      contracts: 'title,customer_name,customer_email,value,content,expiry_date\nService Agreement,John Smith,john@example.com,25000,"This agreement covers...",2024-12-31\nSoftware License,Sarah Johnson,sarah@company.com,15000,"Software licensing terms...",2024-11-30'
    }

    const csvContent = templates[type as keyof typeof templates]
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const processImport = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setImportResults(null)

    try {
      const text = await selectedFile.text()
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const data = results.data as any[]
          let successCount = 0
          const errors: string[] = []

          setUploadProgress(10)

          for (let i = 0; i < data.length; i++) {
            try {
              const row = data[i]
              
              if (importType === 'leads') {
                await blink.db.leads.create({
                  name: row.name || '',
                  email: row.email || '',
                  phone: row.phone || '',
                  company: row.company || '',
                  source: row.source || 'Import',
                  status: row.status || 'new',
                  value: row.value ? parseFloat(row.value) : undefined,
                  probability: row.probability ? parseFloat(row.probability) : undefined,
                  notes: row.notes || '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              } else if (importType === 'customers') {
                await blink.db.customers.create({
                  name: row.name || '',
                  email: row.email || '',
                  phone: row.phone || '',
                  company: row.company || '',
                  address: row.address || '',
                  industry: row.industry || '',
                  total_value: row.total_value ? parseFloat(row.total_value) : 0,
                  status: row.status || 'prospect',
                  last_contact: new Date().toISOString(),
                  notes: row.notes || '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              } else if (importType === 'contracts') {
                await blink.db.contracts.create({
                  title: row.title || '',
                  customer_name: row.customer_name || '',
                  customer_id: '', // Will need to be linked manually
                  value: row.value ? parseFloat(row.value) : 0,
                  content: row.content || '',
                  status: 'draft',
                  expiry_date: row.expiry_date || '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              }

              successCount++
              setUploadProgress(10 + (i / data.length) * 80)
            } catch (error) {
              errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }

          setUploadProgress(100)
          setImportResults({
            success: successCount,
            errors,
            total: data.length
          })
        },
        error: (error) => {
          setImportResults({
            success: 0,
            errors: [`File parsing error: ${error.message}`],
            total: 0
          })
        }
      })
    } catch (error) {
      setImportResults({
        success: 0,
        errors: [`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        total: 0
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getImportIcon = (type: string) => {
    switch (type) {
      case 'leads':
        return <Users className="h-8 w-8 text-primary" />
      case 'customers':
        return <UserCheck className="h-8 w-8 text-primary" />
      case 'contracts':
        return <FileText className="h-8 w-8 text-primary" />
      default:
        return <Upload className="h-8 w-8 text-primary" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Data</h1>
        <p className="text-gray-600">Upload CSV or Excel files to import leads, customers, and contracts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Import Type Selection */}
            <div>
              <Label htmlFor="importType">Data Type</Label>
              <Select value={importType} onValueChange={(value) => setImportType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="contracts">Contracts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="file">CSV/Excel File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={processImport}
              disabled={!selectedFile || isUploading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isUploading ? 'Processing...' : 'Import Data'}
            </Button>

            {/* Download Template */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Need a template?</p>
              <Button
                variant="outline"
                onClick={() => downloadTemplate(importType)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download {importType} Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getImportIcon(importType)}
              <span>{importType.charAt(0).toUpperCase() + importType.slice(1)} Import Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {importType === 'leads' && (
              <div className="space-y-3">
                <h4 className="font-medium">Required Fields:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• <strong>name</strong> - Lead's full name</li>
                  <li>• <strong>email</strong> - Valid email address</li>
                </ul>
                <h4 className="font-medium">Optional Fields:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• phone, company, source, status</li>
                  <li>• value (deal value in dollars)</li>
                  <li>• probability (0-100)</li>
                  <li>• notes</li>
                </ul>
                <h4 className="font-medium">Status Options:</h4>
                <p className="text-sm text-gray-600">new, contacted, qualified, proposal, negotiation, closed-won, closed-lost</p>
              </div>
            )}

            {importType === 'customers' && (
              <div className="space-y-3">
                <h4 className="font-medium">Required Fields:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• <strong>name</strong> - Customer's full name</li>
                  <li>• <strong>email</strong> - Valid email address</li>
                </ul>
                <h4 className="font-medium">Optional Fields:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• phone, company, address, industry</li>
                  <li>• total_value (total business value)</li>
                  <li>• status (active, inactive, prospect)</li>
                  <li>• notes</li>
                </ul>
              </div>
            )}

            {importType === 'contracts' && (
              <div className="space-y-3">
                <h4 className="font-medium">Required Fields:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• <strong>title</strong> - Contract title</li>
                  <li>• <strong>customer_name</strong> - Customer name</li>
                  <li>• <strong>value</strong> - Contract value in dollars</li>
                </ul>
                <h4 className="font-medium">Optional Fields:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• customer_email</li>
                  <li>• content (contract terms)</li>
                  <li>• expiry_date (YYYY-MM-DD format)</li>
                </ul>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure your CSV file has headers in the first row that match the field names exactly.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Import Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                <p className="text-sm text-green-700">Successfully Imported</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{importResults.errors.length}</p>
                <p className="text-sm text-red-700">Errors</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{importResults.total}</p>
                <p className="text-sm text-blue-700">Total Rows</p>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-700">Errors:</h4>
                <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {importResults.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600 mb-1">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}