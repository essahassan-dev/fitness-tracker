import React, { useState, useEffect } from 'react';
import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { nutritionAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import Modal from '../../components/UI/Modal';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const emptyFood = () => ({
  name: '', quantity: 1, unit: 'serving', calories: '', protein: '', carbs: '', fat: '', fiber: '',
});

const NutritionForm = ({ isOpen, onClose, onSuccess, entry }) => {
  const isEdit = !!entry;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    mealType: 'breakfast',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    foods: [emptyFood()],
  });

  useEffect(() => {
    if (entry) {
      setForm({
        mealType: entry.mealType || 'breakfast',
        date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: entry.notes || '',
        foods: entry.foods?.length > 0
          ? entry.foods.map((f) => ({
              name: f.name || '',
              quantity: f.quantity || 1,
              unit: f.unit || 'serving',
              calories: f.calories || '',
              protein: f.protein || '',
              carbs: f.carbs || '',
              fat: f.fat || '',
              fiber: f.fiber || '',
            }))
          : [emptyFood()],
      });
    } else {
      setForm({
        mealType: 'breakfast',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        foods: [emptyFood()],
      });
    }
  }, [entry, isOpen]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFoodChange = (idx, field, value) => {
    const updated = [...form.foods];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, foods: updated });
  };

  const addFood = () => setForm({ ...form, foods: [...form.foods, emptyFood()] });

  const removeFood = (idx) => {
    if (form.foods.length === 1) return;
    setForm({ ...form, foods: form.foods.filter((_, i) => i !== idx) });
  };

  // Calculate totals
  const totals = form.foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (Number(f.calories) || 0),
      protein: acc.protein + (Number(f.protein) || 0),
      carbs: acc.carbs + (Number(f.carbs) || 0),
      fat: acc.fat + (Number(f.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.foods.some((f) => !f.name.trim())) { toast.error('All food items need a name'); return; }
    if (form.foods.some((f) => !f.calories)) { toast.error('All food items need calories'); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        foods: form.foods.map((f) => ({
          ...f,
          quantity: Number(f.quantity) || 1,
          calories: Number(f.calories) || 0,
          protein: Number(f.protein) || 0,
          carbs: Number(f.carbs) || 0,
          fat: Number(f.fat) || 0,
          fiber: Number(f.fiber) || 0,
        })),
      };

      if (isEdit) {
        await nutritionAPI.update(entry._id, payload);
        toast.success('Meal updated!');
      } else {
        await nutritionAPI.create(payload);
        toast.success('Meal logged! 🍎');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Meal' : 'Log Meal'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Meal Type</label>
            <select name="mealType" value={form.mealType} onChange={handleChange} className="select">
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input" />
          </div>
        </div>

        {/* Foods */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-white">Food Items</label>
            <button type="button" onClick={addFood} className="btn-secondary text-xs py-1.5 px-3">
              <RiAddLine /> Add Food
            </button>
          </div>

          <div className="space-y-4">
            {form.foods.map((food, idx) => (
              <div key={idx} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-400 text-xs font-medium uppercase tracking-wide">Item {idx + 1}</span>
                  {form.foods.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFood(idx)}
                      className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <RiDeleteBinLine />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <input
                      value={food.name}
                      onChange={(e) => handleFoodChange(idx, 'name', e.target.value)}
                      placeholder="Food name *"
                      className="input text-sm"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={food.quantity}
                      onChange={(e) => handleFoodChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      min="0"
                      step="0.1"
                      className="input text-sm w-16"
                    />
                    <input
                      value={food.unit}
                      onChange={(e) => handleFoodChange(idx, 'unit', e.target.value)}
                      placeholder="Unit"
                      className="input text-sm flex-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-dark-500 mb-1 block">Calories *</label>
                    <input
                      type="number"
                      value={food.calories}
                      onChange={(e) => handleFoodChange(idx, 'calories', e.target.value)}
                      placeholder="kcal"
                      min="0"
                      className="input text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-500 mb-1 block">Protein (g)</label>
                    <input
                      type="number"
                      value={food.protein}
                      onChange={(e) => handleFoodChange(idx, 'protein', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-500 mb-1 block">Carbs (g)</label>
                    <input
                      type="number"
                      value={food.carbs}
                      onChange={(e) => handleFoodChange(idx, 'carbs', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-500 mb-1 block">Fat (g)</label>
                    <input
                      type="number"
                      value={food.fat}
                      onChange={(e) => handleFoodChange(idx, 'fat', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="input text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals preview */}
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wide mb-3">Meal Totals</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Calories', value: Math.round(totals.calories), unit: 'kcal', color: 'text-brand-400' },
              { label: 'Protein', value: Math.round(totals.protein), unit: 'g', color: 'text-blue-400' },
              { label: 'Carbs', value: Math.round(totals.carbs), unit: 'g', color: 'text-orange-400' },
              { label: 'Fat', value: Math.round(totals.fat), unit: 'g', color: 'text-purple-400' },
            ].map(({ label, value, unit, color }) => (
              <div key={label}>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-dark-500 text-xs">{unit} {label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <input
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Optional notes..."
            className="input"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEdit ? 'Update Meal' : 'Log Meal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NutritionForm;
