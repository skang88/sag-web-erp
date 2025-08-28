import React, { useState, useEffect, useCallback } from 'react';
import VisitorFormModal from '../components/VisitorFormModal'; // Import the modal component

const API_BASE_URL = process.env.REACT_APP_API_URL;

const VisitorListPage = () => {
    const [visitors, setVisitors] = useState([]);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({
        plateNumber: '',
        startDate: '',
        endDate: '',
        status: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVisitor, setEditingVisitor] = useState(null);

    const fetchVisitors = useCallback(async (page = 1) => {
        setIsLoading(true);
        const query = new URLSearchParams({ page, limit: 10, ...filters }).toString();
        try {
            const response = await fetch(`${API_BASE_URL}/visitor?${query}`);
            const data = await response.json();
            if (response.ok) {
                setVisitors(data.data);
                setPagination(data.pagination);
            } else {
                throw new Error(data.message || 'Failed to fetch visitors');
            }
        } catch (error) {
            console.error('Error fetching visitors:', error);
            alert('Error fetching visitors: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchVisitors(1);
    };

    const handleOpenModal = (visitor = null) => {
        setEditingVisitor(visitor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVisitor(null);
    };

    const handleDelete = async (visitorId) => {
        if (window.confirm('Are you sure you want to delete this visitor?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/visitor/${visitorId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete visitor');
                }
                alert('Visitor deleted successfully');
                fetchVisitors(pagination.currentPage);
            } catch (error) {
                console.error('Error deleting visitor:', error);
                alert('Error: ' + error.message);
            }
        }
    };

    const handleSubmit = async (formData) => {
        const url = editingVisitor ? `${API_BASE_URL}/visitor/${editingVisitor._id}` : `${API_BASE_URL}/visitor`;
        const method = editingVisitor ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Failed to ${editingVisitor ? 'update' : 'create'} visitor`);
            }

            alert(`Visitor ${editingVisitor ? 'updated' : 'created'} successfully`);
            handleCloseModal();
            fetchVisitors(editingVisitor ? pagination.currentPage : 1);
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error: ' + error.message);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { dateStyle: 'short', timeStyle: 'short' };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-200 text-green-800';
            case 'EXPIRED': return 'bg-red-200 text-red-800';
            case 'PERMANENT': return 'bg-blue-200 text-blue-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    };

    return (
        <>
            <VisitorFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={editingVisitor}
            />
            <div className="p-6 bg-gray-100 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Visitor List</h1>
                    <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                        + Add Visitor
                    </button>
                </div>

                <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <input type="text" name="plateNumber" value={filters.plateNumber} onChange={handleFilterChange} placeholder="License Plate" className="p-2 border rounded" />
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded" />
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded" />
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded">
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="PERMANENT">Permanent</option>
                    </select>
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">Filter</button>
                </form>

                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-2 text-left">License Plate</th>
                                        <th className="p-2 text-left">Name</th>
                                        <th className="p-2 text-left">Purpose</th>
                                        <th className="p-2 text-left">Status</th>
                                        <th className="p-2 text-left">Visit Start</th>
                                        <th className="p-2 text-left">Visit End</th>
                                        <th className="p-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visitors.map(visitor => (
                                        <tr key={visitor._id} className="border-b">
                                            <td className="p-2 font-mono">{visitor.licensePlate}</td>
                                            <td className="p-2">{visitor.name || '--'}</td>
                                            <td className="p-2">{visitor.purpose}</td>
                                            <td className="p-2">
                                                <span className={`px-2 py-1 rounded-full text-sm ${getStatusClass(visitor.status)}`}>
                                                    {visitor.status}
                                                </span>
                                            </td>
                                            <td className="p-2">{formatDate(visitor.visitStartDate)}</td>
                                            <td className="p-2">{formatDate(visitor.visitEndDate)}</td>
                                            <td className="p-2 whitespace-nowrap">
                                                <button onClick={() => handleOpenModal(visitor)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600">Edit</button>
                                                <button onClick={() => handleDelete(visitor._id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <span>Page {pagination.currentPage || 1} of {pagination.totalPages || 1}</span>
                            <div>
                                <button onClick={() => fetchVisitors(pagination.currentPage - 1)} disabled={!pagination.currentPage || pagination.currentPage <= 1} className="bg-gray-300 p-2 rounded mr-2 disabled:opacity-50">Previous</button>
                                <button onClick={() => fetchVisitors(pagination.currentPage + 1)} disabled={!pagination.currentPage || pagination.currentPage >= pagination.totalPages} className="bg-gray-300 p-2 rounded disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default VisitorListPage;
