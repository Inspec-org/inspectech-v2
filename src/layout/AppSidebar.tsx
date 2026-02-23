"use client";
import React, { useEffect, useRef, useState, useCallback, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import { ArrowLeft, BarChart, BarChart2, BarChart4, ChevronLeft, ChevronRight, CircleQuestionMark, Clipboard, ClipboardCheck, Home, Mail, Signal, Users } from "lucide-react";
import { UserContext } from "@/context/authContext";
import RequestAdminReviewModal from "@/components/Modals/RequestAdminReviewModal";
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};


const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const Router = useRouter();
  const { logout, user, session_id, setUser, loading } = useContext(UserContext);
  const roleFromPath = React.useMemo(() => {
    const seg = (pathname || "").split("/")[1];
    return seg === "admin" || seg === "user" || seg === "vendor" ? seg : undefined;
  }, [pathname]);
  const currentRole = user?.role ?? roleFromPath;
  const [dept, setDept] = useState("");
  const [isRequestAdminReviewModalOpen, setIsRequestAdminReviewModalOpen] = useState(false);
  const [hoverSuspended, setHoverSuspended] = useState(false);
  const menuItemRefs = useRef<Record<string, HTMLElement | null>>({});

  const navItems: NavItem[] = [
    {
      icon: <Home />,
      name: "Dashboard",
      path: currentRole ? `/${currentRole}/dashboard` : undefined,
    },
    {
      icon: <ClipboardCheck />,
      name: "Inspections",
      path: currentRole ? `/${currentRole}/inspections` : undefined,
    },
    {
      icon: <BarChart4 />,
      name: "Reports",
      path: currentRole ? `/${currentRole}/reports` : undefined,
    },
    {
      icon: <Users />,
      name: "Users",
      path: currentRole ? `/${currentRole}/users` : undefined,
    },

    // Request Admin Review → vendor, user, superadmin
    ...(currentRole === "vendor" ||
      currentRole === "user" ||
      currentRole === "superadmin"
      ? [
        {
          icon: <Mail />,
          name: "Request Admin Review",
          onClick: () => setIsRequestAdminReviewModalOpen(true),
        },
      ]
      : []),

    // Inspection Vendor Tracker → admin + superadmin
    ...(currentRole === "admin" || currentRole === "superadmin"
      ? [
        {
          icon: <CircleQuestionMark />,
          name: "Inspection Vendor Tracker",
          path: currentRole
            ? `/${currentRole}/inspection-vendor-tracker`
            : undefined,
        },
      ]
      : []),
  ];


  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="font-raleway flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li
          key={nav.name}
          className="relative group"
          ref={(el) => {
            menuItemRefs.current[`${menuType}-${index}`] = el;
          }}
        >
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item-dark group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-dark-active"
                : "menu-item-dark-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "text-white"
                  : "text-gray-400"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text-dark">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-white"
                    : "text-gray-400"
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path ? (
              <Link
                href={nav.path}
                className={`menu-item-dark group ${isActive(nav.path)
                  ? "menu-item-dark-active"
                  : "menu-item-dark-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path) ? "text-white" : "text-gray-400"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text-dark">{nav.name}</span>
                )}
              </Link>
            ) : nav.onClick ? (
              <button
                onClick={nav.onClick}
                className="menu-item-dark group menu-item-dark-inactive w-full"
              >
                <span className="text-gray-400 group-hover:text-white">
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text-dark">{nav.name}</span>
                )}
              </button>
            ) : null
          )}
          {(!isExpanded && !isMobileOpen && !isHovered) && (
            <span
              className="sidebar-tooltip"
              style={{
                top: menuItemRefs.current[`${menuType}-${index}`]?.offsetTop
                  ? `${menuItemRefs.current[`${menuType}-${index}`]!.offsetTop + 12}px`
                  : '50%'
              }}
            >
              {nav.name}
            </span>
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item-dark ${isActive(subItem.path)
                        ? "menu-dropdown-item-dark-active"
                        : "menu-dropdown-item-dark-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span className="menu-dropdown-badge-dark">new</span>
                        )}
                        {subItem.pro && (
                          <span className="menu-dropdown-badge-dark">pro</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {

      return pathname === path || pathname.startsWith(`${path}/`);
    },
    [pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      navItems.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);


  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  useEffect(() => {
    const read = () => {
      const v = Cookies.get("selectedDepartment") || "";
      setDept(v);
    };

    read();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "selectedDepartment") {
        setDept(e.newValue || "");
      }
    };

    const onDept = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (typeof d === "string") setDept(d);
      else read();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("selectedDepartmentChanged", onDept as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("selectedDepartmentChanged", onDept as EventListener);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
  .menu-item-dark {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    transition: all 0.2s;
    font-size: 0.9375rem;
    font-weight: 500;
    position: relative;
    overflow: visible;
  }

  .menu-item-dark-inactive {
    color: #9ca3af;
  }

  .menu-item-dark-inactive:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }

  /* 🔥 Active state styled like your screenshot */
  .menu-item-dark-active {
    background-color: #633922; /* deep brown background */
    color: #ffffff;
    border-radius: 0.75rem;
  }

  .menu-item-dark-active::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 6px;
    background-color: #c76a29; /* orange accent */
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .menu-item-text-dark {
    font-size: 0.9375rem;
    font-weight: 500;
  }

  .menu-dropdown-item-dark {
    display: block;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: all 0.2s;
    color: #9ca3af;
  }

  .menu-dropdown-item-dark:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }

  .menu-dropdown-item-dark-active {
    background-color: #633922;
    color: #ffffff;
  }

  .menu-dropdown-item-dark-active::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 4px;
    background-color: #c76a29;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .menu-dropdown-badge-dark {
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    background-color: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .sidebar-tooltip {
  position: fixed;
  left: 66px;
  background-color: rgba(62, 44, 151, 0.95);
  border: 1px solid #7C3AED;
  color: #ffffff;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
  transition: opacity 0.2s, visibility 0.2s;
}

  li:hover .sidebar-tooltip {
    opacity: 1;
    visibility: visible;
  }
`}</style>

      <aside
        className={`fixed flex flex-col lg:mt-0 top-0 px-4 left-0 bg-[#0A0F1E] text-gray-300 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-800
          ${isExpanded || isMobileOpen ? 'w-[280px]' : 'w-[90px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ overflow: 'visible' }}
      >
        {/* User Profile Section */}
        <div
          className={`py-6 border-b border-gray-800 ${!isExpanded && !isHovered && !isMobileOpen ? "flex justify-center" : ""}`}>
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.username}
                  </p>
                  <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-[10px] rounded uppercase font-medium">
                    {dept.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
                {user?.role === "vendor" || user?.role === "user" && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-400">Vendor Account</span>
                  </div>
                )}

              </div>
              <button
                onClick={() => {
                  setIsHovered(false);
                  setHoverSuspended(true);
                  if (isMobileOpen) {
                    toggleMobileSidebar();
                  } else {
                    toggleSidebar();
                  }
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft width={20} height={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <button
                onClick={() => {
                  setIsHovered(false);
                  setHoverSuspended(true);
                  if (isMobileOpen) {
                    toggleMobileSidebar();
                  } else {
                    toggleSidebar();
                  }
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight width={20} height={20} />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col py-6" style={{ overflowY: 'auto', overflowX: 'visible' }}>
          <nav className="flex-1">
            <div className="flex flex-col gap-4">
              <div>{renderMenuItems(navItems, "main")}</div>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-4">
            {currentRole === "superadmin" && (
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#92400e] hover:bg-[#b45309] text-white transition-colors mb-4 ${!isExpanded && !isHovered && !isMobileOpen
                  ? "justify-center"
                  : "justify-start"
                  }`}
                onClick={() => {
                  Router.push("/superadmin");
                }}
              >
                <ArrowLeft width={20} height={20} />
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="font-medium">Go Back</span>
                )}
              </button>
            )}
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#92400e] hover:bg-[#b45309] text-white transition-colors ${!isExpanded && !isHovered && !isMobileOpen
                ? "justify-center"
                : "justify-start"
                }`}
              onClick={async () => {
                const result = await Swal.fire({
                  title: 'Logout?',
                  text: 'Are you sure you want to logout?',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#EF4444',
                  cancelButtonColor: '#6B7280',
                  confirmButtonText: 'Logout',
                  cancelButtonText: 'Cancel'
                });
                if (result.isConfirmed) logout();
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="font-medium">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>
      <RequestAdminReviewModal
        isOpen={isRequestAdminReviewModalOpen}
        onClose={() => setIsRequestAdminReviewModalOpen(false)}
      />
    </>
  );
};

export default AppSidebar;
