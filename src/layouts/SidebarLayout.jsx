import React, { useEffect, useState } from "react"
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "../components/ui/sidebar"
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '../components/ui/menubar'
import { LayoutDashboard, Users, Calendar, ClipboardList, Users2Icon, Sun, Moon, User,  Settings, LogOut, RefreshCw } from "lucide-react"

function SidebarShell(){

 const { state } = useSidebar();
  const isCollapsed = state === "collapsed"
   const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate();

  const selectedCelebration = searchParams.get("time") || ""
  const selectedTitle = searchParams.get("title") || "JCSGO CENTRAL"

   const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const sidebarSearch = new URLSearchParams()
  if (selectedCelebration) sidebarSearch.set("time", selectedCelebration)
  if (selectedTitle) sidebarSearch.set("title", selectedTitle)
  const commonSearch = sidebarSearch.toString() ? `?${sidebarSearch.toString()}` : ""

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: `/dashboard${commonSearch}`,
    },
    {
      label: "Member System",
      icon: Users,
      to: `/member-system${commonSearch}`,
    },
    {
      label: "Vine Attendance",
      icon: ClipboardList,
      to: `/vine-attendance${selectedCelebration ? `?time=${encodeURIComponent(selectedCelebration)}` : ""}`,
    },
    {
      label: "Calendar",
      icon: Calendar,
      to: `/calendar${selectedCelebration ? `?time=${encodeURIComponent(selectedCelebration)}` : ""}`,
    },
  ]

  const activeItem = navItems.find(item => location.pathname === item.to.split("?")[0])

    useEffect(() => {
      document.body.className = theme;
      localStorage.setItem("theme", theme);
    }, [theme]);
  return(
     <div style={{ minHeight: "100vh", display: "flex", overflow: "hidden" }}>
        <Sidebar variant="sidebar" collapsible="icon" >
          <SidebarHeader>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",}}>
              <div style={{ display: "flex", alignItems: "center", gap: 10,whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <img src="logonotitle.png" width={56} height={28} alt="Logo" />
                <div>
                  <div style={{ fontWeight: 700, alignSelf: "center", fontSize: 14, }}>
                    JCSGO CENTRAL
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {selectedCelebration || "No celebration selected"}
                  </div>
                </div>
              </div>
              
            </div>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            
            <SidebarMenu style={{marginTop: 10,}}>
              <div style={{marginLeft: 6,}}>
               <p style={{
    fontSize: 12,
    opacity: 0.85,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
     opacity: isCollapsed ? 0 : 0.85,
    transform: isCollapsed ? "translateX(-6px)" : "translateX(0)",
    transition: "all 0.2s ease",
    marginLeft: 8,
  }}>
    Admin 
  </p>
            
  
             {navItems.map((item, index) => {
  const Icon = item.icon
  const isActive = location.pathname === item.to.split("?")[0]

  return (
    <SidebarMenuItem key={item.label}>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
  to={item.to}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: isActive ? "var(--sidebar-active)" : "inherit",

    // ✨ animation
    
    transform: isCollapsed
      ? "translateY(-20px)"
      : "translateY(0)",

    transition: "all 0.35s ease",
    transitionDelay: isCollapsed
      ? "0ms"
      : `${index * 60}ms`, // 👈 stagger on open
  }}
>
          <Icon
            size={18}
            color={isActive ? 'var(--sidebar-active)' : "currentColor"} // icon color
          />
          {item.label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})}
</div>
            </SidebarMenu>
            
          </SidebarContent>
          

          <SidebarFooter>
            <div style={{ display: "flex",paddingBottom: 12, flexDirection: "column", gap: 6,whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              
            
                <div style={{ fontSize: 14, opacity: 0.85, alignSelf: "center",  opacity: isCollapsed ? 0 : 0.85, transform: isCollapsed ? "translateX(-6px)" : "translateX(0)", transition: "all 0.2s ease", }}>
                  JCSGO CENTRAL © {new Date().getFullYear()}
                </div>
             
            </div>
          </SidebarFooter>
        </Sidebar>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflowY: "auto" }}>
          <header
            style={{
              position: "fixed",
              top: 0,
              zIndex: 1000,
              width: "100%",
              flexShrink: 0,
              height: 56,
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              background: "var(--background)",
            }}
          >
            
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SidebarTrigger />
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: "600" }}>
                {activeItem?.label || "Dashboard"}
              </h1>
            </div>

            <div style={{ display: "flex", right: 10, position: "fixed", alignItems: "center", gap: 10 }}>
             <button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
>
  {theme === "dark" ? (
    <>
      <Sun size={16} color="#f59e0b" />
      <span className="hidden sm:inline">Light Mode</span>
    </>
  ) : (
    <>
      <Moon size={16} color="#60a5fa" />
      <span className="hidden sm:inline">Dark Mode</span>
    </>
  )}
</button>
              <Menubar>
            <MenubarMenu>
              <MenubarTrigger
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid orange",
  }}
>
  <User size={16} />
  <div className="flex flex-col md:max-w-[10em] leading-none items-start max-w-[5em]">
  <p className="font-bold truncate max-w-full m-0">
    JCSGO_CENTRAL
  </p>

  <p className="text-xs opacity-85 truncate max-w-full m-0">
    Admin
  </p>
</div>
  
</MenubarTrigger>
              <MenubarContent>
                <MenubarGroup>
                 
                  <MenubarItem onClick={() => navigate("/")}>
  <RefreshCw size={14} style={{ marginRight: 8 }} />
  Change Celebration
</MenubarItem>
 <MenubarSeparator />
<MenubarItem>
  <Settings size={14} style={{ marginRight: 8 }} />
  Settings
</MenubarItem>

<MenubarItem>
  <LogOut size={14} style={{ marginRight: 8 }} />
  Logout
</MenubarItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
            </div>
          </header>
          <div style={{ flex: 1, minHeight: 0, marginTop: 40, padding: 8, overflowX: "hidden", boxSizing: "border-box", width: "100%" }}>
            <Outlet />
          </div>
        </div>
        
      </div>
  )
}

export default function SidebarLayout() {
 

  return (
    <SidebarProvider>
     <SidebarShell />
      
    </SidebarProvider>
  )
}
