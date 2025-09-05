
'use client';

import { useState } from 'react';
import { Sidebar, SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Activity, AlertTriangle, Settings, Mic, ArrowUp, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { ArrowUpIcon } from '@/components/icons/ArrowUpIcon';


const dataCards = [
    { title: 'Active Alerts', value: '12', description: 'High-priority threats detected', icon: <AlertTriangle className="text-red-500" /> },
    { title: 'Reports Investigated', value: '78', description: 'Last 24 hours', icon: <LayoutDashboard className="text-blue-400" /> },
    { title: 'Live Field Agents', value: '4', description: 'Currently on-duty', icon: <Activity className="text-green-500" /> },
];

export default function GroundSentinelDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#0a0a0a] text-gray-200">
        <Sidebar>
          <SidebarHeader>
             {/* Collapsed view will just be an icon */}
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView('dashboard')} isActive={activeView === 'dashboard'} tooltip="Dashboard">
                    <LayoutDashboard />
                    <span className="group-data-[state=expanded]:inline hidden">Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView('activity')} isActive={activeView === 'activity'} tooltip="Live Activity">
                    <Activity />
                     <span className="group-data-[state=expanded]:inline hidden">Live Activity</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView('alerts')} isActive={activeView === 'alerts'} tooltip="Alerts">
                    <AlertTriangle />
                     <span className="group-data-[state=expanded]:inline hidden">Alerts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings">
                        <Settings />
                        <span className="group-data-[state=expanded]:inline hidden">Settings</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen">
          <header className="flex items-center justify-between p-4 border-b border-gray-800">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
              Ground Sentinel Dashboard
            </h1>
            <Avatar>
                <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.uid}`} alt={user?.details.fullName} />
                <AvatarFallback>{user?.details.fullName?.[0]}</AvatarFallback>
            </Avatar>
          </header>
          
          <div className="flex-grow p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {dataCards.map((card, index) => (
                    <Card key={index} className="bg-[#131314] border-gray-800 shadow-lg hover:shadow-blue-500/20 transition-shadow duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-1 w-1/3 bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">{card.title}</CardTitle>
                            {card.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-gray-50">{card.value}</div>
                            <p className="text-xs text-gray-500">{card.description}</p>
                        </CardContent>
                    </Card>
               ))}
            </div>
             {/* Placeholder for more content */}
             <div className="mt-8">
                <Card className="bg-[#131314] border-gray-800">
                    <CardHeader>
                        <CardTitle>Recent Activity Log</CardTitle>
                        <CardDescription>Stream of recent on-ground events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Activity items would go here */}
                        <p className="text-gray-400">No recent activity.</p>
                    </CardContent>
                </Card>
             </div>
          </div>

          <div className="px-4 pb-4">
             <div className="w-full max-w-4xl mx-auto px-4 py-2 bg-[#1e1f20] rounded-full flex items-center gap-2 border border-gray-700 focus-within:border-blue-500 transition-colors">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                    <Mic />
                </Button>
                <Input 
                    placeholder="Ask Sentinel..." 
                    className="flex-1 bg-transparent border-none text-lg text-gray-200 placeholder-gray-500 focus:ring-0 focus:outline-none"
                />
                <Button size="icon" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-blue-500/50 transition-shadow">
                    <ArrowUpIcon />
                </Button>
            </div>
          </div>

        </main>
      </div>
    </SidebarProvider>
  );
}
