import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MemberForm from '../components/MemberForm'
import { getMemberById, updateMember } from '../services/membersService'

const EditMember = () => {
  const [member, setMember] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const memberData = await getMemberById(id)
        setMember(memberData)
      } catch (err) {
        console.error('Error fetching member:', err)
        setFetchError('Failed to load member data.')
      }
    }

    fetchMember()
  }, [id])

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    setError(null)

    try {
      await updateMember(id, formData)
      // Redirect to member detail on success
      navigate(`/members/${id}`)
    } catch (err) {
      console.error('Error updating member:', err)
      setError('Failed to update member. Please try again.')
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate(`/members/${id}`)
  }

  if (fetchError) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Member</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{fetchError}</p>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Member</h1>
        <p className="text-gray-600">Loading member data...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Member</h1>
        <p className="text-gray-600 mt-2">Update {member.fullName}'s information</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <MemberForm
        member={member}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  )
}

export default EditMember
