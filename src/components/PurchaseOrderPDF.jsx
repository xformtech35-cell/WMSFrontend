// components/PurchaseOrderPDF.jsx
"use client";
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/Helvetica.ttf' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  container: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 25,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 3,
    borderBottomColor: '#2563EB',
    paddingBottom: 15,
    marginBottom: 15,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  companyDetails: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 3,
  },
  companyDetailLine: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  poDetails: {
    fontSize: 11,
    marginTop: 5,
  },
  poDetailLine: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  infoColumn: {
    flex: 1,
  },
  supplierName: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 10.5,
    color: '#4B5563',
  },
  infoTextBold: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  table: {
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tableCellCenter: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
  },
  tableCellRight: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'right',
  },
  totalRow: {
    backgroundColor: '#EFF6FF',
    fontWeight: 'bold',
    borderTopWidth: 2,
    borderTopColor: '#2563EB',
    borderTopStyle: 'solid',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signature: {
    marginTop: 20,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#9CA3AF',
    borderTopStyle: 'solid',
    width: 180,
  },
  termsContainer: {
    marginTop: 10,
    padding: 6,
    backgroundColor: '#F9FAFB',
    fontSize: 8.5,
    color: '#4B5563',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
  },
  termsTitle: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },
  termsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingLeft: 16,
  },
  termsItem: {
    fontSize: 8.5,
    color: '#4B5563',
    width: '50%',
  },
  footerBottom: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  remarksContainer: {
    marginBottom: 15,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    borderLeftStyle: 'solid',
  },
});

const formatCurrency = (amount) => {
  if (!amount) return '₹0.00';
  return `₹${amount.toFixed(2)}`;
};

