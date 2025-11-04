import { useState, useEffect } from 'react'
import { getAllCategories, determineCategoryByAge, calculateAge } from '../services/membershipCategories'

const MemberForm = ({ member, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    dateJoined: new Date().toISOString().split('T')[0],
    golfAustraliaId: '',
    membershipCategory: '',
    status: 'active',
    accountBalance: 0
  })

  const [suggestedCategory, setSuggestedCategory] = useState(null)
  const [currentAge, setCurrentAge] = useState(null)

  const categories = getAllCategories()

  // Load existing member data if editing
  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName || '',
        email: member.email || '',
        phone: member.phone || '',
        address: member.address || '',
        dateOfBirth: member.dateOfBirth || '',
        emergencyContact: member.emergencyContact || '',
        dateJoined: member.dateJoined || '',
        golfAustraliaId: member.golfAustraliaId || '',
        membershipCategory: member.membershipCategory || '',
        status: member.status || 'active',
        accountBalance: member.accountBalance || 0
      })
    }
  }, [member])

  // Auto-suggest category based on date of birth
  useEffect(() => {
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth)
      setCurrentAge(age)

      const suggested = determineCategoryByAge(formData.dateOfBirth)
      setSuggestedCategory(suggested)

      // Auto-fill category if not already set
      if (!formData.membershipCategory && !member) {
        setFormData(prev => ({ ...prev, membershipCategory: suggested }))
      }
    }
  }, [formData.dateOfBirth, member])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {currentAge !== null && (
              <p className="text-sm text-gray-500 mt-1">Current age: {currentAge} years</p>
            )}
          </div>

          <div>
            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact *
            </label>
            <input
              type="text"
              id="emergencyContact"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              required
              placeholder="Name and phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Membership Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="golfAustraliaId" className="block text-sm font-medium text-gray-700 mb-1">
              Golf Australia ID
            </label>
            <input
              type="text"
              id="golfAustraliaId"
              name="golfAustraliaId"
              value={formData.golfAustraliaId}
              onChange={handleChange}
              placeholder="Optional for social members"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dateJoined" className="block text-sm font-medium text-gray-700 mb-1">
              Date Joined *
            </label>
            <input
              type="date"
              id="dateJoined"
              name="dateJoined"
              value={formData.dateJoined}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="membershipCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Membership Category *
            </label>
            <select
              id="membershipCategory"
              name="membershipCategory"
              value={formData.membershipCategory}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} - ${category.annualFee}/year
                </option>
              ))}
            </select>
            {suggestedCategory && formData.membershipCategory !== suggestedCategory && (
              <p className="text-sm text-blue-600 mt-1">
                Suggested based on age: {categories.find(c => c.id === suggestedCategory)?.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {member && (
            <div>
              <label htmlFor="accountBalance" className="block text-sm font-medium text-gray-700 mb-1">
                Account Balance
              </label>
              <input
                type="number"
                id="accountBalance"
                name="accountBalance"
                value={formData.accountBalance}
                onChange={handleChange}
                step="0.01"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Balance is managed through payments and fees
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}

export default MemberForm
