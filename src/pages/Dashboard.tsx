import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Phone,
  Mail,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { blink } from '@/blink/client'
import { Link } from 'react-router-dom'

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
  const [recentLeads, setRecentLeads] = useState([])
  const [pipelineData, setPipelineData] = useState([
    { stage: 'New Leads', count: 12, value: 45000, color: 'bg-blue-500' },
    { stage: 'Qualified', count: 8, value: 32000, color: 'bg-yellow-500' },
    { stage: 'Proposal', count: 5, value: 28000, color: 'bg-orange-500' },
    { stage: 'Negotiation', count: 3, value: 15000, color: 'bg-purple-500' },
    { stage: 'Closed Won', count: 2, value: 12000, color: 'bg-green-500' }
  ])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load leads
      const leads = await blink.db.leads.list({ limit: 100 })
      const customers = await blink.db.customers.list({ limit: 100 })
      const contracts = await blink.db.contracts.list({ limit: 100 })
      const activities = await blink.db.activities.list({ 
        limit: 10,
        orderBy: { createdAt: 'desc' }
      })

      // Get recent leads (last 5)
      const recentLeadsData = leads.slice(0, 5)
      setRecentLeads(recentLeadsData)

      setStats({
        totalLeads: leads.length,
        totalCustomers: customers.length,
        totalRevenue: customers.reduce((sum, c) => sum + (Number(c.totalValue) || 0), 0),
        activeContracts: contracts.filter(c => c.status === 'sent' || c.status === 'signed').length,
        conversionRate: leads.length > 0 ? (customers.length / leads.length) * 100 : 0,
        monthlyGrowth: 12.5
      })

      setRecentActivities(activities)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3">Welcome back!</h1>
            <p className="text-primary-foreground/90 text-lg">Here's what's happening with your sales today.</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Calendar className="h-8 w-8 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalLeads}</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+12%</span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+{stats.monthlyGrowth}%</span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+2.1%</span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Contracts</CardTitle>
            <div className="p-2 bg-orange-50 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeContracts}</div>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-sm text-orange-600 font-medium">3 pending</span>
              <span className="text-sm text-gray-500 ml-1">signatures</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Sales Pipeline</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/pipeline">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {pipelineData.map((stage, index) => (
              <div key={stage.stage} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <span className="font-medium text-gray-900">{stage.stage}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{stage.count}</div>
                    <div className="text-sm text-gray-500">${stage.value.toLocaleString()}</div>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={(stage.count / 12) * 100} className="h-3" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start h-12 bg-primary hover:bg-primary/90" asChild>
              <Link to="/leads">
                <Plus className="h-5 w-5 mr-3" />
                Add New Lead
              </Link>
            </Button>
            <Button className="w-full justify-start h-12" variant="outline">
              <Phone className="h-5 w-5 mr-3" />
              Schedule Call
            </Button>
            <Button className="w-full justify-start h-12" variant="outline">
              <Mail className="h-5 w-5 mr-3" />
              Send Email
            </Button>
            <Button className="w-full justify-start h-12" variant="outline" asChild>
              <Link to="/contracts">
                <FileText className="h-5 w-5 mr-3" />
                Create Contract
              </Link>
            </Button>
            <Button className="w-full justify-start h-12" variant="outline">
              <Target className="h-5 w-5 mr-3" />
              Set Goal
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Recent Leads</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/leads">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.length > 0 ? recentLeads.map((lead, index) => (
                <div key={lead.id || index} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white">
                      {(lead.firstName?.[0] || lead.name?.[0] || 'L').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.name || 'Unknown Lead'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{lead.company || lead.email || 'No company'}</p>
                  </div>
                  <Badge variant={lead.status === 'new' ? 'default' : 'secondary'} className="shrink-0">
                    {lead.status || 'new'}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No leads yet</p>
                  <Button className="mt-4" size="sm" asChild>
                    <Link to="/leads">Add Your First Lead</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={activity.id || index} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50/50">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'lead' && <Users className="h-5 w-5 text-blue-500" />}
                    {activity.type === 'contract' && <FileText className="h-5 w-5 text-green-500" />}
                    {activity.type === 'email' && <Mail className="h-5 w-5 text-purple-500" />}
                    {activity.type === 'call' && <Phone className="h-5 w-5 text-orange-500" />}
                    {!['lead', 'contract', 'email', 'call'].includes(activity.type) && <CheckCircle className="h-5 w-5 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{activity.description || activity.action || 'Activity'}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.details || activity.name || 'No details'}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'Recent'}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}