// src/pages/Employees.jsx
import React, { useState, useEffect } from 'react';
import EmployeeCard from '../components/employees/EmployeeCard.jsx';
import AddEmployeeModal from '../components/employees/AddEmployeeModal.jsx';
import EditEmployeeModal from '../components/employees/EditEmployeeModal.jsx';
import DeleteConfirmModal from '../components/employees/DeleteConfirmModal.jsx';
import service from '../api/service';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch employees — backend returns a plain array
  const fetchEmployees = async () => {
    try {
      setRefreshing(true);
      const response = await service.getEmployees();
      // Backend returns a plain array of employee objects
      const list = Array.isArray(response) ? response : [];
      setEmployees(list);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add employee — backend returns the new employee object on success
  const handleAddEmployee = async (employeeData) => {
    try {
      setActionLoading(true);
      await service.createEmployee(employeeData);
      await fetchEmployees();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding employee:', err);
      setError(err.response?.data?.message || 'Failed to add employee');
    } finally {
      setActionLoading(false);
    }
  };

  // Update employee — backend returns the updated employee object
  const handleUpdateEmployee = async (employeeData) => {
    try {
      setActionLoading(true);
      await service.updateEmployee(selectedEmployee._id, employeeData);
      await fetchEmployees();
      setShowEditModal(false);
      setSelectedEmployee(null);
    } catch (err) {
      console.error('Error updating employee:', err);
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle employee status — backend returns the updated employee object
  const handleToggleStatus = async (employee) => {
    try {
      setActionLoading(true);
      await service.toggleEmployeeStatus(employee._id);
      await fetchEmployees();
    } catch (err) {
      console.error('Error toggling status:', err);
      setError(err.response?.data?.message || 'Failed to toggle employee status');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete employee — backend returns { message } on success
  const handleDeleteEmployee = async () => {
    try {
      setActionLoading(true);
      await service.deleteEmployee(selectedEmployee._id);
      await fetchEmployees();
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError(err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)] overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Employee Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage your team members and their accounts
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchEmployees}
                  disabled={refreshing}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh employees"
                >
                  <svg
                    className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Employee
                  </span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
              {error}
              <button
                onClick={() => setError(null)}
                className="float-right font-bold"
              >
                ×
              </button>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                All Employees ({employees.length})
              </h2>
            </div>

            {refreshing && employees.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No employees
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by adding your first employee.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Employee
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map((employee) => (
                  <EmployeeCard
                    key={employee._id}
                    employee={employee}
                    onEdit={openEditModal}
                    onToggleStatus={handleToggleStatus}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEmployee}
        loading={actionLoading}
      />

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleUpdateEmployee}
        employee={selectedEmployee}
        loading={actionLoading}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleDeleteEmployee}
        employee={selectedEmployee}
        loading={actionLoading}
      />
    </main>
  );
};

export default Employees;