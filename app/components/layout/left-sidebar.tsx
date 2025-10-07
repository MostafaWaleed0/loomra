import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { CheckCircle2, Moon, Target, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';

export function LeftSidebar({ activeView, setActiveView, stats, ...props }: any) {
  const { theme, setTheme } = useTheme();
  const menuItems = [
    // { id: 'dashboard', label: 'Dashboard', icon: Home, count: null },
    { id: 'goals', label: 'Goals', icon: Target, count: stats[2].activeGoals },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckCircle2,
      count: stats[1].pendingTasks
    },
    { id: 'habits', label: 'Habits', icon: Zap, count: stats[0].total }
    // { id: 'analytics', label: 'Analytics', icon: BarChart3, count: null }
  ];

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    window.electronAPI.setTheme(newTheme);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary flex aspect-square size-8 items-center justify-center rounded-lg">
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Loomra</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton onClick={() => setActiveView(item.id)} isActive={isActive}>
                    <Icon className="!size-5 mx-auto" />
                    <span className="flex-1">{item.label}</span>
                    <Badge className="size-5 rounded-full px-1 font-mono tabular-nums">{item.count}</Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              title="Delete Task"
              onClick={toggleTheme}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground grid place-items-center"
            >
              <Moon />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
