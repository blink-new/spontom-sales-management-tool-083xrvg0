import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Phone,
  Mail,
  Calendar,
  Target
} from 'lucide-react'
import { blink } from '@/blink/client'

export function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    activeContracts: 0,
    conversionRate: 0,
    monthlyGrowth: 0
  })

  const [recentActivities, setRecentActivities] = useState([])
  const [pipelineData, setPipelineData] = useState([
    { stage: 'New Leads', count: 12, value: 45000 },
    { stage: 'Qualified', count: 8, value: 32000 },
    { stage: 'Proposal', count: 5, value: 28000 },
    { stage: 'Negotiation', count: 3, value: 15000 },
    { stage: 'Closed Won', count: 2, value: 12000 }
  ])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load leads
      const leads = await blink.db.leads.list()
      const customers = await blink.db.customers.list()
      const contracts = await blink.db.contracts.list()

      setStats({
        totalLeads: leads.length,
        totalCustomers: customers.length,
        totalRevenue: customers.reduce((sum, c) => sum + (c.total_value || 0), 0),
        activeContracts: contracts.filter(c => c.status === 'sent' || c.status === 'signed').length,
        conversionRate: leads.length > 0 ? (customers.length / leads.length) * 100 : 0,
        monthlyGrowth: 12.5
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-primary-foreground/80">Here's what's happening with your sales today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContracts}</div>
            <p className="text-xs text-muted-foreground">
              3 pending signatures
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineData.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{stage.count} leads</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ${stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Progress value={(stage.count / 12) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Schedule Follow-up Call
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Email Campaign
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Create New Contract
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Book Meeting
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Set Sales Goal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'lead', action: 'New lead added', name: 'John Smith from TechCorp', time: '2 hours ago' },
              { type: 'contract', action: 'Contract signed', name: 'ABC Industries - $25,000', time: '4 hours ago' },
              { type: 'email', action: 'Email sent', name: 'Follow-up to Sarah Johnson', time: '6 hours ago' },
              { type: 'meeting', action: 'Meeting completed', name: 'Demo with XYZ Company', time: '1 day ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.name}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activity.time}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}