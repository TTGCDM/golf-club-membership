import { useNavigate, useParams } from 'react-router-dom'
import MemberForm from '../components/MemberForm'
import { useMember, useUpdateMember } from '@/hooks/useMember'
import PageBreadcrumb from '../components/PageBreadcrumb'

const EditMember = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const { data: member, isLoading: isFetching, error: fetchError } = useMember(id)

  const updateMutation = useUpdateMember({
    onSuccess: () => {
      navigate(`/members/${id}`)
    }
  })

  const handleSubmit = async (formData) => {
    updateMutation.mutate({ memberId: id, data: formData })
  }

  const handleCancel = () => {
    navigate(`/members/${id}`)
  }

  if (fetchError) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Member</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load member data.</p>
        </div>
      </div>
    )
  }

  if (isFetching || !member) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Member</h1>
        <p className="text-gray-600">Loading member data...</p>
      </div>
    )
  }

  return (
    <div>
      <PageBreadcrumb
        items={[
          { label: 'Members', href: '/members' },
          { label: member.fullName, href: `/members/${id}` },
          { label: 'Edit' }
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Member</h1>
        <p className="text-gray-600 mt-2">Update {member.fullName}&apos;s information</p>
      </div>

      <MemberForm
        member={member}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateMutation.isPending}
      />
    </div>
  )
}

export default EditMember
