import React from "react";
import Link from "next/link";
import SidebarDropdown from "@/components/Sidebar/SidebarDropdown";
import { usePathname } from "next/navigation";

interface SidebarItemProps {
  item: {
    label: string;
    route: string;
    icon: React.ReactNode;
    children?: SidebarItemProps['item'][];
  };
  pageName: string;
  setPageName: (pageName: string) => void;
}

const SidebarItem = ({ item, pageName, setPageName }: SidebarItemProps) => {
  const handleClick = () => {
    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    return setPageName(updatedPageName);
  };

  const pathname = usePathname();

  const isActive = (item: SidebarItemProps['item']): boolean => {
    if (item.route === pathname) return true;
    if (item.children) {
      return item.children.some((child: SidebarItemProps['item']) => isActive(child));
    }
    return false;
  };

  const isItemActive = isActive(item);

  return (
    <>
      <li>
        <Link
          href={item.route}
          onClick={handleClick}
          className={`${isItemActive ? "rounded-md bg-graydark dark:bg-[#1e1e1e]" : ""} group relative flex items-center gap-2.5 rounded-md px-4 py-2  text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-[#1e1e1e]`}
        >
          {item.icon}
          {item.label}
        </Link>

        {item.children && (
          <div
            className={`translate transform overflow-hidden ${
              pageName !== item.label.toLowerCase() && "hidden"
            }`}
          >
            <SidebarDropdown item={item.children} />
          </div>
        )}
      </li>
    </>
  );
};

export default SidebarItem;
