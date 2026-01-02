import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  seedDefaultCategories,
  generateDefaultProRataRates
} from '../services/categoryService'
import ProRataRateEditor from './ProRataRateEditor'
import { categoryFormSchema } from '../schemas'
import { FormField, FormInput } from './form'

const CategoryManager = () => {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [joiningFeeMonths, setJoiningFeeMonths] = useState([])
  const [editingRates, setEditingRates] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      ageMin: '0',
      ageMax: '999',
      playingRights: '7 days',
      annualFee: '0',
      joiningFee: '0',
      isSpecial: false,
    }
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
    reset({
      name: '',
      ageMin: '0',
      ageMax: '999',
      playingRights: '7 days',
      annualFee: '0',
      joiningFee: '0',
      isSpecial: false,
    })
    setJoiningFeeMonths([])
    setShowCategoryForm(true)
    setError(null)
    setSuccess(null)
  }

  const openEditForm = (category) => {
    setEditingCategory(category)
    reset({
      name: category.name,
      ageMin: String(category.ageMin),
      ageMax: String(category.ageMax),
      playingRights: category.playingRights,
      annualFee: String(category.annualFee),
      joiningFee: String(category.joiningFee),
      isSpecial: category.isSpecial,
    })
    setJoiningFeeMonths(category.joiningFeeMonths || [])
    setShowCategoryForm(true)
    setError(null)
    setSuccess(null)
  }

  const closeForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
    setError(null)
  }

  const onFormSubmit = async (data) => {
    try {
      setError(null)
      setSuccess(null)

      const newAnnualFee = parseFloat(data.annualFee)
      const categoryData = {
        name: data.name,
        ageMin: parseInt(data.ageMin, 10),
        ageMax: parseInt(data.ageMax, 10),
        playingRights: data.playingRights,
        annualFee: newAnnualFee,
        joiningFee: parseFloat(data.joiningFee),
        isSpecial: data.isSpecial,
        joiningFeeMonths: joiningFeeMonths,
      }

      if (editingCategory) {
        // Check if annual fee changed - if so, regenerate pro-rata rates
        if (editingCategory.annualFee !== newAnnualFee) {
          categoryData.proRataRates = generateDefaultProRataRates(newAnnualFee)
        }

        // Update existing category
        await updateCategory(editingCategory.id, {
          ...categoryData,
          order: editingCategory.order
        })
        setSuccess('Category updated successfully' + (editingCategory.annualFee !== newAnnualFee ? ' (pro-rata rates recalculated)' : ''))
      } else {
        // Create new category with default pro-rata rates
        const order = categories.length + 1
        categoryData.proRataRates = generateDefaultProRataRates(newAnnualFee)
        await createCategory({ ...categoryData, order })
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
    } catch {
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
    } catch {
      setError('Failed to reorder categories')
      await loadCategories() // Reload on error
    }
  }

  const toggleJoiningFeeMonth = (month) => {
    if (joiningFeeMonths.includes(month)) {
      setJoiningFeeMonths(joiningFeeMonths.filter(m => m !== month))
    } else {
      setJoiningFeeMonths([...joiningFeeMonths, month].sort((a, b) => a - b))
    }
  }

  const handleSaveRates = async () => {
    setSuccess('Pro-rata rates saved successfully')
    setEditingRates(null)
    await loadCategories()
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Membership Categories
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Manage membership categories and their fees. Click <span className="text-purple-600 font-medium">Rates</span> to view/edit pro-rata rates for new members joining mid-year. Rates are auto-calculated from the annual fee but can be manually adjusted. Changing the annual fee will recalculate all rates.
      </p>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-secondary/20 border border-primary text-primary px-4 py-3 rounded mb-4">
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
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Initialize Default Categories
          </button>
        </div>
      )}

      {/* Add Category Button */}
      <div className="mb-4">
        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
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
                      className="text-primary hover:text-primary/80"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setEditingRates(category)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      Rates
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

            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <FormField
                    label="Category Name"
                    name="name"
                    required
                    error={errors.name?.message}
                  >
                    <FormInput
                      type="text"
                      id="name"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  </FormField>
                </div>

                {/* Age Range */}
                <FormField
                  label="Minimum Age"
                  name="ageMin"
                  required
                  error={errors.ageMin?.message}
                >
                  <FormInput
                    type="number"
                    id="ageMin"
                    min="0"
                    error={errors.ageMin?.message}
                    {...register('ageMin')}
                  />
                </FormField>

                <FormField
                  label="Maximum Age"
                  name="ageMax"
                  required
                  error={errors.ageMax?.message}
                >
                  <FormInput
                    type="number"
                    id="ageMax"
                    min="0"
                    error={errors.ageMax?.message}
                    {...register('ageMax')}
                  />
                </FormField>

                {/* Playing Rights */}
                <div className="col-span-2">
                  <FormField
                    label="Playing Rights"
                    name="playingRights"
                    required
                    error={errors.playingRights?.message}
                  >
                    <FormInput
                      type="text"
                      id="playingRights"
                      placeholder="e.g., 7 days, Weekends only, None"
                      error={errors.playingRights?.message}
                      {...register('playingRights')}
                    />
                  </FormField>
                </div>

                {/* Fees */}
                <FormField
                  label="Annual Fee ($)"
                  name="annualFee"
                  required
                  error={errors.annualFee?.message}
                >
                  <FormInput
                    type="number"
                    id="annualFee"
                    min="0"
                    step="0.01"
                    error={errors.annualFee?.message}
                    {...register('annualFee')}
                  />
                </FormField>

                <FormField
                  label="Joining Fee ($)"
                  name="joiningFee"
                  required
                  error={errors.joiningFee?.message}
                >
                  <FormInput
                    type="number"
                    id="joiningFee"
                    min="0"
                    step="0.01"
                    error={errors.joiningFee?.message}
                    {...register('joiningFee')}
                  />
                </FormField>

                {/* Special Flag */}
                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('isSpecial')}
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
                        className={`px-2 py-1 text-xs rounded ${joiningFeeMonths.includes(month.num)
                            ? 'bg-primary text-white'
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
                  className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
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

      {/* Pro-Rata Rate Editor Modal */}
      {editingRates && (
        <ProRataRateEditor
          category={editingRates}
          onSave={handleSaveRates}
          onClose={() => setEditingRates(null)}
        />
      )}
    </div>
  )
}

export default CategoryManager
