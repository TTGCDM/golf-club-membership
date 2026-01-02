import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/**
 * Reusable breadcrumb component for page navigation
 * @param {Object} props
 * @param {Array<{label: string, href?: string}>} props.items - Breadcrumb items. Last item should have no href (current page)
 * @example
 * <PageBreadcrumb items={[
 *   { label: 'Members', href: '/members' },
 *   { label: 'John Smith' }
 * ]} />
 */
const PageBreadcrumb = ({ items = [] }) => {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Always show Dashboard as home */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="max-w-[200px] truncate">
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default PageBreadcrumb
