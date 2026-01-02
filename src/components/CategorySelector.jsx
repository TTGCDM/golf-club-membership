import PropTypes from 'prop-types'

/**
 * Month names for displaying membership year info
 */
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * CategorySelector Component
 * Displays all membership categories as selectable radio cards
 * Groups standard categories separate from special categories
 */
const CategorySelector = ({
  categories,
  selectedCategoryId,
  onSelect,
  suggestedCategoryId,
  error,
  disabled = false,
  loading = false
}) => {
  // Categories to exclude from public application
  const excludedCategories = ['Senior Full Membership', 'Life & Honorary Members']

  // Separate standard and special categories, excluding certain ones
  const standardCategories = categories.filter(cat =>
    !cat.isSpecial && !excludedCategories.includes(cat.name)
  )
  const specialCategories = categories.filter(cat => cat.isSpecial)

  // Format age range for display
  const formatAgeRange = (category) => {
    if (category.ageMin === 0 && category.ageMax >= 999) {
      return 'Any age'
    }
    if (category.ageMax >= 999) {
      return `${category.ageMin}+ years`
    }
    return `${category.ageMin}-${category.ageMax} years`
  }

  // Format joining fee info
  const formatJoiningFeeInfo = (category) => {
    if (!category.joiningFee || category.joiningFee === 0) {
      return null
    }
    if (category.joiningFeeMonths?.length > 0) {
      const monthNames = category.joiningFeeMonths.map(m => MONTH_NAMES[m]).join(', ')
      return `$${category.joiningFee} joining fee (${monthNames} only)`
    }
    return `$${category.joiningFee} joining fee`
  }

  // Render a category card
  const renderCategoryCard = (category) => {
    const isSelected = selectedCategoryId === category.id
    const isSuggested = suggestedCategoryId === category.id
    const joiningFeeInfo = formatJoiningFeeInfo(category)

    return (
      <label
        key={category.id}
        className={`
          relative flex cursor-pointer rounded-lg border p-4 transition-all
          ${isSelected
            ? 'border-success bg-success/10 ring-2 ring-success'
            : 'border-gray-300 bg-white hover:border-gray-400'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input
          type="radio"
          name="membershipCategoryId"
          value={category.id}
          checked={isSelected}
          onChange={() => onSelect(category)}
          disabled={disabled}
          className="sr-only"
        />

        <div className="flex w-full items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isSelected ? 'text-success' : 'text-gray-900'}`}>
                {category.name}
              </span>
              {isSuggested && !isSelected && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Suggested
                </span>
              )}
            </div>
            <div className={`mt-1 text-sm ${isSelected ? 'text-success/90' : 'text-gray-500'}`}>
              <span>{formatAgeRange(category)}</span>
              <span className="mx-2">|</span>
              <span className="font-medium">${category.annualFee}/year</span>
              <span className="mx-2">|</span>
              <span>{category.playingRights === 'None' ? 'No playing rights' : `${category.playingRights} playing`}</span>
            </div>
            {joiningFeeInfo && (
              <div className={`mt-1 text-xs ${isSelected ? 'text-success/80' : 'text-gray-400'}`}>
                {joiningFeeInfo}
              </div>
            )}
          </div>

          <div className={`
            ml-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border
            ${isSelected
              ? 'border-success bg-success'
              : 'border-gray-300 bg-white'
            }
          `}>
            {isSelected && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="6" cy="6" r="3" />
              </svg>
            )}
          </div>
        </div>
      </label>
    )
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Standard Categories */}
      <div className="space-y-2">
        {standardCategories.map(renderCategoryCard)}
      </div>

      {/* Special Categories Section */}
      {specialCategories.length > 0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-3 text-sm text-gray-500">Non Competition Memberships</span>
            </div>
          </div>
          <div className="space-y-2">
            {specialCategories.map(renderCategoryCard)}
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

CategorySelector.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    ageMin: PropTypes.number.isRequired,
    ageMax: PropTypes.number.isRequired,
    annualFee: PropTypes.number.isRequired,
    joiningFee: PropTypes.number,
    playingRights: PropTypes.string,
    isSpecial: PropTypes.bool,
    joiningFeeMonths: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  selectedCategoryId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  suggestedCategoryId: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool
}

export default CategorySelector
