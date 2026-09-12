"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

const getLoggedInUser = () => {
  if (typeof window === "undefined") return "";
  try {
    const keys = ["wms_username", "username", "user", "userid", "wms_user", "authUser"];
    for (const key of keys) {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (val) {
        if (val.trim().startsWith("{")) {
          const obj = JSON.parse(val);
          if (obj.username) return obj.username;
          if (obj.name) return obj.name;
          if (obj.id) return String(obj.id);
        } else {
          return val;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to get logged in user from storage:", e);
  }
  return "";
};

/**
 * Common UserSelect component with search, pagination, and dropdown selection.
 * Dynamically positions dropdown upwards if window space below is limited.
 */
export default function UserSelect({
  value,
  onChange,
  label,
  placeholder = "Select User...",
  required = false,
  disabled = false,
  name = "assignedTo",
  valueKey = "username",
  displayKey = "username",
  subDisplayKey = "email",
  className = "",
  containerClassName = "",
  pageSize = 10,
  defaultToLoggedInUser = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalOptions, setTotalOptions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Dynamically calculate dropdown position (open upwards if limited space below)
  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    const dropdownHeight = dropdownRef.current
      ? dropdownRef.current.offsetHeight
      : 280;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + 4;

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      top = rect.top - dropdownHeight - 4;
    }

    if (top < 8) top = 8;

    setDropdownPosition({
      top,
      left: Math.max(8, rect.left),
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    const rafId = requestAnimationFrame(() => {
      updateDropdownPosition();
    });

    const handleScroll = () => updateDropdownPosition();
    const handleResize = () => updateDropdownPosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, users, loading, hasMore]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Load users from API
  const fetchUsers = async (pageNum = 0, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pageNum);
      params.append("size", pageSize);
      if (search) params.append("search", search);

      const response = await api.get(`/users?${params.toString()}`);
      const data =
        response.data?.data?.content ||
        response.data?.content ||
        (Array.isArray(response.data?.data) ? response.data.data : null) ||
        (Array.isArray(response.data) ? response.data : []);

      const total =
        response.data?.totalElements ||
        response.data?.total ||
        response.data?.data?.totalElements ||
        data.length;

      if (pageNum === 0) {
        setUsers(data);
      } else {
        setUsers((prev) => [...prev, ...data]);
      }

      setTotalOptions(total);
      setHasMore(data.length === pageSize);
    } catch (error) {
      console.warn("Failed to fetch users for UserSelect dropdown:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0, "");
  }, []);

  // Auto-select logged-in user as default if no value is set
  useEffect(() => {
    if (defaultToLoggedInUser && !value && onChange) {
      const loggedUser = getLoggedInUser();
      if (loggedUser) {
        const matched = users.find(
          (u) =>
            String(u[valueKey] ?? "").toLowerCase() === String(loggedUser).toLowerCase() ||
            String(u.username ?? "").toLowerCase() === String(loggedUser).toLowerCase() ||
            String(u.id ?? "") === String(loggedUser) ||
            String(u.email ?? "").toLowerCase() === String(loggedUser).toLowerCase()
        );
        const valToSet = matched
          ? matched[valueKey] || matched.username || matched.id
          : loggedUser;

        onChange(matched || null, {
          target: { name, value: valToSet },
        });
      }
    }
  }, [value, users, defaultToLoggedInUser, valueKey, name]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setPage(0);
    fetchUsers(0, term);
  };

  const handleLoadMore = (e) => {
    e.stopPropagation();
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage, searchTerm);
    }
  };

  const handleSelect = (user) => {
    setIsOpen(false);
    setSearchTerm("");

    if (onChange) {
      const val =
        user[valueKey] !== undefined
          ? user[valueKey]
          : user.username || user.id;
      onChange(user, {
        target: { name, value: val },
      });
    }
  };

  // Find selected user representation
  const selectedUser = users.find(
    (u) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (String(u[valueKey] ?? "").toLowerCase() === String(value).toLowerCase() ||
        String(u.username ?? "").toLowerCase() === String(value).toLowerCase() ||
        String(u.id ?? "") === String(value) ||
        String(u.email ?? "").toLowerCase() === String(value).toLowerCase())
  );

  const displayValue = selectedUser
    ? selectedUser.fullName ||
      selectedUser.name ||
      selectedUser[displayKey] ||
      selectedUser.username
    : value || "";

  return (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between bg-white text-sm cursor-pointer transition-colors ${
          disabled
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : isOpen
              ? "border-blue-500 ring-2 ring-blue-500/20 text-gray-900"
              : "border-gray-300 hover:border-gray-400 text-gray-900"
        } ${className}`}
      >
        <span
          className={
            displayValue ? "text-gray-900 font-medium" : "text-gray-400"
          }
        >
          {displayValue || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="fixed z-[99999] bg-white border border-gray-300 rounded-lg shadow-xl"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-200 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search user..."
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {loading && users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-2 text-xs">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No users found
              </div>
            ) : (
              users.map((user) => {
                const isSelected =
                  value !== undefined &&
                  value !== null &&
                  value !== "" &&
                  (String(user[valueKey] ?? "").toLowerCase() === String(value).toLowerCase() ||
                    String(user.username ?? "").toLowerCase() === String(value).toLowerCase() ||
                    String(user.id ?? "") === String(value));

                const primaryLabel =
                  user.fullName || user.name || user.username || `User ${user.id}`;
                const secondaryLabel =
                  user[subDisplayKey] ||
                  user.email ||
                  user.role ||
                  (user.fullName || user.name ? `@${user.username}` : "");

                return (
                  <div
                    key={user.id || user.username}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "hover:bg-gray-50 text-gray-900"
                    }`}
                    onClick={() => handleSelect(user)}
                  >
                    <div>
                      <div className="font-medium">{primaryLabel}</div>
                      {secondaryLabel && (
                        <div className="text-xs text-gray-500">
                          {secondaryLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                );
              })
            )}

            {hasMore && (
              <div className="p-2 text-center border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more users..."}
                </button>
              </div>
            )}

            {totalOptions > 0 && !loading && (
              <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-200">
                Showing {users.length} of {totalOptions} users
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
