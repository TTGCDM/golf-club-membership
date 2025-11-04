import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MemberForm from '../components/MemberForm'
import { createMember } from '../services/membersService'

const AddMember = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    setError(null)

    try {
      await createMember(formData)
      // Redirect to members list on success
      navigate('/members')
    } catch (err) {
      console.error('Error adding member:', err)
      setError('Failed to add member. Please try again.')
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/members')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Member</h1>
        <p className="text-gray-600 mt-2">Enter the member's information below</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <MemberForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  )
}

export default AddMember
