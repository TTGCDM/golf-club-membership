import PropTypes from 'prop-types'
import { calculateProRataFeeSync } from '../services/categoryService'

/**
 * Month names for display
 */
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * MembershipCostCalculator Component
 * Displays itemized cost breakdown for selected membership category
 */
const MembershipCostCalculator = ({
  category,
  joiningDate = new Date(),
  className = ''
}) => {
  // Don't render if no category selected
  if (!category) {
    return null
  }

  // Calculate costs
  const costBreakdown = calculateProRataFeeSync(category, joiningDate)
  const currentMonthName = MONTH_NAMES[costBreakdown.currentMonth]
  const currentYear = joiningDate.getFullYear()

  // Determine joining fee explanation
  const getJoiningFeeExplanation = () => {
    if (category.joiningFee === 0) {
      return null
    }
    if (costBreakdown.joiningFee === 0 && category.joiningFee > 0) {
      // Fee exists but doesn't apply this month
      const monthNames = category.joiningFeeMonths?.map(m => MONTH_NAMES[m]).join(', ') || ''
      return `Joining fee waived (applies ${monthNames} only)`
    }
    if (category.joiningFeeMonths?.length > 0) {
      return `Joining fee (applies this month)`
    }
    return `Joining fee (one-time)`
  }

  const joiningFeeExplanation = getJoiningFeeExplanation()

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className={`rounded-lg border border-success/30 bg-success/10 p-4 ${className}`}>
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-success">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Cost Estimate
      </h3>

      <div className="space-y-3">
        {/* Category Info */}
        <div className="text-sm text-success">
          <div className="font-medium">{category.name}</div>
          <div className="text-success/90">Annual Rate: {formatCurrency(category.annualFee)}/year</div>
        </div>

        <div className="border-t border-success/30" />

        {/* Joining Details */}
        <div className="text-sm text-success">
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Joining in: {currentMonthName} {currentYear}</span>
          </div>
          <div className="mt-1 text-success/90">
            Months remaining in membership year: {costBreakdown.monthsRemaining} of 12
          </div>
        </div>

        <div className="border-t border-success/30" />

        {/* Cost Breakdown */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-success">
            <span>Pro-rata subscription:</span>
            <span className="font-medium">{formatCurrency(costBreakdown.proRataSubscription)}</span>
          </div>

          {category.joiningFee > 0 && (
            <div className="flex justify-between text-success">
              <span className="flex items-center gap-1">
                Joining fee:
                {joiningFeeExplanation && (
                  <span className="text-xs text-success/80">({joiningFeeExplanation})</span>
                )}
              </span>
              <span className="font-medium">
                {costBreakdown.joiningFee > 0 ? `+ ${formatCurrency(costBreakdown.joiningFee)}` : '$0.00'}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-success/40" />

        {/* Total */}
        <div className="flex justify-between text-base font-semibold text-success">
          <span>Estimated total:</span>
          <span>{formatCurrency(costBreakdown.total)}</span>
        </div>

        {/* Disclaimer */}
        <div className="mt-2 rounded bg-success/20 p-2 text-xs text-success/90">
          <div className="flex items-start gap-1">
            <svg className="mt-0.5 h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Membership year runs March to February. Final amount confirmed upon approval.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

MembershipCostCalculator.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    annualFee: PropTypes.number.isRequired,
    joiningFee: PropTypes.number,
    joiningFeeMonths: PropTypes.arrayOf(PropTypes.number),
    proRataRates: PropTypes.object
  }),
  joiningDate: PropTypes.instanceOf(Date),
  className: PropTypes.string
}

export default MembershipCostCalculator
