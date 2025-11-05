import { useState, useEffect } from 'react'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  seedDefaultCategories
} from '../services/categoryService'

const CategoryManager = () => {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    ageMin: 0,
    ageMax: 999,
    playingRights: '7 days',
    annualFee: 0,
    joiningFee: 0,
    isSpecial: false,
    joiningFeeMonths: []
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const cats = await getAllCategories()
      setCategories(cats)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedCategories = async () => {
    try {
      setError(null)
      setSuccess(null)
      const result = await seedDefaultCategories()

      if (result.success) {
        setSuccess(result.message)
        await loadCategories()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to seed categories: ' + err.message)
    }
  }

  const openAddForm = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      ageMin: 0,
      ageMax: 999,
      playingRights: '7 days',
      annualFee: 0,
      joiningFee: 0,
      isSpecial: false,
      joiningFeeMonths: []
    })
    setShowCategoryForm(true)
    setError(null)
    setSuccess(null)
  }

  const openEditForm = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      ageMin: category.ageMin,
      ageMax: category.ageMax,
      playingRights: category.playingRights,
      annualFee: category.annualFee,
      joiningFee: category.joiningFee,
      isSpecial: category.isSpecial,
      joiningFeeMonths: category.joiningFeeMonths || []
    })
    setShowCategoryForm(true)
    setError(null)
    setSuccess(null)
  }

  const closeForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError(null)
      setSuccess(null)

      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, {
          ...formData,
          order: editingCategory.order
        })
        setSuccess('Category updated successfully')
      } else {
        // Create new category
        const order = categories.length + 1
        await createCategory({ ...formData, order })
        setSuccess('Category created successfully')
      }

      await loadCategories()
      closeForm()
    } catch (err) {
      setError('Failed to save category: ' + err.message)
    }
  }

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?\n\nThis will fail if members are currently assigned to this category.`)) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await deleteCategory(categoryId)
      setSuccess('Category deleted successfully')
      await loadCategories()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleMoveUp = async (index) => {
    if (index === 0) return

    const reordered = [...categories]
    const temp = reordered[index]
    reordered[index] = reordered[index - 1]
    reordered[index - 1] = temp

    try {
      setCategories(reordered)
      await reorderCategories(reordered)
      setSuccess('Categories reordered successfully')
    } catch (err) {
      setError('Failed to reorder categories')
      await loadCategories() // Reload on error
    }
  }

  const handleMoveDown = async (index) => {
    if (index === categories.length - 1) return

    const reordered = [...categories]
    const temp = reordered[index]
    reordered[index] = reordered[index + 1]
    reordered[index + 1] = temp

    try {
      setCategories(reordered)
      await reorderCategories(reordered)
      setSuccess('Categories reordered successfully')
    } catch (err) {
      setError('Failed to reorder categories')
      await loadCategories() // Reload on error
    }
  }

  const toggleJoiningFeeMonth = (month) => {
    const months = formData.joiningFeeMonths || []
    if (months.includes(month)) {
      setFormData({ ...formData, joiningFeeMonths: months.filter(m => m !== month) })
    } else {
      setFormData({ ...formData, joiningFeeMonths: [...months, month].sort((a, b) => a - b) })
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Membership Categories
      </h2>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Seed Categories */}
      {!isLoading && categories.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <p className="text-gray-700 mb-3">
            No categories found. Would you like to initialize the default 8 membership categories?
          </p>
          <button
            onClick={handleSeedCategories}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Initialize Default Categories
          </button>
        </div>
      )}

      {/* Add Category Button */}
      <div className="mb-4">
        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          + Add New Category
        </button>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <p className="text-gray-600">Loading categories...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Playing Rights</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joining Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Special</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category, index) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === categories.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{category.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{category.ageMin} - {category.ageMax}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{category.playingRights}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">${category.annualFee}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">${category.joiningFee}</td>
                  <td className="px-4 py-3 text-sm">
                    {category.isSpecial ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Manual</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Auto</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      onClick={() => openEditForm(category)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Age *
                  </label>
                  <input
                    type="number"
                    value={formData.ageMin}
                    onChange={(e) => setFormData({ ...formData, ageMin: parseInt(e.target.value) })}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Age *
                  </label>
                  <input
                    type="number"
                    value={formData.ageMax}
                    onChange={(e) => setFormData({ ...formData, ageMax: parseInt(e.target.value) })}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Playing Rights */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Playing Rights *
                  </label>
                  <input
                    type="text"
                    value={formData.playingRights}
                    onChange={(e) => setFormData({ ...formData, playingRights: e.target.value })}
                    required
                    placeholder="e.g., 7 days, Weekends only, None"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Fees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Fee ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.annualFee}
                    onChange={(e) => setFormData({ ...formData, annualFee: parseFloat(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Fee ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.joiningFee}
                    onChange={(e) => setFormData({ ...formData, joiningFee: parseFloat(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Special Flag */}
                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isSpecial}
                      onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Manual Selection Only (not auto-assigned by age)
                    </span>
                  </label>
                </div>

                {/* Joining Fee Months (Optional) */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Joining Fee Applies (Optional - select months)
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { num: 1, name: 'Jan' }, { num: 2, name: 'Feb' }, { num: 3, name: 'Mar' },
                      { num: 4, name: 'Apr' }, { num: 5, name: 'May' }, { num: 6, name: 'Jun' },
                      { num: 7, name: 'Jul' }, { num: 8, name: 'Aug' }, { num: 9, name: 'Sep' },
                      { num: 10, name: 'Oct' }, { num: 11, name: 'Nov' }, { num: 12, name: 'Dec' }
                    ].map(month => (
                      <button
                        key={month.num}
                        type="button"
                        onClick={() => toggleJoiningFeeMonth(month.num)}
                        className={`px-2 py-1 text-xs rounded ${
                          (formData.joiningFeeMonths || []).includes(month.num)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {month.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank if joining fee applies year-round
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mt-4">
                  {error}
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryManager
