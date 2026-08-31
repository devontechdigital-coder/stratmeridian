"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useConsultationModal } from "@/components/public/PublicShell";
import styles from "@/components/public/meridianTheme.module.css";

const logoUrl = "https://static.wixstatic.com/media/07bc36_bc0c9dbee948416eb3b96deace2dec65~mv2.png/v1/fill/w_276,h_108,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/07bc36_bc0c9dbee948416eb3b96deace2dec65~mv2.png";

const fallbackNavItems = [
  { id: "home", text: "Home", href: "/#home", target: "_self", children: [] },
  { id: "services", text: "Services", href: "/#services", target: "_self", children: [] },
  { id: "about", text: "About", href: "/#about", target: "_self", children: [] },
  { id: "faq", text: "FAQ", href: "/#faq", target: "_self", children: [] },
  { id: "contact", text: "Contact Us", href: "/contact", target: "_self", children: [] },
];

export default function Header({ initialNavItems = [], settings = null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState(() => new Set());
  const { data: session } = useSession();
  const pathname = usePathname();
  // The home page has a dark hero directly under the header, so it starts transparent and
  // fades to a solid bar on scroll. Every other page starts solid immediately — same
  // convention the mockup uses (header class="solid" on every non-home page).
  const isHome = pathname === "/";
  const openConsultationModal = useConsultationModal();
  const [navItems, setNavItems] = useState(
    Array.isArray(initialNavItems) && initialNavItems.length > 0 ? initialNavItems : fallbackNavItems
  );

  useEffect(() => {
    let ignore = false;

    fetch("/api/menus?type=header")
      .then((response) => response.json())
      .then((data) => {
        if (!ignore && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setNavItems(data.data);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setOpenSubmenus(new Set());
  };

  const toggleSubmenu = (id) => {
    setOpenSubmenus((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const whatsappDigits = (settings?.phoneNumber || "").replace(/[^\d]/g, "");

  return (
    <header className={`${styles.shell} ${styles.header} ${scrolled ? styles.headerScrolled : ""} ${!isHome ? styles.headerSolid : ""}`}>
      <div className={styles.wrap}>
        <Link className={styles.logo} href="/#home" aria-label="Home">
          <img width="120" src={logoUrl} alt="Logo" style={{ borderRadius: 5 }} />
        </Link>

        <nav className={styles.primaryNav}>
          <ul className={styles.navLinks}>
            {navItems.map((item, index) => (
              <DesktopMenuItem key={getMenuItemKey(item, index)} item={item} index={index} />
            ))}
            {session?.user ? (
              <li>
                <Link className={styles.navlink} href={getDashboardHref(session)}>
                  Dashboard
                </Link>
              </li>
            ) : (
              <li>
                <Link className={styles.navlink} href="/login">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className={styles.headerActions}>
          {whatsappDigits && (
            <a
              className={styles.waIcon}
              href={`https://wa.me/${whatsappDigits}`}
              aria-label="WhatsApp us"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.42 1.26 4.86L2 22l5.32-1.28a9.9 9.9 0 0 0 4.72 1.2h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm0 18.14c-1.5 0-2.96-.4-4.22-1.16l-.3-.18-3.16.76.76-3.08-.2-.32a8.14 8.14 0 0 1-1.28-4.4c0-4.5 3.66-8.16 8.16-8.16s8.16 3.66 8.16 8.16-3.66 8.38-8.16 8.38h.04z" />
              </svg>
            </a>
          )}
          <button type="button" className={`${styles.btn} ${styles.btnOutlineLight}`} onClick={openConsultationModal}>
            Book a Consultation
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
          <div
            className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
            role="button"
            aria-label="Open menu"
            aria-expanded={open}
            tabIndex={0}
            onClick={() => setOpen((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") setOpen((value) => !value);
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div className={`${styles.shell} ${styles.mobilePanel} ${open ? styles.mobilePanelOpen : ""}`}>
        {navItems.map((item, index) => (
          <MobileMenuItem
            key={getMenuItemKey(item, index)}
            item={item}
            index={index}
            parentKey="mobile"
            openSubmenus={openSubmenus}
            onToggle={toggleSubmenu}
            onNavigate={closeMenu}
          />
        ))}
        {session?.user ? (
          <Link href={getDashboardHref(session)} onClick={closeMenu}>
            Dashboard
          </Link>
        ) : (
          <Link href="/login" onClick={closeMenu}>
            Login
          </Link>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGold} ${styles.mobCta}`}
          onClick={() => {
            closeMenu();
            openConsultationModal();
          }}
        >
          Book a Consultation →
        </button>
      </div>
    </header>
  );
}

function DesktopMenuItem({ item, index }) {
  const children = Array.isArray(item.children) ? item.children : [];
  const hasChildren = children.length > 0;

  if (!hasChildren) {
    return (
      <li>
        <HeaderLink item={item} className={`${styles.navlink} ${index === 0 ? styles.navlinkActive : ""}`} />
      </li>
    );
  }

  return (
    <li className={styles.hasMega}>
      <HeaderLink item={item} className={styles.navlink} extraProps={{ "aria-haspopup": true }} />
      <div className={styles.megaMenu}>
        {children.map((child, childIndex) => (
          <a key={getMenuItemKey(child, childIndex)} href={child.href || "#"}>
            <span className={styles.megaMenuNum}>{String(childIndex + 1).padStart(2, "0")}</span>
            <span className={styles.megaMenuTitle}>{child.text}</span>
          </a>
        ))}
      </div>
    </li>
  );
}

function MobileMenuItem({ item, index, parentKey, openSubmenus, onToggle, onNavigate }) {
  const children = Array.isArray(item.children) ? item.children : [];
  const hasChildren = children.length > 0;
  const itemKey = `${parentKey}-${getMenuItemKey(item, index)}`;
  const isOpen = openSubmenus.has(itemKey);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <HeaderLink item={item} onNavigate={onNavigate} style={{ flex: 1, borderBottom: "none" }} />
        {hasChildren && (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={`Toggle ${item.text || "submenu"}`}
            onClick={() => onToggle(itemKey)}
            style={{ color: "var(--gold)", fontSize: 20, padding: "0 4px" }}
          >
            {isOpen ? "−" : "+"}
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <div style={{ paddingLeft: 18, marginTop: -8, marginBottom: 8 }}>
          {children.map((child, childIndex) => (
            <a key={getMenuItemKey(child, childIndex)} href={child.href || "#"} style={{ fontSize: 20 }} onClick={onNavigate}>
              {child.text}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

function getMenuItemKey(item, index) {
  return String(item.id || `${item.href || "menu"}-${item.text || "item"}-${index}`);
}

function getDashboardHref(session) {
  const role = session?.user?.role;
  if (role === "admin" || role === "sub-admin") return "/admin";
  if (session?.user) return "/dashboard";
  return "/login";
}

function HeaderLink({ item, className, onNavigate, extraProps = {}, style }) {
  const href = item.href || "/";
  const target = item.target || "_self";
  const isExternal = /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");

  if (isExternal || target === "_blank") {
    return (
      <a
        className={className}
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={onNavigate}
        style={style}
        {...extraProps}
      >
        {item.text}
      </a>
    );
  }

  return (
    <Link className={className} href={href} onClick={onNavigate} style={style} {...extraProps}>
      {item.text}
    </Link>
  );
}
