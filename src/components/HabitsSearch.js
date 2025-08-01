"use client"

import { useState, useMemo } from "react"
import { debounce } from "lodash"

const HabitsSearch = ({ onFiltersChange, totalHabits, filteredCount, currentFilters }) => {
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || "")
  const [frequency, setFrequency] = useState(currentFilters.frequency || "all")
  const [isSearching, setIsSearching] = useState(false)

  // Crear la función debounceada usando useMemo para que se cree solo una vez
  const debouncedSearch = useMemo(
    () =>
      debounce((term, freq) => {
        setIsSearching(false)
        onFiltersChange({
          search: term.trim() || null,
          frequency: freq === "all" ? null : freq,
        })
      }, 300),
    [onFiltersChange],
  )

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsSearching(true)
    debouncedSearch(value, frequency)
  }

  // Handle frequency filter change
  const handleFrequencyChange = (e) => {
    const value = e.target.value
    setFrequency(value)
    setIsSearching(true)
    debouncedSearch(searchTerm, value)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setFrequency("all")
    onFiltersChange({
      search: null,
      frequency: null,
    })
  }

  // Check if there are active filters
  const hasActiveFilters = searchTerm.trim() || frequency !== "all"

  return (
    <div className="habits-search">
      <div className="search-header">
        <h3>Buscar y Filtrar Hábitos</h3>
        {totalHabits > 0 && (
          <div className="search-stats">
            <span className="results-count">
              {isSearching ? (
                "Buscando..."
              ) : (
                <>
                  Mostrando {filteredCount} de {totalHabits} hábitos
                  {hasActiveFilters && " (filtrados)"}
                </>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="search-controls">
        {/* Search Input */}
        <div className="search-input-group">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  debouncedSearch("", frequency)
                }}
                className="clear-search-btn"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Frequency Filter */}
        <div className="filter-group">
          <label htmlFor="frequency-filter">Frecuencia:</label>
          <select id="frequency-filter" value={frequency} onChange={handleFrequencyChange} className="filter-select">
            <option value="all">Todas</option>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="active-filters">
          <span className="filters-label">Filtros activos:</span>
          <div className="filter-pills">
            {searchTerm.trim() && (
              <div className="filter-pill">
                <span className="pill-label">Búsqueda:</span>
                <span className="pill-value">"{searchTerm.trim()}"</span>
                <button
                  onClick={() => {
                    setSearchTerm("")
                    debouncedSearch("", frequency)
                  }}
                  className="pill-remove"
                >
                  ✕
                </button>
              </div>
            )}
            {frequency !== "all" && (
              <div className="filter-pill">
                <span className="pill-label">Frecuencia:</span>
                <span className="pill-value">
                  {frequency === "daily" ? "Diario" : frequency === "weekly" ? "Semanal" : "Mensual"}
                </span>
                <button
                  onClick={() => {
                    setFrequency("all")
                    debouncedSearch(searchTerm, "all")
                  }}
                  className="pill-remove"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {!isSearching && hasActiveFilters && filteredCount === 0 && totalHabits > 0 && (
        <div className="no-results">
          <p>No se encontraron hábitos que coincidan con los filtros aplicados.</p>
          <button onClick={clearFilters} className="clear-filters-btn">
            Ver todos los hábitos
          </button>
        </div>
      )}
    </div>
  )
}

export default HabitsSearch
