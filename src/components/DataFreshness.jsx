import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/utils/dateUtils'

/**
 * DataFreshness - Shows last updated time and optional refresh button
 *
 * @param {object} props
 * @param {number} props.dataUpdatedAt - React Query's dataUpdatedAt timestamp
 * @param {boolean} props.isFetching - Whether data is currently being fetched
 * @param {function} props.refetch - Function to trigger refetch
 * @param {number} props.staleTime - Stale time in ms for warning threshold (default 5 min)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showRefreshButton - Whether to show the refresh button (default true)
 * @param {boolean} props.compact - Use compact inline layout (default false)
 */
export const DataFreshness = ({
  dataUpdatedAt,
  isFetching = false,
  refetch,
  staleTime = 5 * 60 * 1000,
  className,
  showRefreshButton = true,
  compact = false
}) => {
  const [, setTick] = useState(0)

  // Update display every minute to keep "X minutes ago" current
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const timeAgo = formatTimeAgo(dataUpdatedAt)
  const isVeryStale = dataUpdatedAt && (Date.now() - dataUpdatedAt > staleTime * 2)

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <span className={cn(isVeryStale && 'text-amber-600')}>
          Updated {timeAgo}
        </span>
        {showRefreshButton && (
          <button
            onClick={() => refetch?.()}
            disabled={isFetching}
            className="p-1 hover:bg-muted rounded-md disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Last updated: {timeAgo}
        </span>
        {isVeryStale && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            May be outdated
          </Badge>
        )}
        {isFetching && (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Updating...
          </Badge>
        )}
      </div>
      {showRefreshButton && !isFetching && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch?.()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      )}
    </div>
  )
}

/**
 * StaleDataBanner - Prominent warning when data is significantly stale
 *
 * @param {object} props
 * @param {number} props.dataUpdatedAt - React Query's dataUpdatedAt timestamp
 * @param {number} props.staleThreshold - Time in ms before showing warning (default 10 min)
 * @param {function} props.refetch - Function to trigger refetch
 * @param {boolean} props.isFetching - Whether data is currently being fetched
 */
export const StaleDataBanner = ({
  dataUpdatedAt,
  staleThreshold = 10 * 60 * 1000,
  refetch,
  isFetching
}) => {
  const [, setTick] = useState(0)

  // Update display every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!dataUpdatedAt) return null

  const timeSinceUpdate = Date.now() - dataUpdatedAt
  if (timeSinceUpdate < staleThreshold) return null

  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between">
      <div className="flex items-center gap-2 text-amber-800">
        <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-sm font-medium">
          Data may be outdated. Last updated {formatTimeAgo(dataUpdatedAt)}.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch?.()}
        disabled={isFetching}
        className="bg-white hover:bg-amber-100 flex-shrink-0"
      >
        {isFetching ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </>
        )}
      </Button>
    </div>
  )
}

export default DataFreshness