const formatNumber = (num) => {
  if (!num) return '0.00';
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function PurchaseOrderPDF({ po, formatDate }) {
  if (!po) return null;

  const companyDetails = {
    name: "YOUR COMPANY NAME",
    address: "123 Business Street, City, State - 123456",
    phone: "+91 98765 43210",
    email: "info@yourcompany.com",
    website: "www.yourcompany.com",
    gst: "GSTIN: 22AAAAA0000A1Z5",
    pan: "PAN: AAAAA0000A",
  };

  const getStatusText = (status) => {
    const statusMap = {
      DRAFT: "Draft",
      PENDING: "Pending Approval",
      SUBMITTED: "Submitted",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      PARTIAL: "Partially Received",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      IN_PROGRESS: "In Progress",
    };
    return statusMap[status] || status || "N/A";
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: { bg: '#F3F4F6', text: '#6B7280' },
      PENDING: { bg: '#FEF3C7', text: '#92400E' },
      SUBMITTED: { bg: '#DBEAFE', text: '#1E40AF' },
      APPROVED: { bg: '#D1FAE5', text: '#065F46' },
      REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
      PARTIAL: { bg: '#FFEDD5', text: '#9A3412' },
      COMPLETED: { bg: '#EDE9FE', text: '#5B21B6' },
      CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
      IN_PROGRESS: { bg: '#E0E7FF', text: '#3730A3' },
    };
    return colors[status] || colors.DRAFT;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    po.lines?.forEach(line => {
      subtotal += line.quantity * line.unitPrice;
    });
    return {
      subtotal,
      discount: po.discountAmount || 0,
      shipping: po.shippingCharges || 0,
      gst: po.totalGst || 0,
      grandTotal: po.grandTotal || subtotal
    };
  };

  const totals = calculateTotals();
  const statusBadge = getStatusBadge(po.status);
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.companyName}>{companyDetails.name}</Text>
              <View style={styles.companyDetails}>
                <Text>{companyDetails.address}</Text>
                <Text style={styles.companyDetailLine}>
                  {companyDetails.phone} |  {companyDetails.email} |  {companyDetails.website}
                </Text>
                <Text style={styles.companyDetailLine}>
                  {companyDetails.gst} | {companyDetails.pan}
                </Text>
              </View>
            </View>
            <View>
              <Text style={styles.docTitle}>Purchase Order</Text>
              <View style={styles.poDetails}>
                <Text style={styles.poDetailLine}>
                  <Text style={{ fontWeight: 'bold' }}>PO Number:</Text> <Text style={{ color: '#2563EB' }}>{po.poNumber}</Text>
                </Text>
                <Text style={styles.poDetailLine}>
                  <Text style={{ fontWeight: 'bold' }}>PO Date:</Text> {formatDate(po.poDate)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text style={{ fontWeight: 'bold' }}>Status: </Text>
                  <View style={{
                    backgroundColor: statusBadge.bg,
                    paddingHorizontal: 10,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}>
                    <Text style={{ color: statusBadge.text, fontSize: 10, fontWeight: 'bold' }}>
                      {getStatusText(po.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* SUPPLIER & DELIVERY INFO */}
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.sectionTitle}>Supplier Information</Text>
              <Text style={styles.supplierName}>{po.supplierName}</Text>
              {po.supplierAddress && <Text style={styles.infoText}>{po.supplierAddress}</Text>}
              {po.supplierEmail && <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Email:</Text> {po.supplierEmail}</Text>}
              {po.supplierPhone && <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Phone:</Text> {po.supplierPhone}</Text>}
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.sectionTitle}>Delivery Information</Text>
              <Text style={styles.infoText}>
                <Text style={{ fontWeight: 'bold' }}>Expected Delivery:</Text> {formatDate(po.expectedArrivalDate)}
              </Text>
              {po.shippingAddress && (
                <View style={{ marginTop: 3 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 10.5, color: '#4B5563' }}>Shipping Address:</Text>
                  <Text style={styles.infoText}>{po.shippingAddress}</Text>
                </View>
              )}
              {po.purchaseRequestNumber && (
                <Text style={{ marginTop: 3, fontSize: 10.5 }}>
                  <Text style={{ fontWeight: 'bold' }}>PR Reference:</Text> PR-{po.purchaseRequestNumber}
                </Text>
              )}
            </View>
          </View>

          {/* ORDER ITEMS TABLE */}
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCellCenter, { width: '5%' }]}>#</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>Item Code</Text>
              <Text style={[styles.tableCell, { width: '28%' }]}>Description</Text>
              <Text style={[styles.tableCellCenter, { width: '8%' }]}>UOM</Text>
              <Text style={[styles.tableCellRight, { width: '10%' }]}>Qty</Text>
              <Text style={[styles.tableCellRight, { width: '15%' }]}>Unit Price (₹)</Text>
              <Text style={[styles.tableCellRight, { width: '19%' }]}>Total (₹)</Text>
            </View>

            {/* Table Body */}
            {po.lines?.map((line, index) => (
              <View key={line.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCellCenter, { width: '5%' }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{line.itemCode || '-'}</Text>
                <View style={[styles.tableCell, { width: '28%' }]}>
                  <Text>{line.itemName}</Text>
                  {line.itemDescription && (
                    <Text style={{ fontSize: 9, color: '#6B7280' }}>{line.itemDescription}</Text>
                  )}
                </View>
                <Text style={[styles.tableCellCenter, { width: '8%' }]}>{line.uom || 'Nos'}</Text>
                <Text style={[styles.tableCellRight, { width: '10%' }]}>{line.quantity}</Text>
                <Text style={[styles.tableCellRight, { width: '15%' }]}>{formatCurrency(line.unitPrice)}</Text>
                <Text style={[styles.tableCellRight, { width: '19%', fontWeight: 'bold' }]}>
                  {formatCurrency(line.quantity * line.unitPrice)}
                </Text>
              </View>
            ))}

            {/* Totals */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '68%' }]}></Text>
              <Text style={[styles.tableCellRight, { width: '15%', fontWeight: 'bold' }]}>Subtotal</Text>
              <Text style={[styles.tableCellRight, { width: '17%' }]}>₹{formatNumber(totals.subtotal)}</Text>
            </View>

            {totals.discount > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '68%' }]}></Text>
                <Text style={[styles.tableCellRight, { width: '15%', color: '#DC2626' }]}>Discount</Text>
                <Text style={[styles.tableCellRight, { width: '17%', color: '#DC2626' }]}>-₹{formatNumber(totals.discount)}</Text>
              </View>
            )}

            {totals.shipping > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '68%' }]}></Text>
                <Text style={[styles.tableCellRight, { width: '15%' }]}>Shipping</Text>
                <Text style={[styles.tableCellRight, { width: '17%' }]}>₹{formatNumber(totals.shipping)}</Text>
              </View>
            )}

            {totals.gst > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '68%' }]}></Text>
                <Text style={[styles.tableCellRight, { width: '15%' }]}>GST</Text>
                <Text style={[styles.tableCellRight, { width: '17%' }]}>₹{formatNumber(totals.gst)}</Text>
              </View>
            )}

            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCell, { width: '68%' }]}></Text>
              <Text style={[styles.tableCellRight, { width: '15%', fontSize: 12 }]}>GRAND TOTAL</Text>
              <Text style={[styles.tableCellRight, { width: '17%', fontSize: 13, color: '#2563EB' }]}>
                ₹{formatNumber(totals.grandTotal)}
              </Text>
            </View>
          </View>

          {/* PAYMENT TERMS & DELIVERY MODE */}
          <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Payment Terms</Text>
              <Text style={{ fontSize: 10, color: '#4B5563' }}>{po.paymentTerms || 'Net 30 days from invoice date'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Delivery Mode</Text>
              <Text style={{ fontSize: 10, color: '#4B5563' }}>{po.deliveryMode || 'Standard Delivery'}</Text>
            </View>
          </View>

          {/* REMARKS */}
          {po.remarks && (
            <View style={styles.remarksContainer}>
              <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 2 }]}>Remarks / Special Instructions</Text>
              <Text style={{ fontSize: 10, color: '#4B5563' }}>{po.remarks}</Text>
            </View>
          )}

          {/* FOOTER */}
          <View style={styles.footer}>
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 10, color: '#374151' }}>Authorized Signatory</Text>
              <View style={styles.signature}>
                <Text style={{ fontSize: 8 }}>(Signature)</Text>
              </View>
              <Text style={{ fontSize: 10, marginTop: 2 }}>Name: ____________________</Text>
              <Text style={{ fontSize: 10 }}>Date: {currentDate}</Text>
            </View>
            <View style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: 9, color: '#6B7280' }}>This is a computer-generated document.</Text>
              <Text style={{ fontSize: 9, color: '#6B7280' }}>{companyDetails.gst} | {companyDetails.pan}</Text>
              <Text style={{ fontSize: 9, color: '#2563EB', marginTop: 3, fontWeight: 'bold' }}>
                Thank you for your business!
              </Text>
            </View>
          </View>

          {/* TERMS & CONDITIONS */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsTitle}>Terms & Conditions:</Text>
            <View style={styles.termsList}>
              <Text style={styles.termsItem}>1. Goods subject to inspection and approval upon delivery.</Text>
              <Text style={styles.termsItem}>2. Discrepancies must be reported within 7 days.</Text>
              <Text style={styles.termsItem}>3. Payment terms as agreed upon.</Text>
              <Text style={styles.termsItem}>4. PO valid for 30 days from issue date.</Text>
            </View>
          </View>

          {/* BOTTOM FOOTER */}
          <View style={styles.footerBottom}>
            <Text>{companyDetails.name} • {companyDetails.address} • {companyDetails.phone} • {companyDetails.email}</Text>
            <Text>PO: {po.poNumber} • Generated on: {currentDate} • Page 1 of 1</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}