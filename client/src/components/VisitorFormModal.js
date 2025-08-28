import React, { useState, useEffect } from 'react';

const VisitorFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        licensePlate: '',
        purpose: 'Delivery',
        visitStartDate: new Date().toISOString().slice(0, 16),
        visitEndDate: '',
        status: 'ACTIVE',
        name: '',
        personToVisit: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                licensePlate: initialData.licensePlate || '',
                purpose: initialData.purpose || 'Delivery',
                visitStartDate: initialData.visitStartDate ? new Date(initialData.visitStartDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                visitEndDate: initialData.visitEndDate ? new Date(initialData.visitEndDate).toISOString().slice(0, 16) : '',
                status: initialData.status || 'ACTIVE',
                name: initialData.name || '',
                personToVisit: initialData.personToVisit || ''
            });
        } else {
            // Reset form for new entry
            setFormData({
                licensePlate: '',
                purpose: 'Delivery',
                visitStartDate: new Date().toISOString().slice(0, 16),
                visitEndDate: '',
                status: 'ACTIVE',
                name: '',
                personToVisit: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Visitor' : 'Add New Visitor'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                        <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} placeholder="License Plate" required className="p-2 border rounded" />
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Visitor Name" className="p-2 border rounded" />
                        <select name="purpose" value={formData.purpose} onChange={handleChange} className="p-2 border rounded">
                            <option value="Delivery">Delivery</option>
                            <option value="Meeting">Meeting</option>
                            <option value="Parcel Delivery">Parcel Delivery</option>
                            <option value="Others">Others</option>
                        </select>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Visit Start</label>
                            <input type="datetime-local" name="visitStartDate" value={formData.visitStartDate} onChange={handleChange} required className="p-2 border rounded w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Visit End</label>
                            <input type="datetime-local" name="visitEndDate" value={formData.visitEndDate} onChange={handleChange} required className="p-2 border rounded w-full" />
                        </div>
                        <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="PERMANENT">PERMANENT</option>
                        </select>
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 p-2 rounded-lg hover:bg-gray-400">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">{initialData ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VisitorFormModal;
