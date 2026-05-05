import React, { useState, useRef, useEffect, useMemo } from 'react'
import countryCodes from '../utils/countryCodes'

/**
 * A searchable country-code picker dropdown.
 *
 * Props:
 *  - value      : ISO code string, e.g. 'IN'  (unique per country)
 *  - onChange    : ({ iso, dial }) => void  — fires with both ISO and dial code
 *  - id         : optional HTML id for testing
 */
export default function CountryCodePicker({ value = 'IN', onChange, id }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  // selected country object — matched by ISO (unique key)
  const selected = useMemo(
    () => countryCodes.find((c) => c.iso === value) || countryCodes.find((c) => c.iso === 'IN'),
    [value]
  )

  // filtered list
  const filtered = useMemo(() => {
    if (!search.trim()) return countryCodes
    const q = search.toLowerCase()
    return countryCodes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q)
    )
  }, [search])

  // close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // auto-focus search when opened
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus()
  }, [open])

  // scroll the selected item into view when opening
  useEffect(() => {
    if (open && listRef.current && selected) {
      const el = listRef.current.querySelector(`[data-iso="${selected.iso}"]`)
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [open, selected])

  function handleSelect(c) {
    onChange({ iso: c.iso, dial: c.dial })
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="country-picker" id={id}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="country-picker__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="country-picker__flag">{selected?.flag}</span>
        <span className="country-picker__dial">{selected?.dial}</span>
        <svg
          className={`country-picker__chevron ${open ? 'country-picker__chevron--open' : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="country-picker__dropdown">
          {/* Search bar */}
          <div className="country-picker__search-wrap">
            <svg className="country-picker__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              className="country-picker__search"
              placeholder="Search country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* List */}
          <ul ref={listRef} className="country-picker__list" role="listbox">
            {filtered.length === 0 && (
              <li className="country-picker__empty">No results</li>
            )}
            {filtered.map((c) => {
              const isActive = c.iso === value
              return (
                <li
                  key={c.iso}
                  data-iso={c.iso}
                  role="option"
                  aria-selected={isActive}
                  className={`country-picker__item ${isActive ? 'country-picker__item--active' : ''}`}
                  onClick={() => handleSelect(c)}
                >
                  <span className="country-picker__item-flag">{c.flag}</span>
                  <span className="country-picker__item-name">{c.name}</span>
                  <span className="country-picker__item-dial">{c.dial}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
