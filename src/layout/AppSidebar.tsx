"use client";
import React, { useEffect, useRef, useState, useCallback, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
import { BarChart, BarChart2, BarChart4, Clipboard, ClipboardCheck, Home, Mail, Signal, Users } from "lucide-react";
import { UserContext } from "@/context/authContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <Home />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <ClipboardCheck />,
    name: "Inspections",
    path: "/inspections",
  },
  {
    icon: <BarChart4 />,
    name: "Reports",
    path: "/reports",
  },
  {
    icon: <Users />,
    name: "Users",
    path: "/users"
  },
  {
    icon: <Mail />,
    name: "Request Admin Review",
    path: "/admin-review"
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { logout, user, session_id, setUser } = useContext(UserContext);

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="font-raleway flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
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
            nav.path && (
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
            )
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
    overflow: hidden;
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
`}</style>

      <aside
        className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-[#1a1d2e] text-gray-300 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-800
        ${isExpanded || isMobileOpen
            ? "w-[280px]"
            : isHovered
              ? "w-[280px]"
              : "w-[90px]"
          }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* User Profile Section */}
        <div
          className={`py-6 border-b border-gray-800 ${!isExpanded && !isHovered && !isMobileOpen
            ? "flex justify-center"
            : ""
            }`}
        >
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                AB
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">
                    ABC vendor
                  </p>
                  <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-[10px] rounded uppercase font-medium">
                    US
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  mikenchypto@gmail.com
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-400">Vendor Account</span>
                </div>
              </div>
              <button
                onClick={() => {

                  toggleSidebar();

                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
              AB
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar py-6">
          <nav className="flex-1">
            <div className="flex flex-col gap-4">
              <div>{renderMenuItems(navItems, "main")}</div>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-4">
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#92400e] hover:bg-[#b45309] text-white transition-colors ${!isExpanded && !isHovered && !isMobileOpen
                ? "justify-center"
                : "justify-start"
                }`}
                onClick={logout}
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
    </>
  );
};

export default AppSidebar;