// components/customers/CustomerDetails.jsx
"use client";

import React from "react";
import {
  X,
  Building,
  Mail,
  Phone,
  User,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  ShoppingBag,
  Award,
} from "lucide-react";

const CustomerDetails = ({ customer, isOpen, onClose }) => {
  if (!isOpen || !customer) return null;

  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500", label: "Active" },
      INACTIVE: { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500", label: "Inactive" },
      SUSPENDED: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500", label: "Suspended" },
      BLOCKED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500", label: "Blocked" },
    };

    const style = statusMap[status] || statusMap.ACTIVE;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mr-1.5`}></span>
        {style.label}
      </span>
    );
  };

  const getCustomerTypeBadge = (type) => {
    const typeMap = {
      CORPORATE: { bg: "bg-blue-100", text: "text-blue-800", label: "Corporate" },
      INDIVIDUAL: { bg: "bg-purple-100", text: "text-purple-800", label: "Individual" },
      RETAIL: { bg: "bg-orange-100", text: "text-orange-800", label: "Retail" },
      WHOLESALE: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Wholesale" },
    };

    const style = typeMap[type] || typeMap.CORPORATE;

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const DetailRow = ({ icon: Icon, label, value, valueClassName = "" }) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 w-5 h-5 text-gray-400 mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className={`text-sm text-gray-900 break-words ${valueClassName}`}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );

  const Section = ({ title, icon: Icon, children }) => (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0   bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Customer Details
            </h3>
            <p className="text-sm text-gray-500">{customer.customerCode}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Customer Name & Status */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {customer.customerName}
                </h2>
                <p className="text-sm text-gray-500">{customer.companyName}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(customer.status)}
                <span className="text-xs text-gray-400">
                  Since {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <Section title="Basic Information" icon={Building}>
                <DetailRow
                  icon={Building}
                  label="Customer Type"
                  value={getCustomerTypeBadge(customer.customerType)}
                />
                <DetailRow
                  icon={Briefcase}
                  label="Industry Type"
                  value={customer.industryType}
                />
                <DetailRow
                  icon={Building}
                  label="Website"
                  value={customer.website}
                  valueClassName="text-blue-600 hover:underline"
                />
              </Section>
            </div>

            {/* Contact Information */}
            <div className="md:col-span-2">
              <Section title="Contact Information" icon={Mail}>
                <DetailRow icon={Mail} label="Email" value={customer.email} />
                <DetailRow icon={Phone} label="Phone" value={customer.phone} />
                <DetailRow icon={Phone} label="Mobile" value={customer.mobile} />
                {customer.contactPerson && (
                  <>
                    <DetailRow
                      icon={User}
                      label="Contact Person"
                      value={customer.contactPerson}
                    />
                    <DetailRow
                      icon={User}
                      label="Designation"
                      value={customer.contactDesignation}
                    />
                    <DetailRow
                      icon={Phone}
                      label="Contact Phone"
                      value={customer.contactPhone}
                    />
                    <DetailRow
                      icon={Mail}
                      label="Contact Email"
                      value={customer.contactEmail}
                    />
                  </>
                )}
              </Section>
            </div>

            {/* Address Information */}
            {(customer.addressLine1 || customer.city || customer.state) && (
              <div className="md:col-span-2">
                <Section title="Address Information" icon={MapPin}>
                  <DetailRow
                    icon={MapPin}
                    label="Address"
                    value={[customer.addressLine1, customer.addressLine2]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <DetailRow
                    icon={MapPin}
                    label="City"
                    value={customer.city}
                  />
                  <DetailRow
                    icon={MapPin}
                    label="State"
                    value={customer.state}
                  />
                  <DetailRow
                    icon={MapPin}
                    label="Pincode"
                    value={customer.pincode}
                  />
                  <DetailRow
                    icon={MapPin}
                    label="Country"
                    value={customer.country}
                  />
                </Section>
              </div>
            )}

            {/* Tax & Financial Information */}
            {(customer.gstNumber ||
              customer.panNumber ||
              customer.paymentTerms ||
              customer.creditLimit) && (
              <div className="md:col-span-2">
                <Section title="Tax & Financial Information" icon={Briefcase}>
                  <DetailRow
                    icon={Briefcase}
                    label="GST Number"
                    value={customer.gstNumber}
                  />
                  <DetailRow
                    icon={Briefcase}
                    label="PAN Number"
                    value={customer.panNumber}
                  />
                  <DetailRow
                    icon={Briefcase}
                    label="Payment Terms"
                    value={customer.paymentTerms}
                  />
                  <DetailRow
                    icon={DollarSign}
                    label="Credit Limit"
                    value={formatCurrency(customer.creditLimit)}
                  />
                  <DetailRow
                    icon={Calendar}
                    label="Credit Days"
                    value={customer.creditDays ? `${customer.creditDays} days` : "N/A"}
                  />
                  <DetailRow
                    icon={DollarSign}
                    label="Discount Percentage"
                    value={customer.discountPercentage ? `${customer.discountPercentage}%` : "N/A"}
                  />
                </Section>
              </div>
            )}

            {/* Order Statistics */}
            {(customer.totalOrders > 0 || customer.totalSpent > 0) && (
              <div className="md:col-span-2">
                <Section title="Order Statistics" icon={ShoppingBag}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {customer.totalOrders || 0}
                      </p>
                      <p className="text-xs text-gray-500">Total Orders</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                      <p className="text-xs text-gray-500">Total Spent</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(customer.averageOrderValue)}
                      </p>
                      <p className="text-xs text-gray-500">Avg. Order Value</p>
                    </div>
                  </div>
                  {customer.loyaltyTier && (
                    <div className="mt-3 flex items-center gap-2 bg-yellow-50 rounded-lg p-2">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-gray-700">
                        Loyalty Tier: <strong>{customer.loyaltyTier}</strong>
                        {customer.loyaltyPoints > 0 &&
                          ` (${customer.loyaltyPoints} points)`}
                      </span>
                    </div>
                  )}
                </Section>
              </div>
            )}

            {/* Notes */}
            {customer.notes && (
              <div className="md:col-span-2">
                <Section title="Notes" icon={Briefcase}>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {customer.notes}
                  </p>
                </Section>
              </div>
            )}

            {/* Audit Information */}
            <div className="md:col-span-2">
              <Section title="Audit Information" icon={Calendar}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-500">Created By</span>
                    <p className="text-gray-700">{customer.createdBy || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Created At</span>
                    <p className="text-gray-700">{formatDate(customer.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Updated By</span>
                    <p className="text-gray-700">{customer.updatedBy || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Updated At</span>
                    <p className="text-gray-700">{formatDate(customer.updatedAt)}</p>
                  </div>
                </div>
              </Section>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;